import { ItemTypes } from '@/engine/components';

export type Tile = {
    _: 'Tile';
    _dropAmount: number;
    drops: Drop[];
}

export type Drop = {
    _rate: number;
    _type: ItemTypes;
}
