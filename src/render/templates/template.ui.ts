import { Gems } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { gemHasItems, getGem, getGemType } from '@/engine/systems/gem';
import { getTileAtPosition } from '@/engine/systems/position';
import { getSpritePath } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';
import {
    checkElement,
    createButton,
    createElement,
    destroyElement,
    getElement,
    setAdminMode,
    setAllOtherGemsMode,
    setGemMode,
    setTileMode,
} from '@/render/templates';

//#region TEMPLATES
export const createUI = () => {
    createLoading();
    createInfo();
    createGemView();
    createGems();
    createQuests();
};

export const setUIMode = ({ mode }: { mode: 'base' | 'request' }) => {
    const uiEl = getElement({ elId: 'UI' });

    if (mode === 'base')
        uiEl.classList.remove('request');
    else if (mode === 'request')
        uiEl.classList.add('request');
};

//#region LOADING
const createLoading = () => {
    createElement({
        css: 'loading',
        id: 'Loading',
        parent: 'UI',
    });

    createElement({
        absolute: false,
        css: 'loader',
        id: 'Loader',
        parent: 'Loading',
    });
};

export const displayLoading = ({ load }: { load: boolean }) => {
    const loading = getElement({ elId: 'Loading' });

    loading.style.display = (load)
        ? 'flex'
        : 'none';
};
//#endregion

//#region MESSAGE
//#region CONSTANTS
const INFO_TIMEOUT = 3000;
const MAX_INFO_COUNT = 3;
//#endregion

const createInfo = () => {
    createElement({
        css: 'alerts',
        id: 'Infos',
        parent: 'app',
    });
};

const addInfo = ({ text, alert }: {
    alert?: boolean
    text: string
}) => {
    createElement({
        absolute: false,
        css: 'alert',
        id: `Info-${text}`,
        parent: 'Infos',
        text: (alert)
            ? `⚠ ${text} ⚠`
            : text,
    });
};

const removeInfo = () => {
    const infosEl = getElement({ elId: 'Infos' });

    if (!(infosEl.children.length)) return;

    infosEl.removeChild(infosEl.children[0]);
};

export const displayInfo = ({ text, alert }: {
    alert: boolean
    text: string
}) => {
    const infosEl = getElement({ elId: 'Infos' });
    if (infosEl.children.length >= MAX_INFO_COUNT) {
        removeInfo();
    }

    addInfo({ alert, text });

    setTimeout(() => removeInfo(), INFO_TIMEOUT);
};
//#endregion

//#region GEM
//#region CONSTANTS
let CURRENT_GEM_ID: string | null = null;
//#endregion

//#region CREATE
const createGemView = () => {
    createElement({
        css: 'gem-view',
        id: 'GemView',
        parent: 'UI',
    });

    createElement({
        css: 'gem-view-placeholder',
        id: 'GemViewPlaceholder',
        image: getSpritePath({ spriteName: 'ui_gem_placeholder' }),
        parent: 'UI',
    });

    onBlurGemView();
};

const createGemInfo = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gem = getGem({ gemId });
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    createElement({
        css: 'sprite',
        id: 'GemSprite',
        image: gemSprite._image,
        parent: 'GemView',
    });

    createElement({
        absolute: false,
        css: 'data',
        id: 'GemData',
        parent: 'GemView',
    });

    createElement({
        absolute: false,
        css: 'id',
        id: 'GemId',
        parent: 'GemData',
        text: gemId,
    });

    createElement({
        absolute: false,
        css: 'type',
        id: 'GemType',
        parent: 'GemData',
        text: `Type: ${gemType}`,
    });

    createElement({
        absolute: false,
        css: 'state',
        id: 'GemState',
        parent: 'GemData',
        text: `State: ${gemState._action}`,
    });

    if (gemHasItems(gem)) {
        createElement({
            absolute: false,
            css: 'items',
            id: 'GemItems',
            parent: 'GemData',
            text: `Items: ${gem.items.map((item) => `(${item._name} ${item._amount})`)}`,
        });
    }
};

