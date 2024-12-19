import { Component } from '@/engine/components';
import { error } from '@/engine/services/error';
import { setStore } from '@/engine/services/store';
import { generateEntityId, getEntity } from '@/engine/systems/entity';

//#region TYPES
export type Entity = {
    [K in keyof Component]: Component[K] | undefined;
};
//#endregion

//#region CONSTANTS
export const entities: Record<string, Entity> = {};

export const ADMIN_ENTITY_NAME = 'Admin';
export const GEM_ENTITY_NAME = 'Gem';
export const TILEMAP_ENTITY_NAME = 'TileMap';
export const TILE_ENTITY_NAME = 'Tile';
//#endregion

//#region SERVICES
export const createEntity = ({ entityName }: { entityName: string }) => {
    const entityId = generateEntityId({ entityName });

    const existingEntity = getEntity({ entityId });
    if (existingEntity) error({
        message: `Entity ${entityId} already exists`,
        where: createEntity.name,
    });

    entities[entityId] = {} as Entity;

    if (entityName === ADMIN_ENTITY_NAME) {
        setStore({ key: 'adminId', value: entityId });
    }
    else if (entityName === TILEMAP_ENTITY_NAME) {
        setStore({ key: 'tileMapId', value: entityId });
    }

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
};
//#endregion
