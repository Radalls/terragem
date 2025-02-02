import { Gems } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { gemHasItems, getGem, getGemType, isGemUnlocked } from '@/engine/systems/gem';
import { getTileAtPosition } from '@/engine/systems/position';
import { getQuestData } from '@/engine/systems/quest';
import { getSpritePath } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';
import {
    checkElement,
    createButton,
    createElement,
    createProgress,
    destroyElement,
    displayAdminMenu,
    getElement,
    setAdminMode,
    setAllGemsMode,
    setGemMode,
    setTileMode,
    updateProgress,
} from '@/render/templates';

//#region TEMPLATES
export const createUI = () => {
    createAlerts();
    createGemView();
    createGems();
    createAdminUI();
    createQuests();
};

export const setUIMode = ({ mode }: { mode: 'base' | 'request' }) => {
    const uiEl = getElement({ elId: 'UI' });

    if (mode === 'base') {
        uiEl.classList.remove('request');
    }
    else if (mode === 'request') {
        uiEl.classList.add('request');
    }
};

//#region ALERTS
//#region CONSTANTS
const ALERT_CONFIRM_TIMEOUT = 3000;
const ALERT_WARNING_TIMEOUT = 3000;
const ALERT_ERROR_TIMEOUT = 5000;
const ALERT_SUCCESS_TIMEOUT = 5000;
const MAX_ALERT_COUNT = 5;
const ALERT_CONFIRM_COLOR = '#85879B';
const ALERT_WARNING_COLOR = '#F3A72D';
const ALERT_ERROR_COLOR = '#D02929';
const ALERT_SUCCESS_COLOR = '#30CB48;';
//#endregion

const createAlerts = () => {
    createElement({
        css: 'alerts col align disable full-w g-4 p-box',
        id: 'Alerts',
        parent: 'app',
    });
};

