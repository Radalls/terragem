import { TileMapState } from './tilemap';

import { Quest, DayTimes } from '@/engine/systems/manager';

export type Manager = {
    _: 'Manager',
    _actionCount: number,
    _dayTime: DayTimes,
    _selectedCraftRecipe: number,
    _selectedInventorySlot: number,
    _selectedInventorySlotOption: number,
    _selectedLaunchOption: number,
    _selectedQuest: number,
    _selectedSetting: number,
    itemRecipes: string[],
    quests: Quest[],
    questsDone: Quest[],
    settings: ManagerSettings,
    tileMapStates: TileMapState[],
};

type ManagerSettings = {
    _audio: boolean,
    _audioVolume: number,
    keys: ManagerSettingsKeys,
};

type ManagerSettingsKeys = {
    action: ManagerSettingsActionKeys,
    move: ManagerSettingsMoveKeys,
};

type ManagerSettingsActionKeys = {
    _act: string,
    _back: string,
    _inventory: string,
    _quit: string,
    _save: string,
    _tool: string,
};

type ManagerSettingsMoveKeys = {
    _down: string,
    _left: string,
    _right: string,
    _up: string,
};
