import { Collider } from '@/engine/components/collider';
import { Dialog } from '@/engine/components/dialog';
import { Energy } from '@/engine/components/energy';
import { Inventory } from '@/engine/components/inventory';
import { Manager } from '@/engine/components/manager';
import { Position } from '@/engine/components/position';
import {
    ActivityBugData,
    ActivityFishData,
    ResourceTypes,
    Resource,
} from '@/engine/components/resource';
import { Sprite } from '@/engine/components/sprite';
import { State } from '@/engine/components/state';
import { TileMap } from '@/engine/components/tilemap';
import { Trigger } from '@/engine/components/trigger';
import { addComponent, getComponent, isPlayer } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { loadDialogData } from '@/engine/systems/dialog/dialog.data';
import { DayTimes } from '@/engine/systems/manager';
import { getResourceData, generateResourceItem } from '@/engine/systems/resource';
import { event } from '@/render/events';

//#region SERVICES
export const addCollider = ({ entityId, points }: {
    entityId: string,
    points?: { x: number, y: number }[],
}) => {
    const collider: Collider = {
        _: 'Collider',
        points: (points)
            ? points.map(({ x, y }) => ({ _offsetX: x, _offsetY: y }))
            : [{ _offsetX: 0, _offsetY: 0 }],
    };

    addComponent({ component: collider, entityId });
};

export const addDialog = ({ entityId }: {
    entityId: string,
}) => {
    const dialog: Dialog = {
        _: 'Dialog',
        texts: [],
    };

    addComponent({ component: dialog, entityId });
    loadDialogData({ entityId });
};

export const addEnergy = ({ entityId, current = 0, max = 10, savedEnergy }: {
    current?: number,
    entityId: string,
    max?: number,
    savedEnergy?: Energy,
}) => {
    const energy: Energy = savedEnergy ?? {
        _: 'Energy',
        _current: current,
        _max: max,
    };

    addComponent({ component: energy, entityId });

    if (isPlayer({ entityId })) {
        event({ type: EventTypes.ENERGY_CREATE });
        event({ type: EventTypes.ENERGY_UPDATE });
        event({ type: EventTypes.ENERGY_DISPLAY });
    }
};

export const addInventory = ({ entityId, maxSlots = 10, maxTools = 3, savedInventory }: {
    entityId: string,
    maxSlots?: number,
    maxTools?: number,
    savedInventory?: Inventory,
}) => {
    const inventory: Inventory = savedInventory ?? {
        _: 'Inventory',
        _maxSlots: maxSlots,
        _maxTools: maxTools,
        slots: [],
        tools: [],
    };

    addComponent({ component: inventory, entityId });

    if (isPlayer({ entityId })) {
        event({ type: EventTypes.INVENTORY_CREATE });
        event({ type: EventTypes.INVENTORY_UPDATE });
        event({ type: EventTypes.INVENTORY_TOOL_ACTIVE_DISPLAY });
        event({ type: EventTypes.INVENTORY_TOOL_ACTIVATE });
        event({ type: EventTypes.INVENTORY_TOOL_UPDATE });
    }
};

export const addManager = ({ entityId, savedManager }: {
    entityId: string,
    savedManager?: Manager,
}) => {
    const manager: Manager = (savedManager) ?? {
        _: 'Manager',
        _actionCount: 0,
        _dayTime: DayTimes.NOON,
        _selectedCraftRecipe: 0,
        _selectedInventorySlot: 0,
        _selectedInventorySlotOption: 0,
        _selectedLaunchOption: 0,
        _selectedQuest: 0,
        _selectedSetting: 0,
        itemRecipes: [],
        quests: [],
        questsDone: [],
        settings: {
            _audio: false,
            _audioVolume: 1,
            keys: {
                action: {
                    _act: ' ',
                    _back: 'Escape',
                    _inventory: 'i',
                    _quit: 'Shift',
                    _save: 'Control',
                    _tool: 't',
                },
                move: {
                    _down: 'ArrowDown',
                    _left: 'ArrowLeft',
                    _right: 'ArrowRight',
                    _up: 'ArrowUp',
                },
            },
        },
        tileMapStates: [],
    };

    addComponent({ component: manager, entityId });

    if (!(savedManager)) {
        event({ type: EventTypes.MENU_LAUNCH_DISPLAY });
        event({ type: EventTypes.MENU_LAUNCH_UPDATE });
    }
};

export const addPosition = ({ entityId, savedPosition, x = 0, y = 0 }: {
    entityId: string,
    savedPosition?: Position,
    x?: number,
    y?: number,
}) => {
    const tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: addPosition.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const position: Position = savedPosition ?? {
        _: 'Position',
        _subX: 0.5,
        _subY: 0.5,
        _tileMapName: tileMap._name,
        _x: x,
        _y: y,
    };

    addComponent({ component: position, entityId });

    event({ entityId, type: EventTypes.ENTITY_POSITION_UPDATE });
};

