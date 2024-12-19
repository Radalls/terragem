import { LabData } from '@/engine/systems/lab';
import { QuestData } from '@/engine/systems/quest';

export type Admin = {
    _: 'Admin';
    _gemMax: number;
    _labPoints: number;
    crafts: string[];
    gems: string[];
    items: Item[];
    labs: Lab[];
    quests: Quest[];
    requests: string[];
};

export type Item = {
    _amount: number;
    _name: Items;
};

export enum Items {
    COPPER = 'COPPER',
    GEM_CARRY = 'GEM_CARRY',
    GEM_MINE = 'GEM_MINE',
    IRON = 'IRON',
    LUMYN = 'LUMYN',
    STONE = 'STONE',
}

export type Quest = {
    _done: boolean,
    _progress: number,
    data: QuestData,
}

export type Lab = {
    _done: boolean,
    _progress: number,
    _run: boolean,
    data: LabData,
}
