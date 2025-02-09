import { Items } from '@/engine/components';

export type Tile = {
    _: 'Tile';
    _density: number;
    _destroy: boolean;
    _dropAmount: number;
    _lift?: string;
    _lock: boolean;
    carry: string[];
    drops: Drop[];
}

export type Drop = {
    _name: Items;
    _rate: number;
}