const createGemActions = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemMove = gemState._action === 'move';
    const gemWork = gemState._action === 'work';

    createElement({
        absolute: false,
        css: 'actions',
        id: 'GemActions',
        parent: 'GemView',
    });

    createButton({
        absolute: false,
        click: () => onClickGemStore(),
        css: 'action',
        id: 'GemStore',
        parent: 'GemActions',
        text: 'Store',
    });

    createButton({
        absolute: false,
        click: () => onClickGemMove(),
        css: 'action',
        id: 'GemMove',
        parent: 'GemActions',
        text: (gemMove)
            ? 'Cancel'
            : 'Move',
    });

    createButton({
        absolute: false,
        click: () => onClickGemWork(),
        css: 'action',
        id: `Gem${gemType}`,
        parent: 'GemActions',
        text: (gemWork)
            ? 'Cancel'
            : gemType,
    });
};
//#endregion

//#region UPDATE
const updateGemView = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    clearGemView();

    createButton({
        click: () => displayGemView({ display: false, gemId }),
        css: 'close',
        id: 'GemClose',
        image: getSpritePath({ spriteName: 'ui_close' }),
        parent: 'GemView',
    });

    createGemInfo();
    createGemActions();
};

export const updateGemInfo = ({ gemId }: { gemId?: string }) => {
    if (!(gemId)) gemId = (CURRENT_GEM_ID) ?? error({
        message: 'No gemId provided',
        where: updateGemInfo.name,
    });

    const isGemUIOpen = checkElement({ id: 'GemId' });
    if (!(isGemUIOpen)) return;
    const gemIdEl = getElement({ elId: 'GemId' });
    if (gemIdEl.innerText !== gemId) return;

    const gem = getGem({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    const gemStateEl = getElement({ elId: 'GemState' });
    gemStateEl.innerText = `State: ${gemState._action}`;

    if (gemHasItems(gem)) {
        const gemItemsEl = getElement({ elId: 'GemItems' });
        gemItemsEl.innerText = `Items: ${gem.items.map((item) => `(${item._name} ${item._amount})`)}`;
    }
};

export const updateGemActions = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const isGemUIOpen = checkElement({ id: 'GemId' });
    if (!(isGemUIOpen)) return;
    const gemUIIdEl = getElement({ elId: 'GemId' });
    if (gemUIIdEl.innerText !== gemId) return;

    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemMove = gemState._action === 'move';
    const gemWork = gemState._action === 'work';

    const gemMoveEl = getElement({ elId: 'GemMove' });
    gemMoveEl.innerText = (gemMove)
        ? 'Cancel'
        : 'Move';

    const gemWorkEl = getElement({ elId: `Gem${gemType}` });
    gemWorkEl.innerText = (gemWork)
        ? 'Cancel'
        : gemType;
};
//#endregion

//#region ACTIONS
const clearGemView = () => {
    const gemUIEl = getElement({ elId: 'GemView' });
    gemUIEl.innerHTML = '';
};

// const placeGemUI = ({ gemId }: { gemId: string }) => {
//     const gemUIEl = getElement({ elId: 'Gem' });

//     const gemEntityEl = getElement({ elId: gemId });
//     const gemRect = gemEntityEl.getBoundingClientRect();

//     let gemUITop = gemRect.top - gemUIEl.offsetHeight;
//     if (gemUITop < 0) {
//         gemUITop = gemRect.bottom;
//     }
//     if (gemUITop + gemUIEl.offsetHeight > window.innerHeight) {
//         gemUITop = window.innerHeight - gemUIEl.offsetHeight;
//     }

//     let gemUILeft = gemRect.left;
//     if (gemUILeft < 0) {
//         gemUILeft = gemRect.right - gemUIEl.offsetWidth;
//     }
//     if (gemUILeft + gemUIEl.offsetWidth > window.innerWidth) {
//         gemUILeft = window.innerWidth - gemUIEl.offsetWidth;
//     }

//     gemUIEl.style.top = `${gemUITop}px`;
//     gemUIEl.style.left = `${gemUILeft}px`;
// };

const onClickGemStore = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        displayGemView({ display: false, gemId });

        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_STORE });
    }
    else if (gemState._action === 'move') {
        emit({
            data: `${gemId} is already moving`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (gemState._action === 'work') {
        emit({
            data: `${gemId} is already working`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};

const onClickGemMove = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        displayGemView({ display: false, gemId });

        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MOVE_REQUEST });
    }
    else if (gemState._action === 'move') {
        updateGemActions();

        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MOVE_CANCEL });
    }
    else if (gemState._action === 'work') {
        onClickGemCancel();
        displayGemView({ display: false, gemId });

        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MOVE_REQUEST });
    }
};

