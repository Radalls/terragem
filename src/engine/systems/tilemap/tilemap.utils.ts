import { generateTileMap, setTile } from './tilemap';
import { loadTileMapData } from './tilemap.data';

import { TileExit, Tile } from '@/engine/components/tilemap';
import {
    checkComponent,
    destroyAllEntities,
    EntityTypes,
    findEntityByName,
    findEntityByMapPosition,
    getComponent,
    loadEntityData,
    findEntitiesByMap,
} from '@/engine/entities';
import { randAudio } from '@/engine/services/audio';
import {
    createEntityNpc,
    createEntityResourceItem,
    createEntityResourceBug,
    createEntityResourceFish,
    createEntityResourceCraft,
    createEntityAsset,
} from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { findItemRule } from '@/engine/systems/inventory';
import { createTileMapState, getTileMapState } from '@/engine/systems/manager';
import { updatePosition } from '@/engine/systems/position';
import { placeResource } from '@/engine/systems/resource';
import { setEntityLoad } from '@/engine/systems/state';
import { event } from '@/render/events';

//#region CHECKS
export const targetExitUp = ({ tile, exit, targetX, targetY }: {
    exit: TileExit,
    targetX: number,
    targetY: number,
    tile: Tile,
}) => (exit._direction === 'up' && targetX === tile.position._x && targetY === tile.position._y - 1);

export const targetExitDown = ({ tile, exit, targetX, targetY }: {
    exit: TileExit,
    targetX: number,
    targetY: number,
    tile: Tile,
}) => (exit._direction === 'down' && targetX === tile.position._x && targetY === tile.position._y + 1);

export const targetExitLeft = ({ tile, exit, targetX, targetY }: {
    exit: TileExit,
    targetX: number,
    targetY: number,
    tile: Tile,
}) => (exit._direction === 'left' && targetX === tile.position._x - 1 && targetY === tile.position._y);

export const targetExitRight = ({ tile, exit, targetX, targetY }: {
    exit: TileExit,
    targetX: number,
    targetY: number,
    tile: Tile,
}) => (exit._direction === 'right' && targetX === tile.position._x + 1 && targetY === tile.position._y);

export const targetExit = ({ tile, exit, targetX, targetY }: {
    exit: TileExit,
    targetX: number,
    targetY: number,
    tile: Tile,
}) => {
    return (
        targetExitUp({ exit, targetX, targetY, tile })
        || targetExitDown({ exit, targetX, targetY, tile })
        || targetExitLeft({ exit, targetX, targetY, tile })
        || targetExitRight({ exit, targetX, targetY, tile })
    );
};

export const tileIsGrass = ({ tile }: { tile: Tile }) => tile._sound?.includes('grass');
export const tileIsSand = ({ tile }: { tile: Tile }) => tile._sound?.includes('sand');
//#endregion

//#region UTILS
export const findTileByEntityId = ({ entityId, tileMapEntityId }: {
    entityId: string,
    tileMapEntityId?: string | null
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: findTileByEntityId.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    return tileMap.tiles.find(tile => tile._entityIds.includes(entityId));
};

export const findTileByPosition = ({ x, y, tileMapEntityId }: {
    tileMapEntityId?: string | null
    x: number,
    y: number,
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: findTileByPosition.name });

    return getComponent({ componentId: 'TileMap', entityId: tileMapEntityId })
        .tiles.find(tile => tile.position._x === x && tile.position._y === y);
};

export const generateTileMapTiles = ({ tileMapEntityId }: { tileMapEntityId?: string | null }) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: generateTileMap.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapData = loadTileMapData({ tileMapName: tileMap._name })
        ?? error({ message: `TileMapData for ${tileMap._name} not found`, where: generateTileMap.name });

    for (const tile of tileMapData.tiles) {
        const newTile: Tile = {
            _entityColliderIds: [],
            _entityIds: [],
            _entityTriggerIds: [],
            _solid: tile.solid,
            _sound: tile.sound,
            exits: (tile.exits)
                ? tile.exits.map(exit => ({
                    _direction: exit.direction,
                    _targetMap: exit.map,
                    targetPosition: {
                        _x: exit.x,
                        _y: exit.y,
                    },
                }))
                : undefined,
            position: {
                _x: tile.x,
                _y: tile.y,
            },
        };

        tileMap.tiles.push(newTile);
    }
};

export const generateTileMapEntities = ({ tileMapEntityId }: { tileMapEntityId?: string | null }) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: generateTileMapEntities.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapData = loadTileMapData({ tileMapName: tileMap._name })
        ?? error({ message: `TileMapData for ${tileMap._name} not found`, where: generateTileMapEntities.name });

    for (const mapEntity of tileMapData.entities) {
        if (mapEntity.name) {
            const entityData = loadEntityData({ entityName: mapEntity.name, entityType: mapEntity.type })
                ?? error({
                    message: `EntityData for ${mapEntity.type} ${mapEntity.name} not found`,
                    where: generateTileMapEntities.name,
                });

            if (mapEntity.type === EntityTypes.NPC) {
                createEntityNpc({
                    collider: entityData.collider,
                    entityName: mapEntity.name,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    spriteHeight: entityData.height,
                    spritePath: `npc_${mapEntity.name.toLowerCase()}`,
                    spriteWidth: entityData.width,
                    trigger: entityData.trigger,
                });
            }
            else if (mapEntity.type === EntityTypes.RESOURCE_CRAFT) {
                createEntityResourceCraft({
                    collider: entityData.collider,
                    entityName: mapEntity.name,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    spriteHeight: entityData.height,
                    spritePath: `resource_${mapEntity.name.toLowerCase()}`,
                    spriteWidth: entityData.width,
                    trigger: entityData.trigger,
                });
            }
            else if (mapEntity.type === EntityTypes.ASSET) {
                createEntityAsset({
                    collider: entityData.collider,
                    entityName: mapEntity.name,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    spriteHeight: entityData.height,
                    spritePath: `asset_${mapEntity.name.toLowerCase()}`,
                    spriteWidth: entityData.width,
                });
            }
        }
        else if (mapEntity.items) {
            if (mapEntity.type === EntityTypes.RESOURCE_ITEM) {
                createEntityResourceItem({
                    entityName: mapEntity.type,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    resourceItems: mapEntity.items,
                });
            }
            else if (mapEntity.type === EntityTypes.RESOURCE_BUG) {
                createEntityResourceBug({
                    entityName: mapEntity.type,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    resourceItems: mapEntity.items,
                });
            }
            else if (mapEntity.type === EntityTypes.RESOURCE_FISH) {
                createEntityResourceFish({
                    entityName: mapEntity.type,
                    positionX: mapEntity.x,
                    positionY: mapEntity.y,
                    resourceItems: mapEntity.items,
                });
            }
        }
        else {
            throw error({ message: 'Invalid entity data', where: generateTileMapEntities.name });
        }
    }
};

