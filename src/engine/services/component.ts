import { Admin, TileMap, Tile, Sprite, Drop, Position, Mine, Carry, State } from '@/engine/components';
import { getStore } from '@/engine/services/store';
import { addComponent, getComponent } from '@/engine/systems/entities';
import { loadTileMapData } from '@/engine/systems/tilemap';

//#region SERVICES
export const addAdmin = ({ adminId, saveAdmin }: {
    adminId?: string | null,
    saveAdmin?: Admin,
}) => {
    if (!(adminId)) adminId = getStore({ key: 'adminId' });

    const admin: Admin = (saveAdmin) ?? {
        _: 'Admin',
        gems: [],
        items: [],
        recipes: [],
        requests: [],
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

export const addTile = ({ tileId, drops, dropAmount }: {
    dropAmount: number,
    drops: Drop[],
    tileId: string,
}) => {
    const tile: Tile = {
        _: 'Tile',
        _dropAmount: dropAmount,
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
        _itemCapacity: 10,
        _mineSpeed: 1,
        _moveSpeed: 3,
        items: [],
    };

    addComponent({ component: mine, entityId: gemId });

    return getComponent({ componentId: 'Mine', entityId: gemId });
};

export const addCarry = ({ gemId }: { gemId: string }) => {
    const carry: Carry = {
        _: 'Carry',
        _carryPickSpeed: 5,
        _carrySpeed: 5,
        _itemCapacity: 10,
        _moveSpeed: 3,
        items: [],
    };

    addComponent({ component: carry, entityId: gemId });

    return getComponent({ componentId: 'Carry', entityId: gemId });
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
