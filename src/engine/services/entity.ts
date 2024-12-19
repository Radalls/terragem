import { Admin, Drop, Gems } from '@/engine/components';
import {
    addAdmin,
    addCarry,
    addMine,
    addPosition,
    addSprite,
    addState,
    addTile,
    addTileMap,
} from '@/engine/services/component';
import { emit } from '@/engine/services/emit';
import {
    ADMIN_ENTITY_NAME,
    createEntity,
    GEM_ENTITY_NAME,
    getAdmin,
    TILE_ENTITY_NAME,
    TILEMAP_ENTITY_NAME,
} from '@/engine/systems/entity';
import { getSpritePath } from '@/engine/systems/sprite';
import { generateTileMap } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region SERVICES
export const createEntityAdmin = ({ adminId, saveAdmin }: {
    adminId?: string | null,
    saveAdmin?: Admin,
}) => {
    if (!(adminId)) adminId = createEntity({ entityName: ADMIN_ENTITY_NAME });

    addAdmin({ adminId, saveAdmin });

    emit({ entityId: adminId, target: 'render', type: RenderEvents.ADMIN_CREATE });
};

export const createEntityTileMap = ({ tileMapName }: { tileMapName: string }) => {
    const tileMapId = createEntity({ entityName: TILEMAP_ENTITY_NAME });

    const tileMap = addTileMap({ tileMapId, tileMapName });
    addSprite({
        entityId: tileMapId,
        height: tileMap._height,
        image: getSpritePath({ spriteName: `map_${tileMap._name}` }),
        width: tileMap._width,
    });

    emit({ entityId: tileMapId, target: 'render', type: RenderEvents.TILEMAP_CREATE });

    generateTileMap({});
};

export const createEntityTile = ({ density, drops, dropAmount, x, y, sprite }: {
    density: number,
    dropAmount: number,
    drops: Drop[],
    sprite: string,
    x: number,
    y: number,
}) => {
    const tileId = createEntity({ entityName: TILE_ENTITY_NAME });

    addTile({ density, dropAmount, drops, tileId });
    addPosition({ entityId: tileId, x, y });
    addSprite({
        entityId: tileId,
        image: getSpritePath({ spriteName: sprite }),
    });

    emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_CREATE });

    return tileId;
};

export const createEntityGem = ({ type, x = 0, y = 0 }: {
    type: Gems,
    x?: number,
    y?: number,
}) => {
    const gemId = createEntity({ entityName: GEM_ENTITY_NAME });

    addPosition({ entityId: gemId, x, y });
    addState({ action: 'idle', entityId: gemId });

    if (type === Gems.MINE) {
        addMine({ gemId });
    }
    else if (type === Gems.CARRY) {
        addCarry({ gemId });
    }

    addSprite({
        entityId: gemId,
        image: getSpritePath({ spriteName: `gem_${type.toLowerCase()}` }),
    });

    const admin = getAdmin();
    admin.gems.push(gemId);
};
//#endregion