//TODO: rework
export const generateTileMapPlaceEntities = ({ managerEntityId, tileMapEntityId }: {
    managerEntityId?: string | null,
    tileMapEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: generateTileMapPlaceEntities.name });

    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: generateTileMapPlaceEntities.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapState = getTileMapState({ managerEntityId, tileMapName: tileMap._name })
        ?? error({ message: `TileMapState for ${tileMap._name} not found`, where: generateTileMapPlaceEntities.name });

    tileMapState.tiles.forEach(tile => {
        tile._entityIds
            .filter(entityId => entityId.includes('Place'))
            .forEach(entityId => {
                const resourceName = entityId.split('-')[0].split('Place')[1];
                const itemRule = findItemRule({ itemName: resourceName });

                placeResource({
                    position: { x: tile.position._x, y: tile.position._y },
                    resourceActive: itemRule.active,
                    resourceName,
                    resourceType: itemRule.resource,
                });
            });
    });
};

export const loadTileMapEntities = ({ tileMapEntityId }: { tileMapEntityId?: string | null }) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: loadTileMapEntities.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const { entities, entityIds } = findEntitiesByMap({ tileMapName: tileMap._name });
    for (const entity of entities) {
        const entityId = entityIds[entities.indexOf(entity)];

        if (checkComponent({ componentId: 'State', entityId })) {
            const state = getComponent({ componentId: 'State', entityId });

            if (!(state._load)) {
                setEntityLoad({ entityId, value: true });
                setTile({ entityId, tileMapEntityId });
                continue;
            }
        }
    }
};

export const loadDataTileMapEntities = ({ tileMapEntityId }: { tileMapEntityId?: string | null }) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: loadDataTileMapEntities.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapData = loadTileMapData({ tileMapName: tileMap._name })
        ?? error({ message: `TileMapData for ${tileMap._name} not found`, where: loadDataTileMapEntities.name });

    for (const mapEntity of tileMapData.entities) {
        const { entity, entityId } = (mapEntity.name)
            ? findEntityByName({ entityName: mapEntity.name })
            : findEntityByMapPosition({ tileMapName: tileMapData.name, x: mapEntity.x, y: mapEntity.y });

        if (entity && entityId && checkComponent({ componentId: 'State', entityId })) {
            setEntityLoad({ entityId, value: true });
            setTile({ entityId, tileMapEntityId });
            continue;
        }
    }
};

export const exitTile = ({ tileMapEntityId, entityId, targetX, targetY }: {
    entityId: string,
    targetX: number,
    targetY: number,
    tileMapEntityId?: string | null
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: exitTile.name });

    const entityTile = findTileByEntityId({ entityId })
        ?? error({ message: `Tile for entity ${entityId} not found`, where: exitTile.name });

    if (!(entityTile.exits)) throw error({ message: `Tile for entity ${entityId} has no exits`, where: exitTile.name });

    for (const exit of entityTile.exits) {
        if (targetExit({ exit, targetX, targetY, tile: entityTile })) {
            setEntityLoad({ entityId, value: false });

            destroyTileMap({ tileMapEntityId });
            generateTileMap({ tileMapName: exit._targetMap });
            updatePosition({ entityId, target: exit._direction, x: exit.targetPosition._x, y: exit.targetPosition._y });
            setTile({ entityId, tileMapEntityId });

            setEntityLoad({ entityId, value: true });

            return true;
        }
    }

    return false;
};

export const destroyTileMap = ({ tileMapEntityId }: { tileMapEntityId?: string | null }) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: exitTile.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });
    createTileMapState({ tileMapEntityId });

    tileMap.tiles = [];

    destroyAllEntities({});
};

export const soundTile = ({ tileMapEntityId, entityId }: {
    entityId: string,
    tileMapEntityId?: string | null,
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: soundTile.name });

    const entityTile = findTileByEntityId({ entityId })
        ?? error({ message: `Tile for entity ${entityId} not found`, where: soundTile.name });

    if (tileIsGrass({ tile: entityTile })) {
        event({ data: { audioName: `step_grass${randAudio({ nb: 4 })}` }, type: EventTypes.AUDIO_PLAY });
    }
    else if (tileIsSand({ tile: entityTile })) {
        event({ data: { audioName: `step_sand${randAudio({ nb: 4 })}` }, type: EventTypes.AUDIO_PLAY });
    }
};
//#endregion
