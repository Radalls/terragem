import { ResourceTypes } from './resource';
import { Sprite } from './sprite';

export type Inventory = {
    _: 'Inventory';
    _maxSlots: number;
    _maxTools: number;
    slots: InventorySlot[];
    tools: InventoryTool[];
};

export type Item = {
    info: ItemInfo;
    sprite: ItemSprite;
};

export type Tool = {
    _activity: ResourceTypes;
    item: Item;
};

type InventorySlot = {
    _amount: number;
    _maxAmount: number;
    item: Item;
};

type ItemInfo = {
    _description?: string;
    _name: string;
};

type ItemSprite = Pick<Sprite, '_image'>;

type InventoryTool = {
    _active: boolean;
    tool: Tool;
};