const addAlert = ({ text, type, alert }: {
    alert?: boolean,
    text: string,
    type: 'confirm' | 'success' | 'warning' | 'error' | 'quest',
}) => {
    const infoEl = createElement({
        absolute: false,
        css: 'alert btn t-18 p-box',
        id: 'Alert',
        parent: 'Alerts',
        text: (alert)
            ? `⚠ ${text} ⚠`
            : text,
    });

    if (type === 'confirm') {
        infoEl.style.backgroundColor = ALERT_CONFIRM_COLOR;

        emit({ data: { audioName: 'main_confirm' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (type === 'success') {
        infoEl.style.backgroundColor = ALERT_SUCCESS_COLOR;

        emit({ data: { audioName: 'main_success' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (type === 'warning') {
        infoEl.style.backgroundColor = ALERT_WARNING_COLOR;

        emit({ data: { audioName: 'main_warning' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (type === 'error') {
        infoEl.style.backgroundColor = ALERT_ERROR_COLOR;

        emit({ data: { audioName: 'main_error' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (type === 'quest') {
        const questData = getQuestData({ questName: text });

        const questReward = questData.reward.map(reward => (reward.type === 'item')
            ? `${reward.name} x${reward.amount}`
            : `LabPoint x${reward.amount}`
        ).join(', ');

        infoEl.style.backgroundColor = ALERT_SUCCESS_COLOR;
        infoEl.innerText = `${questData.text} complete ! (${questReward})`;

        emit({ data: { audioName: 'main_success' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
};

const removeAlert = () => {
    const infosEl = getElement({ elId: 'Alerts' });

    if (!(infosEl.children.length)) return;

    infosEl.removeChild(infosEl.children[0]);
};

export const displayAlert = ({ text, type, alert }: {
    alert?: boolean,
    text: string,
    type: 'confirm' | 'success' | 'warning' | 'error' | 'quest',
}) => {
    const infosEl = getElement({ elId: 'Alerts' });
    if (infosEl.children.length >= MAX_ALERT_COUNT) {
        removeAlert();
    }

    addAlert({ alert, text, type });

    let timeout = 0;

    if (type === 'confirm') {
        timeout = ALERT_CONFIRM_TIMEOUT;
    }
    else if (type === 'success') {
        timeout = ALERT_SUCCESS_TIMEOUT;
    }
    else if (type === 'warning') {
        timeout = ALERT_WARNING_TIMEOUT;
    }
    else if (type === 'error') {
        timeout = ALERT_ERROR_TIMEOUT;
    }
    else if (type === 'quest') {
        timeout = ALERT_SUCCESS_TIMEOUT;
    }

    setTimeout(
        () => removeAlert(),
        timeout
    );
};
//#endregion

//#region GEM
//#region CONSTANTS
let CURRENT_GEM_ID: string | null = null;
//#endregion

//#region CREATE
const createGemView = () => {
    createElement({
        css: 'gem-view frame col left hidden enable w-25 g-16 p-16',
        id: 'GemView',
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
        absolute: false,
        css: 'col g-8',
        id: 'GemData',
        parent: 'GemView',
    });

    createElement({
        absolute: false,
        css: 'row left g-16 t-l',
        id: 'GemInfo1',
        parent: 'GemData',
    });

    createElement({
        absolute: false,
        css: 'row left g-16 t-l',
        id: 'GemInfo2',
        parent: 'GemData',
    });

    createElement({
        absolute: false,
        css: 'sprite',
        id: 'GemSprite',
        image: gemSprite._image,
        parent: 'GemInfo1',
    });

    createElement({
        absolute: false,
        css: 'hidden',
        id: 'GemId',
        parent: 'GemData',
        text: gemId,
    });

    createElement({
        absolute: false,
        id: 'GemName',
        parent: 'GemInfo1',
        text: gem._name,
    });

    createElement({
        absolute: false,
        id: 'GemType',
        parent: 'GemInfo1',
        text: `Type: ${gemType}`,
    });

    createElement({
        absolute: false,
        id: 'GemState',
        parent: 'GemInfo2',
        text: `State: ${gemState._action}`,
    });

    createElement({
        absolute: false,
        id: 'GemLevel',
        parent: 'GemInfo2',
        text: `Lvl: ${gem._xpLvl}`,
    });

    if (gemHasItems(gem)) {
        createGemInventory();
    }
};

const createGemInventory = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gem = getGem({ gemId });

    if (!(gemHasItems(gem))) return;

    createElement({
        absolute: false,
        css: 'row left g-8 h-15 t-l',
        id: 'GemItems',
        parent: 'GemData',
        text: 'Items: ',
    });

    updateGemInventory();
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
        css: 'row align full g-16',
        id: 'GemActions',
        parent: 'GemView',
    });

    createButton({
        absolute: false,
        click: () => onClickGemStore(),
        id: 'GemStore',
        parent: 'GemActions',
        text: 'Store',
    });

    createButton({
        absolute: false,
        click: () => onClickGemMove(),
        id: 'GemMove',
        parent: 'GemActions',
        text: (gemMove)
            ? 'Cancel'
            : 'Move',
    });

    createButton({
        absolute: false,
        click: () => onClickGemWork(),
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
        css: 'close p-4',
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

    const isGemUIOpen = checkElement({ elId: 'GemId' });
    if (!(isGemUIOpen)) {
        return;
    }

    const gemIdEl = getElement({ elId: 'GemId' });
    if (gemIdEl.innerText !== gemId) return;

    const gem = getGem({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    const gemNameEl = getElement({ elId: 'GemName' });
    gemNameEl.innerText = gem._name;

    const gemStateEl = getElement({ elId: 'GemState' });
    gemStateEl.innerText = `State: ${gemState._action}`;

    const gemSpriteEl = getElement({ elId: 'GemSprite' });
    gemSpriteEl.style.backgroundImage = `url("${gemSprite._image}")`;

    const gemLevelEl = getElement({ elId: 'GemLevel' });
    gemLevelEl.innerText = `Lvl: ${gem._xpLvl}`;

    if (gemHasItems(gem)) {
        updateGemInventory();
    }
};

const updateGemInventory = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gem = getGem({ gemId });

    if (!(gemHasItems(gem))) return;

    const gemItemsEl = getElement({ elId: 'GemItems' });
    gemItemsEl.innerHTML = '';
    gemItemsEl.innerText = 'Items: ';

    for (const item of gem.items) {
        createElement({
            absolute: false,
            css: 'item row align p-4',
            id: `GemItem${item._name}`,
            parent: 'GemItems',
        });

        createElement({
            absolute: false,
            css: 'icon',
            id: `GemItemIcon${item._name}`,
            image: getSpritePath({ spriteName: `resource_${item._name.toLowerCase()}` }),
            parent: `GemItem${item._name}`,
        });

        createElement({
            absolute: false,
            css: 't-12',
            id: `GemItemAmount${item._name}`,
            parent: `GemItem${item._name}`,
            text: `x${item._amount}`,
        });
    }
};

const updateGemActions = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const isGemUIOpen = checkElement({ elId: 'GemId' });
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

const onClickGemStore = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gem = getGem({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        displayGemView({ display: false, gemId });

        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_STORE });
        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (gemState._action === 'move') {
        emit({
            data: { text: `${gem._name} is already moving`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (gemState._action === 'work') {
        emit({
            data: { text: `${gem._name} is already working`, type: 'warning' },
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
        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (gemState._action === 'move') {
        onClickGemCancel();

        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
        updateGemActions();
    }
    else if (gemState._action === 'work') {
        onClickGemCancel();
        displayGemView({ display: false, gemId });

        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MOVE_REQUEST });
        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
};

const onClickGemWork = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gem = getGem({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        updateGemActions();
        onClickGemIdle();

        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
    else if (gemState._action === 'move') {
        updateGemActions();

        emit({
            data: { text: `${gem._name} is already moving`, type: 'warning' },
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

    //TODO: make generic
    if (gemType === Gems.CARRY) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_CARRY_REQUEST });
    }
    else if (gemType === Gems.FLOOR) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_FLOOR_REQUEST });
    }
    else if (gemType === Gems.LIFT) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_LIFT_REQUEST });
    }
    else if (gemType === Gems.MINE) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MINE_REQUEST });
    }
    else if (gemType === Gems.SHAFT) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_SHAFT_REQUEST });
    }
    else if (gemType === Gems.TUNNEL) {
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_TUNNEL_REQUEST });
    }
};

const onClickGemCancel = () => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;

    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'move') {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MOVE_CANCEL });
    }

    if (gemType === Gems.CARRY) {
        displayGemPath({ display: false });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_CARRY_CANCEL });
    }
    else if (gemType === Gems.FLOOR) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_FLOOR_CANCEL });
    }
    else if (gemType === Gems.LIFT) {
        displayGemPath({ display: false });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_LIFT_CANCEL });
    }
    else if (gemType === Gems.MINE) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MINE_CANCEL });
    }
    else if (gemType === Gems.SHAFT) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_SHAFT_CANCEL });
    }
    else if (gemType === Gems.TUNNEL) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_TUNNEL_CANCEL });
    }
};

