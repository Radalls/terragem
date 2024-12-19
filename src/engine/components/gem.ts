import { Item } from '@/engine/components';

export type Mine = {
    _: 'Mine';
    _itemCapacity: number;
    _mineSpeed: number;
    _mineStrength: number;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    items: Item[];
};

export type Carry = {
    _: 'Carry';
    _carryPickSpeed: number;
    _carrySpeed: number;
    _carryStartX?: number;
    _carryStartY?: number;
    _carryTargetX?: number;
    _carryTargetY?: number;
    _carryTo?: 'start' | 'target';
    _itemCapacity: number;
    _moveSpeed: number;
    _moveX?: number;
    _moveY?: number;
    items: Item[];
}

export enum Gems {
    CARRY = 'Carry',
    MINE = 'Mine',
}
