import {
    Admin,
    Carry,
    Drop,
    Floor,
    Gems,
    Items,
    Lift,
    Mine,
    Position,
    Shaft,
    Sprite,
    State,
    Tile,
    TileMap,
    Tunnel,
} from '@/engine/components';
import { getStore } from '@/engine/services/store';
import { addComponent, getComponent } from '@/engine/systems/entity';
import { getGemTypeCount } from '@/engine/systems/gem';
import { loadTileMapData } from '@/engine/systems/tilemap';

//#region CONSTANTS
/* FORGES */
const ADMIN_INIT_FORGE_VULKAN_SPEED = 0.1;
const ADMIN_INIT_FORGE_ORYON_SPEED = 0.1;
/* GEM CARRY */
const ADMIN_INIT_GEM_CARRY_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_CARRY_ITEM_CAPACITY = 10;
const ADMIN_INIT_GEM_CARRY_ITEM_SPEED = 2;
const ADMIN_INIT_GEM_CARRY_ITEM_AMOUNT = 1;
const ADMIN_INIT_GEM_CARRY_ITEM_RANGE = 4;
/* GEM FLOOR */
const ADMIN_INIT_GEM_FLOOR_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_FLOOR_DIG_SPEED = 0.2;
const ADMIN_INIT_GEM_FLOOR_DIG_STRENGTH = 1;
/* GEM LIFT */
const ADMIN_INIT_GEM_LIFT_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_LIFT_ITEM_CAPACITY = 100;
const ADMIN_INIT_GEM_LIFT_ITEM_SPEED = 0.1;
const ADMIN_INIT_GEM_LIFT_ITEM_RANGE = 4;
/* GEM MAX */
const ADMIN_INIT_GEM_MAX = 5;
/* GEM MINE */
const ADMIN_INIT_GEM_MINE_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_MINE_ITEM_CAPACITY = 10;
const ADMIN_INIT_GEM_MINE_DIG_SPEED = 0.5;
const ADMIN_INIT_GEM_MINE_DIG_STRENGTH = 1;
const ADMIN_INIT_GEM_MINE_DIG_AMOUNT = 1;
/* GEM SHAFT */
const ADMIN_INIT_GEM_SHAFT_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_SHAFT_DIG_SPEED = 1;
const ADMIN_INIT_GEM_SHAFT_DIG_STRENGTH = 1;
const ADMIN_INIT_GEM_SHAFT_DIG_RANGE = 4;
/* GEM TUNNEL */
const ADMIN_INIT_GEM_TUNNEL_MOVE_SPEED = 3;
const ADMIN_INIT_GEM_TUNNEL_DIG_SPEED = 1;
const ADMIN_INIT_GEM_TUNNEL_DIG_STRENGTH = 1;
const ADMIN_INIT_GEM_TUNNEL_DIG_RANGE = 3;
/* LABS */
const ADMIN_INIT_LAB_POINTS = 0;
//#endregion