const onBlurGemView = () => {
    document.addEventListener('click', (e) => {
        if (!(checkElement({ elId: 'GemView' }))) return;
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
                const { tileId: tileStart } = getTileAtPosition({ x: gem._moveStartX, y: gem._moveStartY });
                setTileMode({ mode: 'path', remove: !(display), tileId: tileStart });

                const { tileId: tileTarget } = getTileAtPosition({ x: gem._moveTargetX, y: gem._moveTargetY });
                setTileMode({ mode: 'path', remove: !(display), tileId: tileTarget });
            }
        }
    }
};

const displayHighlights = ({ display }: { display: boolean }) => {
    if (!(CURRENT_GEM_ID)) return;
    const gemId = CURRENT_GEM_ID;
    const gemType = getGemType({ gemId });

    if (gemType === Gems.LIFT) {
        const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });
        const gemState = getComponent({ componentId: 'State', entityId: gemId });

        if (gemState._action === 'work') {
            if (
                gemLift._moveStartX !== undefined
                && gemLift._moveStartY !== undefined
                && gemLift._moveTargetX !== undefined
                && gemLift._moveTargetY !== undefined
            ) {
                const carryIds = [];
                const { tile: startTile } = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY });
                carryIds.push(...startTile.carry);

                const { tile: targetTile } = getTileAtPosition({ x: gemLift._moveTargetX, y: gemLift._moveTargetY });
                carryIds.push(...targetTile.carry);

                for (const carryId of carryIds) {
                    setGemMode({ gemId: carryId, mode: 'request', remove: !(display) });
                }
            }
        }
    }
    else if (gemType === Gems.MINE) {
        const admin = getAdmin();

        const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
        const gemState = getComponent({ componentId: 'State', entityId: gemId });

        if (gemState._action === 'work') {
            const searchRange = Math.round(admin.stats._gemCarryItemRange * 2);

            const carryIds = [];
            let searchCount = 0;
            while (carryIds.length === 0) {
                if (searchCount > searchRange) break;

                const { tile } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y - searchCount });
                if (tile.carry.length) {
                    carryIds.push(...tile.carry);
                }

                searchCount++;
            }

            for (const carryId of carryIds) {
                setGemMode({ gemId: carryId, mode: 'request', remove: !(display) });
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

    gemEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        if (!(gemId)) return;

        CURRENT_GEM_ID = gemId;

        updateGemView();

        setGemMode({ gemId, mode: 'request' });
        setGemMode({ gemId, mode: 'disable', remove: true });
        setGemMode({ gemId, mode: 'hover', remove: true });

        setAllGemsMode({ gemId, mode: 'disable' });
        setAllGemsMode({ gemId, mode: 'request', remove: true });
        setAllGemsMode({ gemId, mode: 'hover', remove: true });

        setAdminMode({ mode: 'disable' });

        displayGemPath({ display: true });
        displayHighlights({ display: true });
    }
    else {
        if (!(gemId) && CURRENT_GEM_ID) gemId = CURRENT_GEM_ID;
        if (!(gemId)) return;

        setGemMode({ gemId, mode: 'request', remove: true });
        setGemMode({ gemId, mode: 'hover', remove: true });
        setGemMode({ gemId, mode: 'disable', remove: true });

        setAllGemsMode({ gemId, mode: 'disable', remove: true });
        setAllGemsMode({ gemId, mode: 'request', remove: true });
        setAllGemsMode({ gemId, mode: 'hover', remove: true });

        setAdminMode({ mode: 'base' });

        displayGemPath({ display: false });
        displayHighlights({ display: false });

        CURRENT_GEM_ID = null;
    }

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion

