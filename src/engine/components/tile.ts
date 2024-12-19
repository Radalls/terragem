import { Items } from '@/engine/components';

export type Tile = {
    _: 'Tile';
    _density: number;
    _dropAmount: number;
    drops: Drop[];
}

export type Drop = {
    _name: Items;
    _rate: number;
}
