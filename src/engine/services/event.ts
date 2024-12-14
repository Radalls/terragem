import { getState, setState } from './state';
import { getStore } from './store';

import { Component } from '@/engine/components/@component';
import { ActivityData } from '@/engine/components/resource';
import { Tile } from '@/engine/components/tilemap';
import { getComponent } from '@/engine/entities';
import { AudioData } from '@/engine/services/audio';
import { error, ErrorData } from '@/engine/services/error';
import { consumeFirstKeyPress, keyPress } from '@/engine/services/input';
import { onDialogInput } from '@/engine/systems/dialog';
import {
    activateInventoryTool,
    onInventoryInput,
    openPlayerInventory,
} from '@/engine/systems/inventory';
import {
    getKeyMoveDirection,
    onLaunchInput,
    onSettingsInput,
    openSettings,
} from '@/engine/systems/manager';
import { onActivityBugInput, onActivityFishInput, onActivityCraftInput } from '@/engine/systems/resource';
import { updateTile } from '@/engine/systems/tilemap';
import { checkTrigger } from '@/engine/systems/trigger';

//#region TYPES
export type Event<K extends keyof Component = keyof Component> = {
    data?: EventData<K>,
    entityId?: string,
    type: EventTypes
};

export type EventData<K extends keyof Component = keyof Component>
    = Component[K] | Tile | ActivityData | AudioData | ErrorData;

export enum EventTypes {
    /* Activity */
    ACTIVITY_BUG_END = 'ACTIVITY_BUG_END',
    ACTIVITY_BUG_START = 'ACTIVITY_BUG_START',
    ACTIVITY_BUG_UPDATE = 'ACTIVITY_BUG_UPDATE',
    ACTIVITY_CRAFT_END = 'ACTIVITY_CRAFT_END',
    ACTIVITY_CRAFT_PLAY_END = 'ACTIVITY_CRAFT_PLAY_END',
    ACTIVITY_CRAFT_PLAY_START = 'ACTIVITY_CRAFT_PLAY_START',
    ACTIVITY_CRAFT_PLAY_UPDATE = 'ACTIVITY_CRAFT_PLAY_UPDATE',
    ACTIVITY_CRAFT_SELECT_END = 'ACTIVITY_CRAFT_SELECT_END',
    ACTIVITY_CRAFT_SELECT_START = 'ACTIVITY_CRAFT_SELECT_START',
    ACTIVITY_CRAFT_SELECT_UPDATE = 'ACTIVITY_CRAFT_SELECT_UPDATE',
    ACTIVITY_CRAFT_START = 'ACTIVITY_CRAFT_START',
    ACTIVITY_END = 'ACTIVITY_END',
    ACTIVITY_FISH_END = 'ACTIVITY_FISH_END',
    ACTIVITY_FISH_START = 'ACTIVITY_FISH_START',
    ACTIVITY_FISH_UPDATE = 'ACTIVITY_FISH_UPDATE',
    ACTIVITY_LOSE = 'ACTIVITY_LOSE',
    ACTIVITY_START = 'ACTIVITY_START',
    ACTIVITY_WIN = 'ACTIVITY_WIN',
    /* Audio */
    AUDIO_PAUSE = 'AUDIO_PAUSE',
    AUDIO_PLAY = 'AUDIO_PLAY',
    AUDIO_STOP = 'AUDIO_STOP',
    /* Dialog */
    DIALOG_END = 'DIALOG_END',
    DIALOG_START = 'DIALOG_START',
    DIALOG_UPDATE = 'DIALOG_UPDATE',
    /* Energy */
    ENERGY_CREATE = 'ENERGY_CREATE',
    ENERGY_DISPLAY = 'ENERGY_DISPLAY',
    ENERGY_UPDATE = 'ENERGY_UPDATE',
    /* Entity */
    ENTITY_CREATE = 'ENTITY_CREATE',
    ENTITY_DESTROY = 'ENTITY_DESTROY',
    ENTITY_DISPLAY = 'ENTITY_DISPLAY',
    ENTITY_POSITION_UPDATE = 'ENTITY_POSITION_UPDATE',
    ENTITY_SPRITE_CREATE = 'ENTITY_SPRITE_CREATE',
    ENTITY_SPRITE_UPDATE = 'ENTITY_SPRITE_UPDATE',
    /* Inventory */
    INVENTORY_CREATE = 'INVENTORY_CREATE',
    INVENTORY_DISPLAY = 'INVENTORY_DISPLAY',
    INVENTORY_OPTION_DISPLAY = 'INVENTORY_OPTION_DISPLAY',
    INVENTORY_OPTION_UPDATE = 'INVENTORY_OPTION_UPDATE',
    INVENTORY_SELECT_SLOT = 'INVENTORY_SELECT',
    INVENTORY_TOOL_ACTIVATE = 'INVENTORY_TOOL_ACTIVATE',
    INVENTORY_TOOL_ACTIVE_DISPLAY = 'INVENTORY_TOOL_ACTIVE_DISPLAY',
    INVENTORY_TOOL_UPDATE = 'INVENTORY_TOOL_UPDATE',
    INVENTORY_UPDATE = 'INVENTORY_UPDATE',
    /* Main */
    MAIN_CAMERA_UPDATE = 'MAIN_CAMERA_UPDATE',
    MAIN_ERROR = 'MAIN_ERROR',
    MAIN_LOADING_ERROR = 'MAIN_LOADING_ERROR',
    MAIN_LOADING_OFF = 'MAIN_LOADING_OFF',
    MAIN_LOADING_ON = 'MAIN_LOADING_ON',
    MAIN_RUN = 'MAIN_RUN',
    /* Menu */
    MENU_LAUNCH_DISPLAY = 'MENU_LAUNCH_DISPLAY',
    MENU_LAUNCH_UPDATE = 'MENU_LAUNCH_UPDATE',
    MENU_SETTINGS_DISPLAY = 'MENU_SETTINGS_DISPLAY',
    MENU_SETTINGS_DISPLAY_EDIT = 'MENU_SETTINGS_DISPLAY_EDIT',
    MENU_SETTINGS_UPDATE = 'MENU_SETTINGS_UPDATE',
    /* Quest */
    QUEST_COMPLETE = 'QUEST_COMPLETE',
    QUEST_DISPLAY = 'QUEST_DISPLAY',
    QUEST_END = 'QUEST_END',
    QUEST_START = 'QUEST_START',
    /* Tilemap */
    TILEMAP_CREATE = 'TILEMAP_CREATE',
    /* Time */
    TIME_DAY_DISPLAY = 'TIME_DISPLAY',
    TIME_DAY_UPDATE = 'TIME_UPDATE',
}
//#endregion

