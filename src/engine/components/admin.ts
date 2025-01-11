import { LabData } from '@/engine/systems/lab';
import { QuestData } from '@/engine/systems/quest';

export type Admin = {
    _: 'Admin';
    crafts: string[];
    gems: string[];
    items: Item[];
    labs: Lab[];
    mechs: string[];
    quests: Quest[];
    requests: string[];
    settings: Settings;
    stats: Stats;
};

export type Item = {
    _amount: number;
    _name: Items;
};

export enum Items {
    COPPER = 'COPPER',
    GEM_CARRY = 'GEM_CARRY',
    GEM_FLOOR = 'GEM_FLOOR',
    GEM_LIFT = 'GEM_LIFT',
    GEM_MINE = 'GEM_MINE',
    GEM_SHAFT = 'GEM_SHAFT',
    GEM_TUNNEL = 'GEM_TUNNEL',
    IRON = 'IRON',
    LEAD = 'LEAD',
    LUMYN = 'LUMYN',
    MK1_MINE = 'MK1_MINE',
    STONE = 'STONE',
}

export type Quest = {
    _done: boolean,
    _progress: number,
    data: QuestData,
};

export type Lab = {
    _done: boolean,
    _progress: number,
    _run: boolean,
    data: LabData,
};

export type Stats = {
    _gemCarryItemAmount: number;
    _gemCarryItemCapacity: number;
    _gemCarryItemRange: number;
    _gemCarryItemSpeed: number;
    _gemCarryMoveSpeed: number;
    _gemFloorDigRange: number;
    _gemFloorDigSpeed: number;
    _gemFloorDigStrength: number;
    _gemFloorMoveSpeed: number;
    _gemLiftItemAmount: number;
    _gemLiftItemCapacity: number;
    _gemLiftItemSpeed: number;
    _gemLiftMoveSpeed: number;
    _gemMax: number;
    _gemMineDigAmount: number;
    _gemMineDigSpeed: number;
    _gemMineDigStrength: number;
    _gemMineItemCapacity: number;
    _gemMineMoveSpeed: number;
    _gemShaftDigRange: number;
    _gemShaftDigSpeed: number;
    _gemShaftDigStrength: number;
    _gemShaftMoveSpeed: number;
    _gemTunnelDigRange: number;
    _gemTunnelDigSpeed: number;
    _gemTunnelDigStrength: number;
    _gemTunnelMoveSpeed: number;
    _labPoints: number;
};

export type Settings = {
    _audioActive: boolean;
    _audioVolume: number;
};
