import { Entity } from './entity';
import { checkComponent, generateEntityId, getEntity, isManager, isTileMap } from './entity.utils';

import { Component } from '@/engine/components/@component';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore, setStore } from '@/engine/services/store';
import { setEntityLoad } from '@/engine/systems/state';
import { event } from '@/render/events';

export const entities: Record<string, Entity> = {};

//#region CONSTANTS
export const TILEMAP_ENTITY_NAME = 'TileMap';
export const PLAYER_ENTITY_NAME = 'Player';
export const MANAGER_ENTITY_NAME = 'Manager';
//#endregion

//#region SERVICES
export const createEntity = ({ entityName }: { entityName: string }) => {
    const entityId = generateEntityId({ entityName });

    const existingEntity = getEntity({ entityId });
    if (existingEntity) error({ message: `Entity ${entityId} already exists`, where: createEntity.name });

    entities[entityId] = {} as Entity;

    if (entityName === PLAYER_ENTITY_NAME) {
        setStore('playerId', entityId);
    }
    else if (entityName === TILEMAP_ENTITY_NAME) {
        setStore('tileMapId', entityId);
    }
    else if (entityName === MANAGER_ENTITY_NAME) {
        setStore('managerId', entityId);
    }

    event({ entityId, type: EventTypes.ENTITY_CREATE });

    return entityId;
};

export const addComponent = <T extends keyof Component>({ entityId, component }: {
    component: Component[T],
    entityId: string
}) => {
    const entity = getEntity({ entityId })
        ?? error({ message: `Entity ${entityId} does not exist`, where: addComponent.name });

    // @ts-expect-error - Component[T] is not assignable to type 'undefined'
    entity[component._] = component;
};

export const getComponent = <T extends keyof Component>({ entityId, componentId }: {
    componentId: T,
    entityId: string
}): Component[T] => {
    const entity = getEntity({ entityId })
        ?? error({ message: `Entity ${entityId} does not exist`, where: getComponent.name });

    const component = entity[componentId]
        ?? error({
            message: `Component ${componentId} does not exist on entity ${entityId}`,
            where: getComponent.name,
        });

    return component;
};

export const destroyEntity = ({ entityId }: { entityId: string }) => {
    delete entities[entityId];

    event({ entityId, type: EventTypes.ENTITY_DESTROY });
};

export const destroyAllEntities = ({ force }: { force?: boolean }) => {
    Object.keys(entities).forEach((entityId) => {
        if (!(entities[entityId])) return;

        if (isManager({ entityId })) return;
        if (isTileMap({ entityId })) return;

        if (force) {
            destroyEntity({ entityId });
            return;
        }

        if (
            entityId.includes(PLAYER_ENTITY_NAME)
            || entityId.includes(TILEMAP_ENTITY_NAME)
        ) return;

        if (checkComponent({ componentId: 'State', entityId })) {
            const state = getComponent({ componentId: 'State', entityId });

            if (state._load) {
                setEntityLoad({ entityId, value: false });
            }

            return;
        }

        destroyEntity({ entityId });
    });

    if (force) {
        const tileMapEntityId = getStore('tileMapId')
            ?? error({ message: 'Store tileMapId is undefined', where: destroyAllEntities.name });

        destroyEntity({ entityId: tileMapEntityId });
    }
};
//#endregion