export const addResourceBug = ({
    entityId,
    items,
}: {
    entityId: string,
    items: { name: string, rate: number }[],
}) => {
    const resource: Resource = {
        _: 'Resource',
        _type: ResourceTypes.BUG,
        items: items.map(item => ({ _name: item.name, _rate: item.rate })),
    };

    addComponent({ component: resource, entityId });

    generateResourceItem({ init: true, resourceEntityId: entityId });
    const resourceData = getResourceData({ resourceEntityId: entityId });

    resource._cooldown = resourceData.cooldown;

    const activityBugData: ActivityBugData = {
        _hp: resourceData.data.maxHp,
        _maxHp: resourceData.data.maxHp,
        _maxNbErrors: resourceData.data.maxNbErrors,
        _nbErrors: 0,
        _symbolInterval: resourceData.data.symbolInterval,
    };
    resource.activityData = activityBugData;

    return { resource, resourceData };
};

export const addResourceCraft = ({ entityId }: { entityId: string }) => {
    const resource: Resource = {
        _: 'Resource',
        _type: ResourceTypes.CRAFT,
        activityData: {
            _hitCount: 0,
        },
    };

    addComponent({ component: resource, entityId });
};

export const addResourceFish = ({
    entityId,
    items,
}: {
    entityId: string,
    items: { name: string, rate: number }[],
}) => {
    const resource: Resource = {
        _: 'Resource',
        _type: ResourceTypes.FISH,
        items: items.map(({ name, rate }) => ({ _name: name, _rate: rate })),
    };

    addComponent({ component: resource, entityId });

    generateResourceItem({ init: true, resourceEntityId: entityId });
    const resourceData = getResourceData({ resourceEntityId: entityId });

    resource._cooldown = resourceData.cooldown;

    //TODO: handle fishrod data
    const activityFishData: ActivityFishData = {
        _damage: resourceData.data.damage,
        _frenzyDuration: resourceData.data.frenzyDuration,
        _frenzyInterval: resourceData.data.frenzyInterval,
        _hp: resourceData.data.maxHp,
        _maxHp: resourceData.data.maxHp,
        _rodDamage: 8,
        _rodMaxTension: 1000,
        _rodTension: 0,
    };
    resource.activityData = activityFishData;

    return { resource, resourceData };
};

export const addResourceItem = ({
    entityId,
    items,
}: {
    entityId: string,
    items: { name: string, rate: number }[],
}) => {
    const resource: Resource = {
        _: 'Resource',
        _type: ResourceTypes.ITEM,
        items: items.map(({ name, rate }) => ({ _name: name, _rate: rate })),
    };

    addComponent({ component: resource, entityId });

    generateResourceItem({ init: true, resourceEntityId: entityId });
    const resourceData = getResourceData({ resourceEntityId: entityId });

    resource._cooldown = resourceData.cooldown;

    return { resource, resourceData };
};

export const addResourcePlace = ({ entityId, itemName }: {
    entityId: string,
    itemName: string,
}) => {
    const resource: Resource = {
        _: 'Resource',
        _type: ResourceTypes.PLACE,
        item: {
            info: { _name: itemName },
            sprite: { _image: `item_${itemName.toLowerCase()}` },
        },
    };

    addComponent({ component: resource, entityId });
};

export const addSprite = ({ direction, entityId, gif = false, height = 1, image, width = 1 }: {
    direction?: 'up' | 'down' | 'left' | 'right',
    entityId: string,
    gif?: boolean,
    height?: number,
    image: string,
    width?: number,
}) => {
    const sprite: Sprite = {
        _: 'Sprite',
        _direction: direction,
        _gif: gif,
        _height: height,
        _image: image,
        _width: width,
    };

    addComponent({ component: sprite, entityId });

    event({ entityId, type: EventTypes.ENTITY_SPRITE_CREATE });
};

export const addState = ({ entityId, load, cooldown, active }: {
    active?: boolean
    cooldown?: boolean,
    entityId: string,
    load?: boolean,
}) => {
    const state: State = {
        _: 'State',
        _active: active,
        _cooldown: cooldown,
        _load: load,
    };

    addComponent({ component: state, entityId });
};

export const addTileMap = ({ entityId, tileMapName }: {
    entityId: string,
    tileMapName: string
}) => {
    const tileMap: TileMap = {
        _: 'TileMap',
        _height: 0,
        _name: tileMapName,
        _width: 0,
        tiles: [],
    };

    addComponent({ component: tileMap, entityId });
};

export const addTrigger = ({ entityId, priority = 0, points }: {
    entityId: string,
    points?: { x: number, y: number }[],
    priority?: number
}) => {
    const trigger: Trigger = {
        _: 'Trigger',
        _priority: priority,
        points: (points)
            ? points.map(({ x, y }) => ({ _offsetX: x, _offsetY: y }))
            : [{ _offsetX: 0, _offsetY: 0 }],
    };

    addComponent({ component: trigger, entityId });
};
//#endregion
