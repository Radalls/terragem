import { LabData } from '@/engine/systems/lab';
import { QuestData } from '@/engine/systems/quest';

export type Admin = {
    _: 'Admin';
    builds: Builds;
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
    /* Forges */
    _forgeOryonSpeed: number;
    _forgeVulkanSpeed: number;
    /* Carry */
    _gemCarryItemAmount: number;
    _gemCarryItemCapacity: number;
    _gemCarryItemRange: number;
    _gemCarryItemSpeed: number;
    _gemCarryMoveSpeed: number;
    /* Floor */
    _gemFloorDigSpeed: number;
    _gemFloorDigStrength: number;
    _gemFloorMoveSpeed: number;
    /* Lift */
    _gemLiftItemAmount: number;
    _gemLiftItemCapacity: number;
    _gemLiftItemSpeed: number;
    _gemLiftMoveSpeed: number;
    _gemMax: number;
    /* Mine */
    _gemMineDigAmount: number;
    _gemMineDigSpeed: number;
    _gemMineDigStrength: number;
    _gemMineItemCapacity: number;
    _gemMineMoveSpeed: number;
    /* Shaft */
    _gemShaftDigRange: number;
    _gemShaftDigSpeed: number;
    _gemShaftDigStrength: number;
    _gemShaftMoveSpeed: number;
    /* Tunnel */
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

export type Builds = {
    forges: {
        oryon: number;
        vulkan: number;
    }
};

export type Item = {
    _amount: number;
    _name: Items;
};

export enum Items {
    BUILD_FORGE_ORYON = 'FORGE_ORYON',
    BUILD_FORGE_VULKAN = 'FORGE_VULKAN',
    GEM_CARRY = 'GEM_CARRY',
    GEM_FLOOR = 'GEM_FLOOR',
    GEM_LIFT = 'GEM_LIFT',
    GEM_MINE = 'GEM_MINE',
    GEM_SHAFT = 'GEM_SHAFT',
    GEM_TUNNEL = 'GEM_TUNNEL',
    MK1_CARRY = 'MK1_CARRY',
    MK1_MINE = 'MK1_MINE',
    MK1_TUNNEL = 'MK1_TUNNEL',
    RES_CERULYN = 'CERULYN',
    RES_CLARYN = 'CLARYN',
    RES_DAMSYN = 'DAMSYN',
    RES_FIRMYN = 'FIRMYN',
    RES_GEOLYN = 'GEOLYN',
    RES_LUMYN = 'LUMYN',
    RES_STONE = 'STONE',
    RES_VIRIDYN = 'VIRIDYN',
}