//#region EVENTS
export const onInputKeyDown = () => {
    if (
        !(getState('isGameLaunching')) && !(getState('isGameRunning')) && !(getState('isGamePaused')) ||
        getState('isGameLoading') ||
        getState('isInputCooldown')
    ) return;

    setState('isInputCooldown', true);

    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onInputKeyDown.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const playerEntityId = (getState('isGameRunning'))
        ? getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: onInputKeyDown.name })
        : null;

    for (const inputKey in keyPress) {
        if (!(getState('isGameRunning'))) {
            if (getState('isGamePaused')) {
                onSettingsInput({ inputKey });
                continue;
            }
            else if (getState('isGameLaunching')) {
                if (inputKey === manager.settings.keys.action._back) {
                    if (consumeFirstKeyPress(inputKey)) openSettings({});
                    continue;
                }
                else {
                    onLaunchInput({ inputKey });
                    continue;
                }
            }
        }
        else {
            if (getState('isPlayerInventoryOpen')) {
                onInventoryInput({ inputKey });
                continue;
            }
            else if (getState('isActivityRunning')) {
                if (getState('isActivityBugRunning')) {
                    if (getState('isActivityBugInputCooldown')) continue;

                    onActivityBugInput({ inputKey });
                    continue;
                }
                else if (getState('isActivityFishRunning')) {
                    onActivityFishInput({ inputKey });
                    continue;
                }
                else if (getState('isActivityCraftRunning')) {
                    onActivityCraftInput({ inputKey });
                    continue;
                }
                else continue;
            }
            else if (getState('isPlayerDialogOpen')) {
                onDialogInput({ inputKey });
                continue;
            }
            else {
                if (inputKey === manager.settings.keys.action._back) {
                    if (consumeFirstKeyPress(inputKey)) openSettings({});
                    continue;
                }
                else if (inputKey === manager.settings.keys.action._inventory) {
                    if (consumeFirstKeyPress(inputKey)) openPlayerInventory({ playerEntityId });
                    continue;
                }
                else if (inputKey === manager.settings.keys.action._tool) {
                    if (consumeFirstKeyPress(inputKey)) activateInventoryTool({ entityId: playerEntityId });
                    continue;
                }
                else if (inputKey === manager.settings.keys.action._act) {
                    if (consumeFirstKeyPress(inputKey)) checkTrigger({});
                    continue;
                }
                else {
                    const targetDirection = getKeyMoveDirection({ inputKey, managerEntityId });
                    if (!(targetDirection)) continue;

                    updateTile({
                        entityId: playerEntityId,
                        target: targetDirection,
                    });

                    continue;
                }
            }
        }
    }
};
//#endregion