const onClickGemWork = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        updateGemActions();
        onClickGemIdle();
    }
    else if (gemState._action === 'move') {
        updateGemActions();

        emit({
            data: `${gemId} is already moving`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (gemState._action === 'work') {
        onClickGemCancel();
        updateGemActions();
    }
};

const onClickGemIdle = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemType = getGemType({ gemId });

    displayGemView({ display: false, gemId });

    if (gemType === Gems.MINE) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MINE_REQUEST });
    }
    else if (gemType === Gems.CARRY) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_CARRY_REQUEST });
    }
    else if (gemType === Gems.TUNNEL) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_TUNNEL_REQUEST });
    }
    else if (gemType === Gems.LIFT) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_LIFT_REQUEST });
    }
};

const onClickGemCancel = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemType = getGemType({ gemId });

    if (gemType === Gems.MINE) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MINE_CANCEL });
    }
    else if (gemType === Gems.CARRY) {
        displayGemPath({ display: false });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_CARRY_CANCEL });
    }
    else if (gemType === Gems.TUNNEL) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_TUNNEL_CANCEL });
    }
    else if (gemType === Gems.LIFT) {
        displayGemPath({ display: false });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_LIFT_CANCEL });
    }
};

const onBlurGemView = () => {
    document.addEventListener('click', (e) => {
        if (!(checkElement({ id: 'GemView' }))) return;
        if (!(CURRENT_GEM_ID)) return;

        const gemEl = getElement({ elId: 'GemView' });
        const target = e.target as HTMLElement;
        if (target.id.includes('Gem')) return;

        if ((gemEl) && !(gemEl.contains(target)) && gemEl.style.display === 'flex') {
            displayGemView({ display: false, gemId: CURRENT_GEM_ID });
        }
    });
};

const displayGemPath = ({ display }: { display: boolean }) => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;
    const gemType = getGemType({ gemId });

    if (gemType === Gems.CARRY || gemType === Gems.LIFT) {
        const gem = getComponent({ componentId: gemType, entityId: gemId });
        const gemState = getComponent({ componentId: 'State', entityId: gemId });

        if (gemState._action === 'work') {
            if (
                gem._moveStartX !== undefined
                && gem._moveStartY !== undefined
                && gem._moveTargetX !== undefined
                && gem._moveTargetY !== undefined
            ) {
                const tileStart = getTileAtPosition({ x: gem._moveStartX, y: gem._moveStartY });
                setTileMode({ mode: 'move', remove: !(display), tileId: tileStart });

                const tileTarget = getTileAtPosition({ x: gem._moveTargetX, y: gem._moveTargetY });
                setTileMode({ mode: 'move', remove: !(display), tileId: tileTarget });
            }
        }
    }
};
//#endregion

export const displayGemView = ({ gemId, display }: {
    display: boolean,
    gemId?: string,
}) => {
    const gemEl = getElement({ elId: 'GemView' });
    const gemPlaceholderEl = getElement({ elId: 'GemViewPlaceholder' });

    gemEl.style.display = (display)
        ? 'flex'
        : 'none';

    gemPlaceholderEl.style.display = (display)
        ? 'none'
        : 'flex';

    if (display) {
        if (!(gemId)) return;

        CURRENT_GEM_ID = gemId;

        updateGemView();
        setGemMode({ gemId, mode: 'request' });
        setGemMode({ gemId, mode: 'hover', remove: true });
        setAllOtherGemsMode({ gemId, mode: 'disable' });
        setAdminMode({ mode: 'disable' });
        displayGemPath({ display: true });
    }
    else {
        if (!(gemId) && CURRENT_GEM_ID) gemId = CURRENT_GEM_ID;
        if (!(gemId)) return;

        setGemMode({ gemId, mode: 'request', remove: true });
        setGemMode({ gemId, mode: 'hover', remove: true });
        setAllOtherGemsMode({ gemId, mode: 'disable', remove: true });
        setAdminMode({ mode: 'base' });
        displayGemPath({ display: false });

        CURRENT_GEM_ID = null;
    }
};
//#endregion

