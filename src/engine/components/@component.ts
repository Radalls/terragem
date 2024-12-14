import { Collider } from './collider';
import { Dialog } from './dialog';
import { Energy } from './energy';
import { Inventory } from './inventory';
import { Manager } from './manager';
import { Position } from './position';
import { Resource } from './resource';
import { Sprite } from './sprite';
import { State } from './state';
import { TileMap } from './tilemap';
import { Trigger } from './trigger';

export type Component = {
    'Collider': Collider;
    'Dialog': Dialog;
    'Energy': Energy;
    'Inventory': Inventory;
    'Manager': Manager;
    'Position': Position;
    'Resource': Resource;
    'Sprite': Sprite;
    'State': State;
    'TileMap': TileMap;
    'Trigger': Trigger;
};
