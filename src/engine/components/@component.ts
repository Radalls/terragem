import { Admin } from './admin';
import { Carry, Mine } from './gem';
import { Position } from './position';
import { Sprite } from './sprite';
import { State } from './state';
import { Tile } from './tile';
import { TileMap } from './tilemap';

export type Component = {
    'Admin': Admin;
    'Carry': Carry;
    'Mine': Mine;
    'Position': Position;
    'Sprite': Sprite;
    'State': State;
    'Tile': Tile;
    'TileMap': TileMap;
};
