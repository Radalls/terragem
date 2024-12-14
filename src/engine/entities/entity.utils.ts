import { v4 as uuidv4 } from 'uuid';

import { entities, getComponent, MANAGER_ENTITY_NAME, PLAYER_ENTITY_NAME, TILEMAP_ENTITY_NAME } from './entity.manager';

import { Component } from '@/engine/components/@component';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region UTILS
export const getEntity = ({ entityId }: { entityId: string }) => entities[entityId] ? entities[entityId] : null;

export const checkEntityId = ({ entityId }: { entityId: string }) => entities[entityId] ? entityId : null;

export const generateEntityId = ({ entityName }: { entityName: string }) => `${entityName}-${uuidv4()}`;

export const isPlayer = ({ entityId, strict }: { entityId: string, strict?: boolean }) => {
    return (strict)
        ? entityId === getStore('playerId')
        : entityId.includes(PLAYER_ENTITY_NAME);
};

export const isManager = ({ entityId, strict }: { entityId: string, strict?: boolean }) => {
    return (strict)
        ? entityId === getStore('managerId')
        : entityId.includes(MANAGER_ENTITY_NAME);
};

export const isTileMap = ({ entityId, strict }: { entityId: string, strict?: boolean }) => {
    return (strict)
        ? entityId === getStore('tileMapId')
        : entityId.includes(TILEMAP_ENTITY_NAME);
};

export const isPlace = ({ entityId }: { entityId: string }) => {
    return entityId.includes('Place');
};

export const getRawEntityId = ({ entityId }: { entityId: string }) => entityId.split('-')[0];

export const findEntityByName = ({ entityName }: { entityName: string }) => {
    const entityId = Object.keys(entities).find(entityId => entityId.includes(entityName));

    const entity = (entityId)
        ? getEntity({ entityId })
        : null;

    return { entity: entity, entityId };
};

export const findEntityByMapPosition = ({ tileMapName, x, y }: {
    tileMapName: string,
    x: number,
    y: number,
}) => {
    const entityId = Object.keys(entities).find(entityId => {
        const entity = getEntity({ entityId });

        if (checkComponent({ componentId: 'Position', entityId })) {
            const position = getComponent({ componentId: 'Position', entityId });
            return entity && position
                && position._x === x
                && position._y === y
                && position._tileMapName === tileMapName;
        }
    });

    const entity = (entityId)
        ? getEntity({ entityId })
        : null;

    return { entity: entity, entityId };
};

export const findEntitiesByMap = ({ tileMapName }: { tileMapName: string }) => {
    const mapEntityIds = Object.keys(entities).filter(entityId => {
        const entity = getEntity({ entityId });

        if (checkComponent({ componentId: 'Position', entityId })) {
            const position = getComponent({ componentId: 'Position', entityId });
            return entity && position && position._tileMapName === tileMapName;
        }
    });

    const mapEntities = mapEntityIds.map(entityId => getEntity({ entityId })).filter(entity => !!(entity));

    return { entities: mapEntities, entityIds: mapEntityIds };
};

export const checkComponent = <T extends keyof Component>({ entityId, componentId }: {
    componentId: T,
    entityId: string
}) => {
    const entity = getEntity({ entityId })
        ?? error({ message: `Entity ${entityId} does not exist`, where: checkComponent.name });

    return entity[componentId] ? componentId : null;
};
//#endregion
