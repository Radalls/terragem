import { Gems } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { EngineEvents } from '@/engine/services/event';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { getGem, getGemType } from '@/engine/systems/gem';
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
} from '@/render/templates';

//#region TEMPLATES
export const createUI = () => {
    createLoading();
    createInfo();
    createGemUI();
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
//#endregion

const createInfo = () => {
    createElement({
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
        id: `Info-${text}`,
        parent: 'Infos',
        text: (alert)
            ? `⚠ ${text} ⚠`
            : text,
    });
};

const removeInfo = ({ text }: { text: string }) => {
    destroyElement({ elId: `Info-${text}` });
};

export const displayInfo = ({ text, alert }: {
    alert: boolean
    text: string
}) => {
    addInfo({ alert, text });

    setTimeout(() => { removeInfo({ text }); }, INFO_TIMEOUT);
};
//#endregion

//#region GEM
const createGemUI = () => {
    createElement({
        id: 'Gem',
        parent: 'UI',
    });
};

const updateGemUI = ({ gemId }: { gemId: string }) => {
    clearGemUI();

    createButton({
        click: () => displayGemUI({ display: false, gemId }),
        css: 'back',
        id: 'GemBack',
        parent: 'Gem',
        text: 'Back',
    });

    createGemInfo({ gemId });
    createGemActions({ gemId });

    placeGemUI({ gemId });
};

const clearGemUI = () => {
    const gemUIEl = getElement({ elId: 'Gem' });
    gemUIEl.innerHTML = '';
};

const placeGemUI = ({ gemId }: { gemId: string }) => {
    const gemUIEl = getElement({ elId: 'Gem' });

    const gemEntityEl = getElement({ elId: gemId });
    const gemRect = gemEntityEl.getBoundingClientRect();

    let gemUITop = gemRect.top - gemUIEl.offsetHeight;
    if (gemUITop < 0) {
        gemUITop = gemRect.bottom;
    }
    if (gemUITop + gemUIEl.offsetHeight > window.innerHeight) {
        gemUITop = window.innerHeight - gemUIEl.offsetHeight;
    }

    let gemUILeft = gemRect.left;
    if (gemUILeft < 0) {
        gemUILeft = gemRect.right - gemUIEl.offsetWidth;
    }
    if (gemUILeft + gemUIEl.offsetWidth > window.innerWidth) {
        gemUILeft = window.innerWidth - gemUIEl.offsetWidth;
    }

    gemUIEl.style.top = `${gemUITop}px`;
    gemUIEl.style.left = `${gemUILeft}px`;
};

const createGemInfo = ({ gemId }: { gemId: string }) => {
    const gem = getGem({ gemId });
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    createElement({
        absolute: false,
        css: 'data',
        id: 'GemData',
        parent: 'Gem',
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

    createElement({
        absolute: false,
        css: 'items',
        id: 'GemItems',
        parent: 'GemData',
        text: `Items: ${gem.items.map((item) => `(${item._name} ${item._amount})`)}`,
    });
};

const createGemActions = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemMove = gemState._action === 'move';
    const gemWork = gemState._action === 'work';

    createElement({
        absolute: false,
        css: 'actions',
        id: 'GemActions',
        parent: 'Gem',
    });

    createButton({
        absolute: false,
        click: () => onClickGemStore({ gemId }),
        css: 'action',
        id: 'GemStore',
        parent: 'GemActions',
        text: 'Store',
    });

    createButton({
        absolute: false,
        click: () => onClickGemMove({ gemId }),
        css: 'action',
        id: 'GemMove',
        parent: 'GemActions',
        text: (gemMove)
            ? 'Cancel'
            : 'Move',
    });

    createButton({
        absolute: false,
        click: () => onClickGemWork({ gemId }),
        css: 'action',
        id: `Gem${gemType}`,
        parent: 'GemActions',
        text: (gemWork)
            ? 'Cancel'
            : gemType,
    });
};

const onClickGemStore = ({ gemId }: { gemId: string }) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        displayGemUI({ display: false, gemId });
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_STORE });

        return;
    }
    else if (gemState._action === 'move') {
        emit({
            data: `${gemId} is already moving`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return;
    }
    else if (gemState._action === 'work') {
        emit({
            data: `${gemId} is already working`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return;
    }
};

const onClickGemMove = ({ gemId }: { gemId: string }) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        displayGemUI({ display: false, gemId });
        emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MOVE_REQUEST });

        return;
    }
    else if (gemState._action === 'move') {
        displayGemUI({ display: false, gemId });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MOVE_CANCEL });

        return;
    }
    else if (gemState._action === 'work') {
        emit({
            data: `${gemId} is already working`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return;
    }
};

const onClickGemWork = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemState._action === 'idle') {
        if (gemType === Gems.MINE) {
            onClickGemMine({ gemId });
        }
        else if (gemType === Gems.CARRY) {
            onClickGemCarry({ gemId });
        }

        return;
    }
    else if (gemState._action === 'move') {
        emit({
            data: `${gemId} is already moving`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return;
    }
    else if (gemState._action === 'work') {
        displayGemUI({ display: false, gemId });

        if (gemType === Gems.MINE) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MINE_CANCEL });
        }
        else if (gemType === Gems.CARRY) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_CARRY_CANCEL });
        }

        return;
    }
};

const onClickGemMine = ({ gemId }: { gemId: string }) => {
    displayGemUI({ display: false, gemId });
    emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MINE_REQUEST });
};

const onClickGemCarry = ({ gemId }: { gemId: string }) => {
    displayGemUI({ display: false, gemId });
    emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_CARRY_REQUEST });
};

export const displayGemUI = ({ gemId, display }: {
    display: boolean,
    gemId: string,
}) => {
    const gemEl = getElement({ elId: 'Gem' });

    gemEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        updateGemUI({ gemId });
        setAllOtherGemsMode({ gemId, mode: 'disable' });
        setAdminMode({ mode: 'disable' });
    }
    else {
        setGemMode({ gemId, mode: 'request', remove: true });
        setAllOtherGemsMode({ gemId, mode: 'disable', remove: true });
        setAdminMode({ mode: 'base' });
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
