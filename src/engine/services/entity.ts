import { Drop, Gems, TileMap } from '@/engine/components';
import {
    addAdmin,
    addCarry,
    addFloor,
    addLift,
    addMine,
    addPosition,
    addShaft,
    addSprite,
    addState,
    addTile,
    addTileMap,
    addTunnel,
} from '@/engine/services/component';
import { emit, GameEvents } from '@/engine/services/emit';
import { EngineEvents } from '@/engine/services/event';
import { setStore } from '@/engine/services/store';
import {
    ADMIN_ENTITY_NAME,
    createEntity,
    GEM_ENTITY_NAME,
    getAdmin,
    getComponent,
    TILE_ENTITY_NAME,
    TILEMAP_ENTITY_NAME,
} from '@/engine/systems/entity';
import { getSpritePath } from '@/engine/systems/sprite';
import { generateTileMap } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
const addGems: Record<Gems, ({ gemId }: { gemId: string }) => void> = {
    [Gems.CARRY]: addCarry,
    [Gems.FLOOR]: addFloor,
    [Gems.LIFT]: addLift,
    [Gems.MINE]: addMine,
    [Gems.SHAFT]: addShaft,
    [Gems.TUNNEL]: addTunnel,
};
//#endregion

//#region SERVICES
export const createEntityAdmin = ({ adminId }: { adminId?: string | null }) => {
    if (!(adminId)) {
        adminId = createEntity({ entityName: ADMIN_ENTITY_NAME });

        addAdmin({ adminId });

        emit({ entityId: adminId, target: 'render', type: RenderEvents.ADMIN_CREATE });
    }
    else {
        setStore({ key: 'adminId', value: adminId });
    }
};

export const createEntityTileMap = ({ tileMapId, tileMapName, saveTileMap }: {
    saveTileMap?: TileMap,
    tileMapId?: string | null,
    tileMapName: string,
}) => {
    if (!(tileMapId)) {
        tileMapId = createEntity({ entityName: TILEMAP_ENTITY_NAME });

        const tileMap = addTileMap({ saveTileMap, tileMapId, tileMapName });

        addSprite({
            entityId: tileMapId,
            height: tileMap._height,
            image: getSpritePath({ spriteName: `map_${tileMap._name}` }),
            width: tileMap._width,
        });
    }
    else {
        setStore({ key: 'tileMapId', value: tileMapId });
    }

    emit({ entityId: tileMapId, target: 'render', type: RenderEvents.TILEMAP_CREATE });

    generateTileMap({ saveTileMap, tileMapId });
};

export const createEntityTile = ({ tileId, density, drops, dropAmount, destroy = false, sprite, x, y }: {
    density: number,
    destroy?: boolean,
    dropAmount: number,
    drops: Drop[],
    sprite: string,
    tileId?: string | null,
    x: number,
    y: number,
}) => {
    if (!(tileId)) {
        tileId = createEntity({ entityName: TILE_ENTITY_NAME });

        addTile({ density, destroy, dropAmount, drops, tileId });
        addPosition({ entityId: tileId, x, y });
        addSprite({
            entityId: tileId,
            image: getSpritePath({
                spriteName: (destroy)
                    ? `${sprite}${density}_destroy`
                    : `${sprite}${density}`,
            }),
        });
    }

    emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_CREATE });

    if (y <= 0) {
        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_GROUND });
    }
    else if (destroy) {
        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_DESTROY });
    }

    return tileId;
};

export const createEntityGem = ({ gemId, type, deploy = false, x = 0, y = 0 }: {
    deploy?: boolean,
    gemId?: string | null,
    type: Gems,
    x?: number,
    y?: number,
}) => {
    if (!(gemId)) {
        const admin = getAdmin();

        gemId = createEntity({ entityName: GEM_ENTITY_NAME });

        addPosition({ entityId: gemId, x, y });
        addState({ action: 'idle', entityId: gemId });

        addGems[type]({ gemId });

        addSprite({
            entityId: gemId,
            image: getSpritePath({ spriteName: `gem_${type.toLowerCase()}` }),
        });

        admin.gems.push(gemId);

        emit({ data: { amount: 1 }, target: 'engine', type: EngineEvents.QUEST_GEMS });

        if (deploy) {
            emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_CREATE });
            emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_STORE_DEPLOY });
        }
    }
    else {
        const gemState = getComponent({ componentId: 'State', entityId: gemId });

        emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_CREATE });

        emit({
            entityId: gemId,
            target: 'all',
            type: (gemState._store)
                ? GameEvents.GEM_STORE
                : GameEvents.GEM_STORE_DEPLOY,
        });

        if (!(gemState._store) && gemState._action === 'work') {
            emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_WORK });
        }
    }
};
//#endregion
