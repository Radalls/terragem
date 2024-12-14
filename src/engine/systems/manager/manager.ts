import { createSave } from './manager.data';
import {
    SETTINGS,
    closeSettings,
    confirmLaunchOption,
    confirmSetting,
    editSettingAudio,
    getKeyMoveOffset,
    selectLaunchOption,
    selectSetting,
} from './manager.utils';

import { destroyAllEntities, getComponent } from '@/engine/entities';
import { launch } from '@/engine/main';
import { stopCycle } from '@/engine/services/cycle';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { consumeFirstKeyPress } from '@/engine/services/input';
import { getState, setState } from '@/engine/services/state';
import { getStore, resetStore } from '@/engine/services/store';
import { event } from '@/render/events';

//#region SYSTEMS
//#region LAUNCH
export const onLaunchInput = ({ inputKey, managerEntityId }: {
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onSettingsInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (inputKey === manager.settings.keys.action._act) {
        confirmLaunchOption({ managerEntityId });
        return;
    }
    else if (
        inputKey === manager.settings.keys.move._up
        || inputKey === manager.settings.keys.move._down
    ) {
        const inputOffset = getKeyMoveOffset({ inputKey, managerEntityId });
        if (!(inputOffset)) throw error({
            message: 'Invalid input',
            where: onLaunchInput.name,
        });

        selectLaunchOption({ managerEntityId, offset: inputOffset });
        return;
    }
};

export const quitToLaunch = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: openSettings.name });

    setState('isGameLaunching', true);
    setState('isInputCooldown', false);

    closeSettings();

    destroyAllEntities({ force: true });
    stopCycle();
    resetStore();

    launch();

    event({ data: { audioName: 'bgm_map1' }, type: EventTypes.AUDIO_STOP });
    event({ data: { audioName: 'bgm_menu2', loop: true }, type: EventTypes.AUDIO_PLAY });
};
//#endregion

//#region SETTINGS
export const onSettingsInput = ({ inputKey, managerEntityId }: {
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onSettingsInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (inputKey === manager.settings.keys.action._back) {
        if (getState('isSettingEditOpen')) {
            confirmSetting({ editKey: inputKey });
            return;
        }

        closeSettings();
        return;
    }
    if (getState('isSettingEditOpen')) {
        if (inputKey === manager.settings.keys.action._save) return;
        if (inputKey === manager.settings.keys.action._quit) return;

        confirmSetting({ editKey: inputKey });
        return;
    }
    else if (inputKey === manager.settings.keys.action._act) {
        confirmSetting({});
        return;
    }
    else if (
        inputKey === manager.settings.keys.move._up
        || inputKey === manager.settings.keys.move._down
    ) {
        const inputOffset = getKeyMoveOffset({ inputKey, managerEntityId });
        if (!(inputOffset)) throw error({
            message: 'Invalid input',
            where: onSettingsInput.name,
        });

        selectSetting({ offset: inputOffset });
        return;
    }
    else if (
        inputKey === manager.settings.keys.move._left
        || inputKey === manager.settings.keys.move._right
    ) {
        if (SETTINGS[manager._selectedSetting] === SETTINGS[0]) {
            editSettingAudio({ editKey: inputKey, managerEntityId });
        }
        else {
            //TODO: change settings page
        }
    }
    else if (inputKey === manager.settings.keys.action._save) {
        if (getState('isGameLaunching')) return;

        createSave({});
        return;
    }
    else if (inputKey === manager.settings.keys.action._quit) {
        if (getState('isGameLaunching')) return;

        quitToLaunch({});
        return;
    }
};

export const openSettings = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: openSettings.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    manager._selectedSetting = 0;

    setState('isGamePaused', true);
    if (getState('isGameRunning')) {
        setState('isGameRunning', false);

        event({ type: EventTypes.ENERGY_DISPLAY });
        event({ type: EventTypes.INVENTORY_TOOL_ACTIVE_DISPLAY });
        event({ type: EventTypes.TIME_DAY_DISPLAY });
        event({ type: EventTypes.QUEST_DISPLAY });
    }

    event({ type: EventTypes.MENU_SETTINGS_DISPLAY });
    event({ type: EventTypes.MENU_SETTINGS_UPDATE });
    event({ data: { audioName: 'menu_settings_open' }, type: EventTypes.AUDIO_PLAY });
};
//#endregion
//#endregion
