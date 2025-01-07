import { Item } from '@/engine/components';

export type Gem = Carry | Lift | Mine | Tunnel;

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
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
};

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
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
}

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
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
    items: Item[];
}

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
    _xp: number;
    _xpLvl: number;
    _xpToNext: number;
}

export enum Gems {
    CARRY = 'Carry',
    LIFT = 'Lift',
    MINE = 'Mine',
    TUNNEL = 'Tunnel',
}
