import {
    Admin,
    TileMap,
    Tile,
    Sprite,
    Drop,
    Position,
    Mine,
    Carry,
    State,
    Lift,
    Tunnel,
    Items,
} from '@/engine/components';
import { getStore } from '@/engine/services/store';
import { addComponent, getComponent } from '@/engine/systems/entity';
import { loadTileMapData } from '@/engine/systems/tilemap';

//#region CONSTANTS
const ADMIN_INIT_LAB_POINTS = 0;
const ADMIN_INIT_GEM_MAX = 3;
const ADMIN_INIT_GEM_MINE_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_MINE_ITEM_CAPACITY = 10;
const ADMIN_INIT_GEM_MINE_DIG_SPEED = 1;
const ADMIN_INIT_GEM_MINE_DIG_STRENGTH = 1;
const ADMIN_INIT_GEM_MINE_DIG_AMOUNT = 1;
const ADMIN_INIT_GEM_CARRY_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_CARRY_ITEM_CAPACITY = 10;
const ADMIN_INIT_GEM_CARRY_ITEM_SPEED = 5;
const ADMIN_INIT_GEM_CARRY_ITEM_AMOUNT = 1;
const ADMIN_INIT_GEM_CARRY_ITEM_RANGE = 4;
const ADMIN_INIT_GEM_TUNNEL_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_TUNNEL_DIG_SPEED = 1;
const ADMIN_INIT_GEM_TUNNEL_DIG_STRENGTH = 1;
const ADMIN_INIT_GEM_TUNNEL_DIG_RANGE = 3;
const ADMIN_INIT_GEM_LIFT_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_LIFT_ITEM_CAPACITY = 10;
const ADMIN_INIT_GEM_LIFT_ITEM_SPEED = 5;
const ADMIN_INIT_GEM_LIFT_ITEM_AMOUNT = 1;
//#endregion

//#region SERVICES
export const addAdmin = ({ adminId, saveAdmin }: {
    adminId?: string | null,
    saveAdmin?: Admin,
}) => {
    if (!(adminId)) adminId = getStore({ key: 'adminId' });

    const admin: Admin = (saveAdmin) ?? {
        _: 'Admin',
        crafts: ['GEM_MINE'],
        gems: [],
        items: [
            {
                _amount: 50,
                // _amount: 999,
                _name: Items.STONE,
            },
            {
                _amount: 25,
                // _amount: 999,
                _name: Items.IRON,
            },
            {
                _amount: 25,
                // _amount: 999,
                _name: Items.COPPER,
            },
            {
                _amount: 1,
                // _amount: 999,
                _name: Items.LUMYN,
            },
        ],
        labs: [],
        quests: [],
        requests: [],
        stats: {
            _gemCarryItemAmount: ADMIN_INIT_GEM_CARRY_ITEM_AMOUNT,
            _gemCarryItemCapacity: ADMIN_INIT_GEM_CARRY_ITEM_CAPACITY,
            _gemCarryItemRange: ADMIN_INIT_GEM_CARRY_ITEM_RANGE,
            _gemCarryItemSpeed: ADMIN_INIT_GEM_CARRY_ITEM_SPEED,
            _gemCarryMoveSpeed: ADMIN_INIT_GEM_CARRY_MOVE_SPEED,
            _gemLiftItemAmount: ADMIN_INIT_GEM_LIFT_ITEM_AMOUNT,
            _gemLiftItemCapacity: ADMIN_INIT_GEM_LIFT_ITEM_CAPACITY,
            _gemLiftItemSpeed: ADMIN_INIT_GEM_LIFT_ITEM_SPEED,
            _gemLiftMoveSpeed: ADMIN_INIT_GEM_LIFT_MOVE_SPEED,
            _gemMax: ADMIN_INIT_GEM_MAX,
            _gemMineDigAmount: ADMIN_INIT_GEM_MINE_DIG_AMOUNT,
            _gemMineDigSpeed: ADMIN_INIT_GEM_MINE_DIG_SPEED,
            _gemMineDigStrength: ADMIN_INIT_GEM_MINE_DIG_STRENGTH,
            _gemMineItemCapacity: ADMIN_INIT_GEM_MINE_ITEM_CAPACITY,
            _gemMineMoveSpeed: ADMIN_INIT_GEM_MINE_MOVE_SPEED,
            _gemTunnelDigRange: ADMIN_INIT_GEM_TUNNEL_DIG_RANGE,
            _gemTunnelDigSpeed: ADMIN_INIT_GEM_TUNNEL_DIG_SPEED,
            _gemTunnelDigStrength: ADMIN_INIT_GEM_TUNNEL_DIG_STRENGTH,
            _gemTunnelMoveSpeed: ADMIN_INIT_GEM_TUNNEL_MOVE_SPEED,
            _labPoints: ADMIN_INIT_LAB_POINTS,
        },
    };

    addComponent({ component: admin, entityId: adminId });

    return getComponent({ componentId: 'Admin', entityId: adminId });
};

