import { v4 as uuidv4 } from 'uuid';

import { Component } from '@/engine/components';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { entities, GEM_ENTITY_NAME, getComponent } from '@/engine/systems/entity';

//#region UTILS
export const getEntity = ({ entityId }: { entityId: string }) => entities[entityId] ? entities[entityId] : null;

export const checkEntityId = ({ entityId }: { entityId: string }) => entities[entityId] ? entityId : null;

export const generateEntityId = ({ entityName }: { entityName: string }) => `${entityName}-${uuidv4().split('-')[0]}`;

export const getRawEntityId = ({ entityId }: { entityId: string }) => entityId.split('-')[0];

export const checkComponent = <T extends keyof Component>({ entityId, componentId }: {
    componentId: T,
    entityId: string
}) => {
    const entity = getEntity({ entityId })
        ?? error({ message: `Entity ${entityId} does not exist`, where: checkComponent.name });

    return !!(entity[componentId]);
};

export const getAdmin = () => {
    const adminId = getStore({ key: 'adminId' });
    const admin = getComponent({ componentId: 'Admin', entityId: adminId });

    return admin;
};

export const getTileMap = () => {
    const tileMapId = getStore({ key: 'tileMapId' });
    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapId });

    return tileMap;
};

export const isGem = ({ gemId }: { gemId: string }) => gemId.includes(GEM_ENTITY_NAME);
//#endregion
