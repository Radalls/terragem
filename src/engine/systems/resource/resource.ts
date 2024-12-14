import { startActivityBug, startActivityCraft, startActivityFish } from './activity';
import { getResourceItem } from './resource.utils';

import { ResourceTypes } from '@/engine/components/resource';
import { getComponent, checkComponent, destroyEntity, loadEntityData } from '@/engine/entities';
import { setCooldown } from '@/engine/services/cycle';
import { createEntityResourceItem, createEntityResourcePlace } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { destroyCollider } from '@/engine/systems/collider';
import { getOriginPlacePosition, validItemPosition, validPlacePosition } from '@/engine/systems/position';
import { setEntityActive, setEntityCooldown } from '@/engine/systems/state';
import { findTileByEntityId } from '@/engine/systems/tilemap';
import { destroyTrigger } from '@/engine/systems/trigger';
import { event } from '@/render/events';

//#region SYSTEMS
export const useResource = ({ entityId, resourceEntityId }: {
    entityId?: string | null,
    resourceEntityId: string,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playedId is undefined', where: useResource.name });

    if (checkComponent({ componentId: 'State', entityId: resourceEntityId })) {
        const state = getComponent({ componentId: 'State', entityId: resourceEntityId });

        if (state._cooldown) throw error({
            message: 'Resource is on cooldown',
            where: useResource.name,
        });
    }

    const resource = getComponent({ componentId: 'Resource', entityId: resourceEntityId });

    if (resource._type === ResourceTypes.ITEM) {
        const gotItem = getResourceItem({ resourceEntityId });
        if (!(gotItem)) {
            event({ data: { message: 'Mon sac est plein' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({
                message: 'Player inventory is full',
                where: useResource.name,
            });
        }

        if (checkComponent({ componentId: 'State', entityId: resourceEntityId })) {
            const state = getComponent({ componentId: 'State', entityId: resourceEntityId });

            if (state._cooldown !== undefined) {
                setEntityCooldown({ entityId: resourceEntityId, value: true });
                setCooldown({ entityId: resourceEntityId });
            }
            else {
                destroyResource({ resourceEntityId });
            }
        }

        event({ data: { audioName: 'activity_pickup' }, type: EventTypes.AUDIO_PLAY });
    }
    else if (resource._type === ResourceTypes.PLACE) {
        const state = getComponent({ componentId: 'State', entityId: resourceEntityId });

        setEntityActive({ entityId: resourceEntityId, gif: !(state._active), value: !(state._active) });
    }
    else {
        if (resource._type === ResourceTypes.BUG && resource.activityData) {
            startActivityBug({ activityId: resourceEntityId });
        }
        else if (resource._type === ResourceTypes.FISH && resource.activityData) {
            startActivityFish({ activityId: resourceEntityId });
        }
        else if (resource._type === ResourceTypes.CRAFT && resource.activityData) {
            startActivityCraft({ activityId: resourceEntityId });
        }
    }
};

export const destroyResource = ({ resourceEntityId }: { resourceEntityId: string }) => {
    const resourceTrigger = checkComponent({ componentId: 'Trigger', entityId: resourceEntityId });
    if (resourceTrigger) {
        destroyTrigger({ entityId: resourceEntityId });
    }

    const resourceCollider = checkComponent({ componentId: 'Collider', entityId: resourceEntityId });
    if (resourceCollider) {
        destroyCollider({ entityId: resourceEntityId });
    }

    const resourceTile = findTileByEntityId({ entityId: resourceEntityId })
        ?? error({ message: 'Resource tile not found', where: destroyResource.name });

    resourceTile._entityIds = resourceTile._entityIds.filter(entityId => entityId !== resourceEntityId);

    destroyEntity({ entityId: resourceEntityId });
};

export const placeResource = ({ resourceType, resourceName, resourceActive, playerEntityId, position }: {
    playerEntityId?: string | null,
    position?: { x: number, y: number },
    resourceActive?: boolean,
    resourceName: string,
    resourceType: ResourceTypes,
}) => {
    if (!(playerEntityId) && !(position)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: placeResource.name });

    const playerPosition = (playerEntityId)
        ? getComponent({ componentId: 'Position', entityId: playerEntityId })
        : null;

    const resourceData = loadEntityData({ entityName: resourceName, entityType: resourceType })
        ?? error({
            message: `EntityData for ${resourceType} ${resourceName} not found`,
            where: placeResource.name,
        });

    if (resourceType === ResourceTypes.ITEM) {
        if (position) {
            createEntityResourceItem({
                entityName: `Place${resourceName}`,
                positionX: position.x,
                positionY: position.y,
                resourceItems: [{ name: resourceName, rate: 1 }],
                stateCooldown: false,
            });
        }
        else if (validItemPosition({ entityId: playerEntityId })) {
            if (!(playerPosition)) return;

            createEntityResourceItem({
                entityName: `Place${resourceName}`,
                positionX: playerPosition._x,
                positionY: playerPosition._y,
                resourceItems: [{ name: resourceName, rate: 1 }],
                stateCooldown: false,
            });
        }
        else {
            event({ data: { message: 'Je ne peux pas placer ça là' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({ message: 'Invalid item position', where: placeResource.name });
        }
    }
    else if (resourceType === ResourceTypes.PLACE) {
        if (position) {
            createEntityResourcePlace({
                collider: resourceData.collider,
                entityName: `Place${resourceName}`,
                itemName: resourceName,
                positionX: position.x,
                positionY: position.y,
                spriteHeight: resourceData.height,
                spritePath: `resource_${resourceName.toLowerCase()}`,
                spriteWidth: resourceData.width,
                stateActive: resourceActive,
                trigger: resourceData.trigger,
            });
        }
        else if (validPlacePosition({
            entityId: playerEntityId,
            placeHeight: resourceData.height,
            placeWidth: resourceData.width,
        })) {
            const placePosition = getOriginPlacePosition({
                entityId: playerEntityId,
                placeHeight: resourceData.height,
                placeWidth: resourceData.width,
            }) ?? error({ message: 'Place position is undefined', where: placeResource.name });

            createEntityResourcePlace({
                collider: resourceData.collider,
                entityName: `Place${resourceName}`,
                itemName: resourceName,
                positionX: placePosition.x,
                positionY: placePosition.y,
                spriteHeight: resourceData.height,
                spritePath: `resource_${resourceName.toLowerCase()}`,
                spriteWidth: resourceData.width,
                stateActive: resourceActive,
                trigger: resourceData.trigger,
            });
        }
        else {
            event({ data: { message: 'Je ne peux pas placer ça là' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({ message: 'Invalid place position', where: placeResource.name });
        }
    }
};
//#endregion