//#region GEMS
//#region CONSTANTS
enum GemsTabs {
    // eslint-disable-next-line typescript-sort-keys/string-enum
    MINE = 'gem_mine',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    CARRY = 'gem_carry',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    TUNNEL = 'gem_tunnel',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    LIFT = 'gem_lift',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    FLOOR = 'gem_floor',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    SHAFT = 'gem_shaft',
}

const tabsToGems = {
    [GemsTabs.MINE]: Gems.MINE,
    [GemsTabs.CARRY]: Gems.CARRY,
    [GemsTabs.TUNNEL]: Gems.TUNNEL,
    [GemsTabs.LIFT]: Gems.LIFT,
    [GemsTabs.FLOOR]: Gems.FLOOR,
    [GemsTabs.SHAFT]: Gems.SHAFT,
};

let GEMS_PAGE_INDEX = 0;
const GEMS_AMOUNT_PER_PAGE = 4;
let GEMS_TAB_INDEX = 0;
let DISPLAY_ALL_GEMS = true;
//#endregion

//#region CREATE
const createGems = () => {
    createElement({
        css: 'gems frame col hidden enable w-25 h-50 g-8 p-8 t-16',
        id: 'Gems',
        parent: 'UI',
    });

    createButton({
        click: () => displayGemsUI({ display: true }),
        css: 'gems-icon enable',
        id: 'GemsIcon',
        image: getSpritePath({ spriteName: 'ui_gems_placeholder' }),
        parent: 'UI',
        title: 'Gems',
    });

    createElement({
        absolute: false,
        css: 'col disable full-h g-4 pt-32',
        id: 'GemsPage',
        parent: 'Gems',
    });

    createGemsActions();
    onHoverGems();
};

const createGemsActions = () => {
    createButton({
        click: () => displayGemsUI({ display: false }),
        css: 'close',
        id: 'GemsClose',
        image: getSpritePath({ spriteName: 'ui_close' }),
        parent: 'Gems',
    });

    createButton({
        click: () => onClickGemsAll(),
        css: 'all',
        id: 'GemsAll',
        image: getSpritePath({ spriteName: 'ui_gem_placeholder' }),
        parent: 'Gems',
        title: 'Filter All',
    });

    createButton({
        click: () => onClickGemsType(),
        css: 'type',
        id: 'GemsType',
        image: getSpritePath({ spriteName: Object.values(GemsTabs)[GEMS_TAB_INDEX] }),
        parent: 'Gems',
        title: 'Filter Type',
    });

    createElement({
        absolute: false,
        css: 'row align g-12',
        id: 'GemsActions',
        parent: 'Gems',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'previous' }),
        id: 'GemsPagePrevious',
        parent: 'GemsActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'next' }),
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
};

