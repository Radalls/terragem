import { loadTileMapData } from './tilemap.data';
import {
    generateTileMapTiles,
    generateTileMapEntities,
    findTileByPosition,
    findTileByEntityId,
    exitTile,
    soundTile,
    loadTileMapEntities,
    generateTileMapPlaceEntities,
} from './tilemap.utils';

import { getComponent, checkComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { setCollider, checkCollider } from '@/engine/systems/collider';
import { getTileMapState } from '@/engine/systems/manager';
import { getTargetPosition, updatePosition } from '@/engine/systems/position';
import { updateSpriteDirection } from '@/engine/systems/sprite';
import { setTrigger } from '@/engine/systems/trigger';
import { event } from '@/render/events';

//#region SYSTEMS
export const generateTileMap = ({ tileMapEntityId, managerEntityId, tileMapName }: {
    managerEntityId?: string | null
    tileMapEntityId?: string | null
    tileMapName: string,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: generateTileMap.name });

    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: generateTileMap.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapData = loadTileMapData({ tileMapName })
        ?? error({ message: `TileMapData for ${tileMapName} not found`, where: generateTileMap.name });

    tileMap._name = tileMapData.name;
    tileMap._height = tileMapData.height;
    tileMap._width = tileMapData.width;

    event({ type: EventTypes.TILEMAP_CREATE });

    const tileMapState = getTileMapState({ managerEntityId, tileMapName });
    if (tileMapState) {
        if (tileMapState.source === 'game') {
            tileMap.tiles = tileMapState.tiles;

            loadTileMapEntities({ tileMapEntityId });
        }
        else if (tileMapState.source === 'save') {
            generateTileMapTiles({ tileMapEntityId });
            generateTileMapEntities({ tileMapEntityId });
            generateTileMapPlaceEntities({ managerEntityId, tileMapEntityId });
        }
    }
    else {
        generateTileMapTiles({ tileMapEntityId });
        generateTileMapEntities({ tileMapEntityId });
    }
};

export const setTile = ({ tileMapEntityId, entityId }: {
    entityId: string,
    tileMapEntityId?: string | null
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: setTile.name });

    const entityPosition = getComponent({ componentId: 'Position', entityId });

    const targetTile = findTileByPosition({
        x: entityPosition._x,
        y: entityPosition._y,
    }) ?? error({ message: `Tile (${entityPosition._x}-${entityPosition._y}) does not exist`, where: setTile.name });

    if (targetTile._entityIds.includes(entityId)) return;

    targetTile._entityIds.push(entityId);

    const entityTrigger = checkComponent({ componentId: 'Trigger', entityId });
    if (entityTrigger) {
        setTrigger({ entityId });
    }

    const entityCollider = checkComponent({ componentId: 'Collider', entityId });
    if (entityCollider) {
        setCollider({ entityId });
    }
};

export const updateTile = ({ tileMapEntityId, entityId, target, step = 0.2 }: {
    entityId?: string | null,
    step?: number,
    target: 'up' | 'down' | 'left' | 'right',
    tileMapEntityId?: string | null
}) => {
    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: updateTile.name });

    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateTile.name });

    const entityPosition = getComponent({ componentId: 'Position', entityId });

    const entityTile = findTileByEntityId({ entityId })
        ?? error({ message: `Tile for entity ${entityId} not found`, where: updateTile.name });

    const { targetX, targetY, targetSubX, targetSubY } = getTargetPosition({
        step,
        subX: entityPosition._subX,
        subY: entityPosition._subY,
        target,
        x: entityPosition._x,
        y: entityPosition._y,
    });

    if (entityTile.exits) {
        const isExit = exitTile({ entityId, targetX, targetY, tileMapEntityId });

        if (isExit) return;
    }

    updateSpriteDirection({ entityId, target });

    if (targetX !== entityTile.position._x || targetY !== entityTile.position._y) {
        const targetTile = findTileByPosition({
            x: targetX,
            y: targetY,
        }) ?? error({ message: `Tile (${targetX}-${targetY}) does not exist`, where: updateTile.name });
        if (targetTile._solid) return;

        const isTargetCollider = checkCollider({ x: targetX, y: targetY });
        if (isTargetCollider) return;

        targetTile._entityIds.push(entityId);
        entityTile._entityIds = entityTile._entityIds.filter(id => id !== entityId);
    }

    updatePosition({
        entityId,
        subX: targetSubX,
        subY: targetSubY,
        x: targetX,
        y: targetY,
    });
    soundTile({ entityId });
};
//#endregion
