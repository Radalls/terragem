import pkg from '../../../../package.json';

import { openSettings } from './manager';
import { loadSave } from './manager.data';
import { setDayTime } from './manager.time';

import { getComponent } from '@/engine/entities';
import { run } from '@/engine/main';
import { setVolumeAudio as setAudioVolume } from '@/engine/services/audio';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { setState, getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { findTileByEntityId } from '@/engine/systems/tilemap';
import { event } from '@/render/events';

//#region CONSTANTS
//#region LAUNCH
export const LAUNCH_OPTIONS = [
    'start',
    'load',
    'settings',
];
//#endregion

//#region SETTINGS
export const SETTINGS = [
    'audio',
    'keyMoveUp',
    'keyMoveDown',
    'keyMoveLeft',
    'keyMoveRight',
    'keyActionAct',
    'keyActionInventory',
    'keyActionTool',
];

export const SETTINGS_KEYS_PATHS: { [key: string]: { path: string[] } } = {
    keyActionAct: { path: ['keys', 'action', '_act'] },
    keyActionInventory: { path: ['keys', 'action', '_inventory'] },
    keyActionTool: { path: ['keys', 'action', '_tool'] },
    keyMoveDown: { path: ['keys', 'move', '_down'] },
    keyMoveLeft: { path: ['keys', 'move', '_left'] },
    keyMoveRight: { path: ['keys', 'move', '_right'] },
    keyMoveUp: { path: ['keys', 'move', '_up'] },
};
//#endregion
//#endregion

//#region UTILS
export const getProjectVersion = () => pkg.version;

export const getKeyMoveDirection = ({ inputKey, managerEntityId }: {
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: getKeyMoveDirection.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (inputKey === manager.settings.keys.move._up) return 'up';
    else if (inputKey === manager.settings.keys.move._down) return 'down';
    else if (inputKey === manager.settings.keys.move._left) return 'left';
    else if (inputKey === manager.settings.keys.move._right) return 'right';

    return null;
};

export const getKeyMoveOffset = ({ inputKey, managerEntityId }: {
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: getKeyMoveOffset.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (inputKey === manager.settings.keys.move._up) return -1;
    else if (inputKey === manager.settings.keys.move._down) return 1;

    return null;
};

export const upActionCount = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: upActionCount.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    manager._actionCount += 1;

    if (manager._actionCount % 2 === 0) {
        setDayTime({ managerEntityId });
    }
};

//#region LAUNCH
export const selectLaunchOption = ({ managerEntityId, offset }: {
    managerEntityId?: string | null,
    offset: 1 | -1,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: selectLaunchOption.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (offset === -1) {
        manager._selectedLaunchOption = Math.max(0, manager._selectedLaunchOption - 1);
    }
    else if (offset === 1) {
        manager._selectedLaunchOption = Math.min(
            LAUNCH_OPTIONS.length - 1,
            manager._selectedLaunchOption + 1,
        );
    }

    event({ type: EventTypes.MENU_LAUNCH_UPDATE });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const confirmLaunchOption = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: confirmLaunchOption.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (LAUNCH_OPTIONS[manager._selectedLaunchOption] === LAUNCH_OPTIONS[0]) {
        setState('isGameLaunching', false);

        event({ type: EventTypes.MAIN_RUN });

        run({});

        event({ type: EventTypes.TIME_DAY_DISPLAY });
        event({ type: EventTypes.QUEST_DISPLAY });
        event({ data: { audioName: 'menu_launch_start' }, type: EventTypes.AUDIO_PLAY });
        event({ data: { audioName: 'bgm_map1', loop: true }, type: EventTypes.AUDIO_PLAY });
        event({ data: { audioName: 'bgm_menu2' }, type: EventTypes.AUDIO_STOP });

        return;
    }
    else if (LAUNCH_OPTIONS[manager._selectedLaunchOption] === LAUNCH_OPTIONS[1]) {
        loadSave().then((saveData) => {
            if (saveData.version !== getProjectVersion()) {
                event({
                    data: { message: 'La version de cette sauvegarde est invalide' },
                    type: EventTypes.MAIN_ERROR,
                });
                event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

                throw error({
                    message: 'Invalid save, project version does not match',
                    where: confirmLaunchOption.name,
                });
            }

            setState('isGameLaunching', false);

            event({ type: EventTypes.MAIN_RUN });

            run({ saveData });

            event({ type: EventTypes.MENU_LAUNCH_DISPLAY });
            event({ type: EventTypes.MENU_SETTINGS_UPDATE });
            event({ type: EventTypes.TIME_DAY_DISPLAY });
            event({ type: EventTypes.QUEST_DISPLAY });
            event({ data: { audioName: 'menu_launch_start' }, type: EventTypes.AUDIO_PLAY });
            event({ data: { audioName: 'bgm_map1', loop: true }, type: EventTypes.AUDIO_PLAY });
            event({ data: { audioName: 'bgm_menu2' }, type: EventTypes.AUDIO_STOP });

            return;
        });

        return;
    }
    else if (LAUNCH_OPTIONS[manager._selectedLaunchOption] === LAUNCH_OPTIONS[2]) {
        openSettings({});
    }
};
//#endregion

//#region SETTINGS
export const closeSettings = () => {
    setState('isGamePaused', false);
    if (!(getState('isGameRunning')) && !(getState('isGameLaunching'))) {
        setState('isGameRunning', true);

        event({ type: EventTypes.ENERGY_DISPLAY });
        event({ type: EventTypes.INVENTORY_TOOL_ACTIVE_DISPLAY });
        event({ type: EventTypes.TIME_DAY_DISPLAY });
        event({ type: EventTypes.QUEST_DISPLAY });
    }

    event({ type: EventTypes.MENU_SETTINGS_DISPLAY });
    event({ data: { audioName: 'menu_settings_close' }, type: EventTypes.AUDIO_PLAY });
};

export const confirmSetting = ({ managerEntityId, editKey }: {
    editKey?: string
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: confirmSetting.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (SETTINGS[manager._selectedSetting] === SETTINGS[0]) {
        editSettingAudio({ managerEntityId });
    }
    else if (SETTINGS[manager._selectedSetting]) {
        editSettingKey({ editKey, managerEntityId });
    }
    else {
        throw error({ message: 'Setting not yet implemented', where: confirmSetting.name });
    }

    event({ type: EventTypes.MENU_SETTINGS_UPDATE });
    event({ data: { audioName: 'main_confirm' }, type: EventTypes.AUDIO_PLAY });
};

export const selectSetting = ({ managerEntityId, offset }: {
    managerEntityId?: string | null,
    offset: 1 | -1,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: selectSetting.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (offset === -1) {
        manager._selectedSetting = Math.max(0, manager._selectedSetting - 1);
    }
    else if (offset === 1) {
        manager._selectedSetting = Math.min(
            SETTINGS.length - 1,
            manager._selectedSetting + 1,
        );
    }

    event({ type: EventTypes.MENU_SETTINGS_UPDATE });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const settingKeyAlreadyInUse = ({ key, managerEntityId }: {
    key: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: settingKeyAlreadyInUse.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    return [
        ...Object.values(manager.settings.keys.action),
        ...Object.values(manager.settings.keys.move),
    ].includes(key);
};

export const editSettingAudio = ({ editKey, managerEntityId }: {
    editKey?: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: editSettingAudio.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(editKey)) {
        manager.settings._audio = !(manager.settings._audio);
        setState('isSettingAudioAllowed', manager.settings._audio);

        //TODO: handle bgm data
        event({
            data: {
                audioName: (getState('isGameLaunching'))
                    ? 'bgm_menu2'
                    : 'bgm_map1',
                loop: (manager.settings._audio)
                    ? true
                    : undefined,
            },
            type: (manager.settings._audio)
                ? EventTypes.AUDIO_PLAY
                : EventTypes.AUDIO_STOP,
        });
    }
    else if (editKey === manager.settings.keys.move._left) {
        manager.settings._audioVolume = Math.max(0, manager.settings._audioVolume - 0.1);

        setState('isSettingAudioAllowed', manager.settings._audioVolume > 0);
        setAudioVolume({ volume: manager.settings._audioVolume });

        event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
    }
    else if (editKey === manager.settings.keys.move._right) {
        manager.settings._audioVolume = Math.min(1, manager.settings._audioVolume + 0.1);

        setState('isSettingAudioAllowed', manager.settings._audioVolume < 1);
        setAudioVolume({ volume: manager.settings._audioVolume });

        event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
    }
};

export const editSettingKey = ({ editKey, managerEntityId }: {
    editKey?: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: editSettingKey.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const settingKey = SETTINGS[manager._selectedSetting];
    const settingKeyPath = SETTINGS_KEYS_PATHS[settingKey];

    if (getState('isSettingEditOpen')) {
        if (!(editKey)) {
            throw error({ message: 'editKey is undefined', where: editSettingKey.name });
        }
        if (editKey === manager.settings.keys.action._back) {
            setState('isSettingEditOpen', false);

            event({ type: EventTypes.MENU_SETTINGS_DISPLAY_EDIT });

            return;
        }
        if (settingKeyAlreadyInUse({ key: editKey })) {
            event({
                data: { message: `La touche ${editKey.toUpperCase()} est déjà utilisée ailleurs` },
                type: EventTypes.MAIN_ERROR,
            });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({ message: `Key ${editKey} already in use`, where: editSettingKey.name });
        }

        let settings = manager.settings as any;
        for (let i = 0; i < settingKeyPath.path.length - 1; i++) {
            settings = settings[settingKeyPath.path[i]];
        }
        settings[settingKeyPath.path[settingKeyPath.path.length - 1]] = editKey;

        setState('isSettingEditOpen', false);
    }
    else {
        setState('isSettingEditOpen', true);
    }

    event({ type: EventTypes.MENU_SETTINGS_DISPLAY_EDIT });
};
//#endregion

//#region MAPSTATE
export const createTileMapState = ({ managerEntityId, tileMapEntityId, player = false }: {
    managerEntityId?: string | null,
    player?: boolean,
    tileMapEntityId?: string | null,
}) => {
    const playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: createTileMapState.name });

    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: createTileMapState.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: createTileMapState.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const existingTileMapState = manager.tileMapStates.find(state => state._name === tileMap._name);
    if (existingTileMapState) {
        manager.tileMapStates = manager.tileMapStates.filter(state => state._name !== tileMap._name);
    }

    if (!(player)) {
        const playerTile = findTileByEntityId({ entityId: playerEntityId })
            ?? error({ message: 'Player tile not found', where: createTileMapState.name });

        playerTile._entityIds = playerTile._entityIds.filter(entityId => entityId !== playerEntityId);
    }

    manager.tileMapStates.push({ ...tileMap, source: 'game' });
};

export const getTileMapState = ({ tileMapName, managerEntityId }: {
    managerEntityId?: string | null,
    tileMapName: string,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: getTileMapState.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    return manager.tileMapStates.find(mapState => mapState._name === tileMapName);
};

export const saveTileMapStates = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: saveTileMapStates.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    for (const state of manager.tileMapStates) {
        state.source = 'save';
    }
};
//#endregion
//#endregion
