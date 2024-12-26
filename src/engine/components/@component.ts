import { Admin } from './admin';
import { Carry, Lift, Mine, Tunnel } from './gem';
import { Position } from './position';
import { Sprite } from './sprite';
import { State } from './state';
import { Tile } from './tile';
import { TileMap } from './tilemap';

export type Component = {
    'Admin': Admin;
    'Carry': Carry;
    'Lift': Lift;
    'Mine': Mine;
    'Position': Position;
    'Sprite': Sprite;
    'State': State;
    'Tile': Tile;
    'TileMap': TileMap;
    'Tunnel': Tunnel;
};
