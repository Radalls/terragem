import { Item } from '@/engine/components';

export type Gem = Carry | Floor | Lift | Mine | Shaft | Tunnel;

export type Carry = {
    _: 'Carry';
    _itemAmount: number;
    _itemCapacity: number;
    _itemRange: number;
    _itemSpeed: number;
    _mech?: string;
    _moveSpeed: number;
    _moveStartX?: number;
    _moveStartY?: number;
    _moveTargetX?: number;
    _moveTargetY?: number;
    _moveTo?: 'start' | 'target';
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
}

export type Floor = {
    _: 'Floor';
    _digSpeed: number;
    _digStrength: number;
    _mech?: string;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
};

export type Lift = {
    _: 'Lift';
    _itemAmount: number;
    _itemCapacity: number;
    _itemSpeed: number;
    _mech?: string;
    _moveSpeed: number;
    _moveStartX?: number;
    _moveStartY?: number;
    _moveTargetX?: number;
    _moveTargetY?: number;
    _moveTo?: 'start' | 'target';
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
}

export type Mine = {
    _: 'Mine';
    _digAmount: number;
    _digSpeed: number;
    _digStrength: number;
    _itemCapacity: number;
    _mech?: string;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
};

export type Shaft = {
    _: 'Shaft';
    _digOffset?: number;
    _digRange: number;
    _digSpeed: number;
    _digStrength: number;
    _mech?: string;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
};

export type Tunnel = {
    _: 'Tunnel';
    _digOffset?: number;
    _digRange: number;
    _digSpeed: number;
    _digStrength: number;
    _mech?: string;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    _name: string;
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
}

export enum Gems {
    CARRY = 'Carry',
    FLOOR = 'Floor',
    LIFT = 'Lift',
    MINE = 'Mine',
    SHAFT = 'Shaft',
    TUNNEL = 'Tunnel',
}
