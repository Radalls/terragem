import { Item } from './inventory';

export type Resource = {
    _: 'Resource',
    _cooldown?: number,
    _type: ResourceTypes,
    activityData?: ActivityData,
    item?: Item,
    items?: ResourceItem[],
};

export type ResourceItem = {
    _name: string,
    _rate: number
};

export enum ResourceTypes {
    BUG = 'ResourceBug',
    CRAFT = 'ResourceCraft',
    FISH = 'ResourceFish',
    ITEM = 'ResourceItem',
    PLACE = 'ResourcePlace',
}

export type ActivityData = ActivityBugData | ActivityFishData | ActivityCraftData;

export type ActivityBugData = {
    _hp: number,
    _maxHp: number,
    _maxNbErrors: number,
    _nbErrors: number,
    _symbol?: string,
    _symbolFound?: boolean,
    _symbolInterval: number
};

export type ActivityFishData = {
    _damage: number,
    _frenzyDuration: number,
    _frenzyInterval: number,
    _hp: number,
    _isFrenzy?: boolean,
    _maxHp: number,
    _rodDamage: number,
    _rodMaxTension: number,
    _rodTension: number,
};

export type ActivityCraftData = {
    _hitCount?: number,
    _maxNbErrors?: number,
    _nbErrors?: number
};