//#region GEMS
//#region CONSTANTS
let GEMS_PAGE_INDEX = 0;
const GEMS_AMOUNT_PER_PAGE = 4;
//#endregion

//#region CREATE
const createGems = () => {
    createElement({
        id: 'Gems',
        parent: 'UI',
    });

    createButton({
        click: () => displayGemsUI({ display: true }),
        css: 'gems-placeholder',
        id: 'GemsPlaceholder',
        image: getSpritePath({ spriteName: 'ui_gems_placeholder' }),
        parent: 'UI',
    });

    createElement({
        absolute: false,
        css: 'page',
        id: 'GemsPage',
        parent: 'Gems',
    });

    createGemsActions();
    onHoverGems();
};

const createGemsActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'GemsActions',
        parent: 'Gems',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'previous' }),
        css: 'action',
        id: 'GemsPagePrevious',
        parent: 'GemsActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'next' }),
        css: 'action',
        id: 'GemsPageNext',
        parent: 'GemsActions',
        text: '>',
    });

    createElement({
        css: 'index',
        id: 'GemsPageIndex',
        parent: 'GemsActions',
        text: '0/0',
    });

    createButton({
        click: () => displayGemsUI({ display: false }),
        css: 'close',
        id: 'GemsClose',
        image: getSpritePath({ spriteName: 'ui_close' }),
        parent: 'GemsActions',
    });
};