const createGem = ({ gemId }: { gemId: string }) => {
    const gem = getGem({ gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    createButton({
        absolute: false,
        click: () => onClickGems({ gemId }),
        css: 'row align enable g-32 p-box',
        id: `Gem${gemId}`,
        parent: 'GemsPage',
    });

    createElement({
        absolute: false,
        css: 'sprite disable',
        id: `GemSprite${gemId}`,
        image: gemSprite._image,
        parent: `Gem${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'disable',
        id: `GemId${gemId}`,
        parent: `Gem${gemId}`,
        text: gem._name,
    });
};
//#endregion

//#region UPDATE
export const updateGems = () => {
    const admin = getAdmin();

    for (const gem of admin.gems) {
        const gemElExist = checkElement({ elId: `Gem${gem}` });
        const gemState = getComponent({ componentId: 'State', entityId: gem });

        if (gemElExist) {
            if (gemState._store) {
                destroyElement({ elId: `Gem${gem}` });
            }
            else {
                updateGem({ gemId: gem });
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

const updateGem = ({ gemId }: { gemId: string }) => {
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });
    const gemSpriteEl = getElement({ elId: `GemSprite${gemId}` });

    gemSpriteEl.style.backgroundImage = `url("${gemSprite._image}")`;
};

const updateGemsPage = () => {
    const gemsPagesCount = getGemsPagesCount();

    const gemsPageIndexEl = getElement({ elId: 'GemsPageIndex' });
    gemsPageIndexEl.innerText = `${GEMS_PAGE_INDEX + 1}/${gemsPagesCount || 1}`;
};
//#endregion

//#region ACTIONS
const onClickGemsPage = ({ action }: { action: 'previous' | 'next' }) => {
    const gemsPageEl = getElement({ elId: 'GemsPage' });
    const gemsPagesCount = getGemsPagesCount();

    if (!(gemsPageEl.children.length)) return;

    if (action === 'previous') {
        GEMS_PAGE_INDEX = Math.max(0, GEMS_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        GEMS_PAGE_INDEX = Math.min(GEMS_PAGE_INDEX + 1, gemsPagesCount - 1);
    }

    updateGemsPage();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const getGemsPagesCount = () => {
    const gemsPageEl = getElement({ elId: 'GemsPage' });
    const gemEls = Array.from(gemsPageEl.children) as HTMLElement[];

    const displayableGems = (DISPLAY_ALL_GEMS)
        ? gemEls
        : gemEls.filter(el => {
            const gemId = el.id.replace('Gem', '');
            const tabGemType = Object.values(GemsTabs)[GEMS_TAB_INDEX];

            return getGemType({ gemId }) === tabsToGems[tabGemType];
        });

    gemEls.forEach(el => el.style.display = 'none');

    const startIndex = GEMS_PAGE_INDEX * GEMS_AMOUNT_PER_PAGE;
    const endIndex = startIndex + GEMS_AMOUNT_PER_PAGE;

    displayableGems
        .slice(startIndex, endIndex)
        .forEach(el => el.style.display = 'flex');

    const totalPages = Math.ceil(displayableGems.length / GEMS_AMOUNT_PER_PAGE);

    return totalPages;
};

const onClickGemsAll = () => {
    DISPLAY_ALL_GEMS = true;
    GEMS_PAGE_INDEX = 0;

    updateGems();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemsType = () => {
    const gemsTabsCount = Object.values(GemsTabs).length;

    DISPLAY_ALL_GEMS = false;
    GEMS_PAGE_INDEX = 0;

    GEMS_TAB_INDEX = (GEMS_TAB_INDEX + 1) % gemsTabsCount;

    const gemType = tabsToGems[Object.values(GemsTabs)[GEMS_TAB_INDEX]];
    if (!(isGemUnlocked({ gemType }))) {
        GEMS_TAB_INDEX = 0;
    }

    const gemsTypeEl = getElement({ elId: 'GemsType' });
    gemsTypeEl.style.backgroundImage =
        `url("${getSpritePath({ spriteName: Object.values(GemsTabs)[GEMS_TAB_INDEX] })}")`;

    updateGems();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
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
            const gemId = target.id.replace('Gem', '');

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
            const gemId = target.id.replace('Gem', '');

            if (gemId === CURRENT_GEM_ID) return;

            setGemMode({ gemId, mode: 'hover', remove: true });
        }
    }, true);
};
//#endregion

export const displayGemsUI = ({ display }: { display: boolean }) => {
    const gemsEl = getElement({ elId: 'Gems' });
    const gemsPlaceholderEl = getElement({ elId: 'GemsIcon' });

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

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion

//#region ADMIN
const createAdminUI = () => {
    createButton({
        click: () => displayAdminMenu({ display: true }),
        css: 'admin-icon enable',
        id: 'AdminIcon',
        image: getSpritePath({ spriteName: 'ui_admin_placeholder' }),
        parent: 'UI',
        title: 'Admin',
    });
};

export const displayAdminUI = ({ display }: { display: boolean }) => {
    const adminPlaceholderEl = getElement({ elId: 'AdminIcon' });

    adminPlaceholderEl.style.display = (display)
        ? 'flex'
        : 'none';

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion

//#region QUEST
//#region CREATE
const createQuests = () => {
    createElement({
        css: 'quests frame col hidden enable w-20 g-8 p-8 t-10',
        id: 'Quests',
        parent: 'UI',
    });

    createButton({
        click: () => displayQuests({ display: true }),
        css: 'quests-icon enable',
        id: 'QuestsIcon',
        image: getSpritePath({ spriteName: 'ui_quests_placeholder' }),
        parent: 'UI',
        title: 'Quests',
    });

    createButton({
        click: () => displayQuests({ display: false }),
        css: 'close',
        id: 'QuestsClose',
        image: getSpritePath({ spriteName: 'ui_close' }),
        parent: 'Quests',
    });
};

const createQuest = ({ name, progress, total, text }: {
    name: string,
    progress: number,
    text: string,
    total: number,
}) => {
    const questData = getQuestData({ questName: name });

    createElement({
        absolute: false,
        id: `Quest-${name}`,
        parent: 'Quests',
    });

    createElement({
        css: 'icon',
        id: `QuestIcon-${name}`,
        image: getSpritePath({ spriteName: questData.image }),
        parent: `Quest-${name}`,
    });

    createProgress({
        absolute: false,
        css: 'quest btn t-12',
        id: `Quest-${name}`,
        parent: `Quest-${name}`,
        text: `${text}: ${progress}/${total}`,
        value: (progress / total) * 100,
    });
};

const removeQuest = ({ name }: { name: string }) => {
    destroyElement({ elId: `Quest-${name}` });
};
//#endregion

//#region UPDATE
export const updateQuests = () => {
    const admin = getAdmin();

    for (const quest of admin.quests) {
        const questEl = checkElement({ elId: `Quest-${quest._name}` });

        if (quest._done) {
            if (questEl) {
                removeQuest({ name: quest._name });
            }

            continue;
        }

        const questData = getQuestData({ questName: quest._name });
        const questTotal = (questData.type === 'mine')
            ? questData.mine.amount
            : (questData.type === 'carry')
                ? questData.carry
                : (questData.type === 'gem')
                    ? questData.gems
                    : (questData.type === 'forge')
                        ? questData.forge.amount
                        : 0;

        if (!(questEl)) {
            createQuest({
                name: quest._name,
                progress: quest._progress,
                text: questData.text,
                total: questTotal,
            });
        }
        else {
            updateQuest({
                name: quest._name,
                progress: quest._progress,
                text: questData.text,
                total: questTotal,
            });
        }
    }
};

const updateQuest = ({ name, progress, total, text }: {
    name: string,
    progress: number,
    text: string,
    total: number,
}) => {
    updateProgress({
        elId: `Quest-${name}`,
        text: `${text}: ${progress}/${total}`,
        value: (progress / total) * 100,
    });
};
//#endregion

export const displayQuests = ({ display }: { display: boolean }) => {
    const questsEl = getElement({ elId: 'Quests' });
    const questsPlaceholderEl = getElement({ elId: 'QuestsIcon' });

    questsEl.style.display = (display)
        ? 'flex'
        : 'none';

    questsPlaceholderEl.style.display = (display)
        ? 'none'
        : 'flex';

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion
//#endregion