export const addTileMap = ({ tileMapId, tileMapName }: {
    tileMapId?: string | null,
    tileMapName: string,
}) => {
    if (!(tileMapId)) tileMapId = getStore({ key: 'tileMapId' });

    const tileMapData = loadTileMapData({ tileMapName });

    const tileMap: TileMap = {
        _: 'TileMap',
        _height: tileMapData.height,
        _name: tileMapData.name,
        _width: tileMapData.width,
        tiles: [],
    };

    addComponent({ component: tileMap, entityId: tileMapId });

    return getComponent({ componentId: 'TileMap', entityId: tileMapId });
};

export const addTile = ({ tileId, density, drops, dropAmount, destroy = false }: {
    density: number,
    destroy?: boolean,
    dropAmount: number,
    drops: Drop[],
    tileId: string,
}) => {
    const tile: Tile = {
        _: 'Tile',
        _density: density,
        _destroy: destroy,
        _dropAmount: dropAmount,
        _lock: false,
        drops,
    };

    addComponent({ component: tile, entityId: tileId });

    return getComponent({ componentId: 'Tile', entityId: tileId });
};

export const addPosition = ({ entityId, x, y }: {
    entityId: string,
    x: number,
    y: number,
}) => {
    const position: Position = {
        _: 'Position',
        _x: x,
        _y: y,
    };

    addComponent({ component: position, entityId });

    return getComponent({ componentId: 'Position', entityId });
};

export const addSprite = ({ entityId, height = 1, width = 1, image }: {
    entityId: string,
    height?: number,
    image: string,
    width?: number,
}) => {
    const sprite: Sprite = {
        _: 'Sprite',
        _height: height,
        _image: image,
        _width: width,
    };

    addComponent({ component: sprite, entityId });

    return getComponent({ componentId: 'Sprite', entityId });
};

export const addMine = ({ gemId }: { gemId: string }) => {
    const mine: Mine = {
        _: 'Mine',
        _digAmount: 0,
        _digSpeed: 0,
        _digStrength: 0,
        _itemCapacity: 0,
        _moveSpeed: 0,
        items: [],
    };

    addComponent({ component: mine, entityId: gemId });

    return getComponent({ componentId: 'Mine', entityId: gemId });
};

export const addCarry = ({ gemId }: { gemId: string }) => {
    const carry: Carry = {
        _: 'Carry',
        _itemAmount: 0,
        _itemCapacity: 0,
        _itemRange: 0,
        _itemSpeed: 0,
        _moveSpeed: 0,
        items: [],
    };

    addComponent({ component: carry, entityId: gemId });

    return getComponent({ componentId: 'Carry', entityId: gemId });
};

export const addLift = ({ gemId }: { gemId: string }) => {
    const lift: Lift = {
        _: 'Lift',
        _itemAmount: 0,
        _itemCapacity: 0,
        _itemSpeed: 0,
        _moveSpeed: 0,
        items: [],
    };

    addComponent({ component: lift, entityId: gemId });

    return getComponent({ componentId: 'Lift', entityId: gemId });
};

export const addTunnel = ({ gemId }: { gemId: string }) => {
    const tunnel: Tunnel = {
        _: 'Tunnel',
        _digRange: 0,
        _digSpeed: 0,
        _digStrength: 0,
        _moveSpeed: 0,
    };

    addComponent({ component: tunnel, entityId: gemId });

    return getComponent({ componentId: 'Tunnel', entityId: gemId });
};

export const addState = ({ entityId, action }: {
    action: State['_action'],
    entityId: string,
}) => {
    const state: State = {
        _: 'State',
        _action: action,
        _request: false,
        _store: true,
    };

    addComponent({ component: state, entityId });

    return getComponent({ componentId: 'State', entityId });
};
//#endregion