const createGem = ({ gemId }: { gemId: string }) => {
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    createElement({
        absolute: false,
        css: 'gem',
        id: `Gem${gemId}`,
        parent: 'GemsPage',
    });

    createElement({
        absolute: false,
        css: 'sprite',
        id: `GemSprite${gemId}`,
        image: gemSprite._image,
        parent: `Gem${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'label',
        id: `GemLabel${gemId}`,
        parent: `Gem${gemId}`,
        text: gemId,
    });

    createButton({
        absolute: false,
        click: () => onClickGems({ gemId }),
        css: 'view',
        id: `GemView${gemId}`,
        parent: `Gem${gemId}`,
        text: 'View',
    });
};
//#endregion

//#region UPDATE
export const updateGems = () => {
    const admin = getAdmin();

    for (const gem of admin.gems) {
        const gemElExist = checkElement({ id: `Gem${gem}` });
        const gemState = getComponent({ componentId: 'State', entityId: gem });

        if (gemElExist) {
            if (gemState._store) {
                destroyElement({ elId: `Gem${gem}` });
            }
        }
        else {
            if (!(gemState._store)) {
                createGem({ gemId: gem });
            }
        }
    }

    updateGemsPage();
};

const updateGemsPage = () => {
    const gemsPageEl = getElement({ elId: 'GemsPage' });
    const gemsPagesCount = Math.ceil(gemsPageEl.children.length / GEMS_AMOUNT_PER_PAGE);
    const gemsPageIndexEl = getElement({ elId: 'GemsPageIndex' });
    gemsPageIndexEl.innerText = `${GEMS_PAGE_INDEX + 1}/${gemsPagesCount || 1}`;

    if (!(gemsPageEl.children.length)) return;

    for (let i = 0; i < gemsPageEl.children.length; i++) {
        const gemEl = gemsPageEl.children[i] as HTMLElement;
        gemEl.style.display = 'none';
    }

    const gemStartIndex = GEMS_PAGE_INDEX * GEMS_AMOUNT_PER_PAGE;
    const gemEndIndex = gemStartIndex + GEMS_AMOUNT_PER_PAGE;
    for (let j = gemStartIndex; j < gemEndIndex; j++) {
        if (j >= gemsPageEl.children.length) break;

        const gemEl = gemsPageEl.children[j] as HTMLElement;

        gemEl.style.display = 'flex';
    }
};
//#endregion

//#region ACTIONS
const onClickGemsPage = ({ action }: { action: 'previous' | 'next' }) => {
    const gemsPageEl = getElement({ elId: 'GemsPage' });
    const gemsPagesCount = Math.ceil(gemsPageEl.children.length / GEMS_AMOUNT_PER_PAGE);

    if (!(gemsPageEl.children.length)) return;

    if (action === 'previous') {
        GEMS_PAGE_INDEX = Math.max(0, GEMS_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        GEMS_PAGE_INDEX = Math.min(GEMS_PAGE_INDEX + 1, gemsPagesCount - 1);
    }

    updateGemsPage();
};

const onClickGems = ({ gemId }: { gemId: string }) => {
    const gemEl = getElement({ elId: 'GemView' });
    if (!(gemEl)) return;
    if (gemEl.style.display === 'flex') {
        displayGemView({ display: false });
    }

    displayGemView({ display: true, gemId });
};

const onHoverGems = () => {
    const gemsPageEl = getElement({ elId: 'GemsPage' });

    gemsPageEl.addEventListener('mouseenter', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target !== gemsPageEl) {
            const gemId = target.id.replace('GemView', '');

            setGemMode({
                gemId,
                mode: (gemId === CURRENT_GEM_ID)
                    ? 'request'
                    : 'hover',
            });
        }
    }, true);

    gemsPageEl.addEventListener('mouseleave', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target !== gemsPageEl) {
            const gemId = target.id.replace('GemView', '');

            if (gemId === CURRENT_GEM_ID) return;
            setGemMode({ gemId, mode: 'hover', remove: true });
        }
    }, true);
};
//#endregion

export const displayGemsUI = ({ display }: { display: boolean }) => {
    const gemsEl = getElement({ elId: 'Gems' });
    const gemsPlaceholderEl = getElement({ elId: 'GemsPlaceholder' });

    gemsEl.style.display = (display)
        ? 'flex'
        : 'none';

    gemsPlaceholderEl.style.display = (display)
        ? 'none'
        : 'flex';

    if (display) {
        updateGems();
        updateGemsPage();
    }
};
//#endregion

//#region QUEST
const createQuests = () => {
    createElement({
        id: 'Quests',
        parent: 'UI',
    });
};

const createQuest = ({ name, progress, total, text }: {
    name: string,
    progress: number,
    text: string,
    total: number,
}) => {
    createElement({
        absolute: false,
        css: 'quest',
        id: `Quest-${name}`,
        parent: 'Quests',
        text: `${text}: ${progress}/${total}`,
    });
};

const updateQuest = ({ name, progress, total, text }: {
    name: string,
    progress: number,
    text: string,
    total: number,
}) => {
    const questEl = getElement({ elId: `Quest-${name}` });

    questEl.innerText = `${text}: ${progress}/${total}`;
};

const removeQuest = ({ name }: { name: string }) => {
    destroyElement({ elId: `Quest-${name}` });
};

export const updateQuests = () => {
    const admin = getAdmin();

    for (const quest of admin.quests) {
        const questEl = checkElement({ id: `Quest-${quest.data.name}` });

        if (quest._done) {
            if (questEl) {
                removeQuest({ name: quest.data.name });
            }

            continue;
        }

        if (!(questEl)) {
            createQuest({
                name: quest.data.name,
                progress: quest._progress,
                text: quest.data.text,
                total: (quest.data.type === 'mine')
                    ? quest.data.mine.amount
                    : quest.data.carry,
            });
        }
        else {
            updateQuest({
                name: quest.data.name,
                progress: quest._progress,
                text: quest.data.text,
                total: (quest.data.type === 'mine')
                    ? quest.data.mine.amount
                    : quest.data.carry,
            });
        }
    }
};

export const displayQuests = ({ display }: { display: boolean }) => {
    const questsEl = getElement({ elId: 'Quests' });

    questsEl.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion
//#endregion