//#region SERVICES
export const addAdmin = ({ adminId }: { adminId?: string | null }) => {
    if (!(adminId)) adminId = getStore({ key: 'adminId' });

    const admin: Admin = {
        _: 'Admin',
        builds: {
            forges: {
                oryon: 0,
                vulkan: 0,
            },
        },
        crafts: ['GEM_MINE'],
        gems: [],
        items: [
            {
                _amount: 50,
                _name: Items.RES_STONE,
            },
            {
                _amount: 25,
                _name: Items.RES_GEOLYN,
            },
            {
                _amount: 25,
                _name: Items.RES_CERULYN,
            },
            {
                _amount: 1,
                _name: Items.RES_LUMYN,
            },
        ],
        labs: [],
        mechs: [],
        quests: [],
        requests: [],
        settings: {
            _audioActive: true,
            _audioVolume: 0.5,
        },
        stats: {
            /* FORGES */
            _forgeOryonSpeed: ADMIN_INIT_FORGE_ORYON_SPEED,
            _forgeVulkanSpeed: ADMIN_INIT_FORGE_VULKAN_SPEED,
            /* GEM CARRY */
            _gemCarryItemAmount: ADMIN_INIT_GEM_CARRY_ITEM_AMOUNT,
            _gemCarryItemCapacity: ADMIN_INIT_GEM_CARRY_ITEM_CAPACITY,
            _gemCarryItemRange: ADMIN_INIT_GEM_CARRY_ITEM_RANGE,
            _gemCarryItemSpeed: ADMIN_INIT_GEM_CARRY_ITEM_SPEED,
            _gemCarryMoveSpeed: ADMIN_INIT_GEM_CARRY_MOVE_SPEED,
            /* GEM FLOOR */
            _gemFloorDigSpeed: ADMIN_INIT_GEM_FLOOR_DIG_SPEED,
            _gemFloorDigStrength: ADMIN_INIT_GEM_FLOOR_DIG_STRENGTH,
            _gemFloorMoveSpeed: ADMIN_INIT_GEM_FLOOR_MOVE_SPEED,
            /* GEM LIFT */
            _gemLiftItemCapacity: ADMIN_INIT_GEM_LIFT_ITEM_CAPACITY,
            _gemLiftItemRange: ADMIN_INIT_GEM_LIFT_ITEM_RANGE,
            _gemLiftItemSpeed: ADMIN_INIT_GEM_LIFT_ITEM_SPEED,
            _gemLiftMoveSpeed: ADMIN_INIT_GEM_LIFT_MOVE_SPEED,
            /* GEM MAX */
            _gemMax: ADMIN_INIT_GEM_MAX,
            /* GEM MINE */
            _gemMineDigAmount: ADMIN_INIT_GEM_MINE_DIG_AMOUNT,
            _gemMineDigSpeed: ADMIN_INIT_GEM_MINE_DIG_SPEED,
            _gemMineDigStrength: ADMIN_INIT_GEM_MINE_DIG_STRENGTH,
            _gemMineItemCapacity: ADMIN_INIT_GEM_MINE_ITEM_CAPACITY,
            _gemMineMoveSpeed: ADMIN_INIT_GEM_MINE_MOVE_SPEED,
            /* GEM SHAFT */
            _gemShaftDigRange: ADMIN_INIT_GEM_SHAFT_DIG_RANGE,
            _gemShaftDigSpeed: ADMIN_INIT_GEM_SHAFT_DIG_SPEED,
            _gemShaftDigStrength: ADMIN_INIT_GEM_SHAFT_DIG_STRENGTH,
            _gemShaftMoveSpeed: ADMIN_INIT_GEM_SHAFT_MOVE_SPEED,
            /* GEM TUNNEL */
            _gemTunnelDigRange: ADMIN_INIT_GEM_TUNNEL_DIG_RANGE,
            _gemTunnelDigSpeed: ADMIN_INIT_GEM_TUNNEL_DIG_SPEED,
            _gemTunnelDigStrength: ADMIN_INIT_GEM_TUNNEL_DIG_STRENGTH,
            _gemTunnelMoveSpeed: ADMIN_INIT_GEM_TUNNEL_MOVE_SPEED,
            /* LABS */
            _labPoints: ADMIN_INIT_LAB_POINTS,
        },
    };

    addComponent({ component: admin, entityId: adminId });

    return getComponent({ componentId: 'Admin', entityId: adminId });
};

export const addTileMap = ({ tileMapId, tileMapName, saveTileMap }: {
    saveTileMap?: TileMap,
    tileMapId?: string | null,
    tileMapName: string,
}) => {
    if (!(tileMapId)) tileMapId = getStore({ key: 'tileMapId' });

    if (saveTileMap) {
        addComponent({ component: saveTileMap, entityId: tileMapId });

        return getComponent({ componentId: 'TileMap', entityId: tileMapId });
    }

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
        _name: `Mine-${getGemTypeCount({ gemType: Gems.MINE })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
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
        _name: `Carry-${getGemTypeCount({ gemType: Gems.CARRY })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
        items: [],
    };

    addComponent({ component: carry, entityId: gemId });

    return getComponent({ componentId: 'Carry', entityId: gemId });
};

export const addLift = ({ gemId }: { gemId: string }) => {
    const lift: Lift = {
        _: 'Lift',
        _itemCapacity: 0,
        _itemRange: 0,
        _itemSpeed: 0,
        _moveSpeed: 0,
        _name: `Lift-${getGemTypeCount({ gemType: Gems.LIFT })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
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
        _name: `Tunnel-${getGemTypeCount({ gemType: Gems.TUNNEL })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
    };

    addComponent({ component: tunnel, entityId: gemId });

    return getComponent({ componentId: 'Tunnel', entityId: gemId });
};

export const addFloor = ({ gemId }: { gemId: string }) => {
    const floor: Floor = {
        _: 'Floor',
        _digSpeed: 0,
        _digStrength: 0,
        _moveSpeed: 0,
        _name: `Floor-${getGemTypeCount({ gemType: Gems.FLOOR })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
    };

    addComponent({ component: floor, entityId: gemId });

    return getComponent({ componentId: 'Floor', entityId: gemId });
};

export const addShaft = ({ gemId }: { gemId: string }) => {
    const shaft: Shaft = {
        _: 'Shaft',
        _digRange: 0,
        _digSpeed: 0,
        _digStrength: 0,
        _moveSpeed: 0,
        _name: `Shaft-${getGemTypeCount({ gemType: Gems.SHAFT })}`,
        _xp: 0,
        _xpLvl: 1,
        _xpToNext: 100,
    };

    addComponent({ component: shaft, entityId: gemId });

    return getComponent({ componentId: 'Shaft', entityId: gemId });
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
