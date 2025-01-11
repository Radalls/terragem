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
import { getGemType, setGemAction } from '@/engine/systems/gem';
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

        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_CREATE });

        if (destroy) {
            emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_GROUND });
        }
    }
    else {
        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_CREATE });
    }

    return tileId;
};

export const createEntityGem = ({ gemId, type, x = 0, y = 0 }: {
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

        emit({
            data: { amount: 1 },
            target: 'engine',
            type: EngineEvents.GEM_QUEST,
        });
    }
    else {
        const gemType = getGemType({ gemId });
        const gemState = getComponent({ componentId: 'State', entityId: gemId });

        emit({
            entityId: gemId,
            target: 'all',
            type: (gemState._store)
                ? GameEvents.GEM_STORE
                : GameEvents.GEM_STORE_DEPLOY,
        });

        if (gemState._action === 'work') {
            //TODO: make generic
            if (gemType === Gems.CARRY) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_CARRY_REQUEST });
            }
            else if (gemType === Gems.FLOOR) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_FLOOR_REQUEST });
            }
            else if (gemType === Gems.LIFT) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_LIFT_REQUEST });
            }
            else if (gemType === Gems.MINE) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_MINE_REQUEST });
            }
            else if (gemType === Gems.SHAFT) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_SHAFT_REQUEST });
            }
            else if (gemType === Gems.TUNNEL) {
                emit({ entityId: gemId, target: 'all', type: GameEvents.GEM_TUNNEL_REQUEST });
            }
        }
        else {
            setGemAction({ action: 'idle', gemId });
        }
    }
};
//#endregion
