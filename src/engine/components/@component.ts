import { Admin } from './admin';
import { Carry, Floor, Lift, Mine, Shaft, Tunnel } from './gem';
import { Position } from './position';
import { Sprite } from './sprite';
import { State } from './state';
import { Tile } from './tile';
import { TileMap } from './tilemap';

export type Component = {
    'Admin': Admin;
    'Carry': Carry;
    'Floor': Floor;
    'Lift': Lift;
    'Mine': Mine;
    'Position': Position;
    'Shaft': Shaft;
    'Sprite': Sprite;
    'State': State;
    'Tile': Tile;
    'TileMap': TileMap;
    'Tunnel': Tunnel;
};
