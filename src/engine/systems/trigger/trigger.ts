import { checkComponent, getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { startDialog } from '@/engine/systems/dialog';
import { isFacingPosition, samePosition } from '@/engine/systems/position';
import { useResource } from '@/engine/systems/resource';
import { findTileByPosition } from '@/engine/systems/tilemap/tilemap.utils';

//#region HELPERS
const sortTriggersByPriority = ({ triggerEntityIds }: { triggerEntityIds: string[] }) =>
    triggerEntityIds.sort((a, b) => {
        const aTrigger = getComponent({ componentId: 'Trigger', entityId: a });
        const bTrigger = getComponent({ componentId: 'Trigger', entityId: b });
        return bTrigger._priority - aTrigger._priority;
    });

const findPriorityTriggerEntityId = ({ triggerEntityIds }: { triggerEntityIds: string[] }): string | null => {
    if (triggerEntityIds.length === 0) return null;

    const triggerEntityId = triggerEntityIds[0];

    if (checkComponent({ componentId: 'State', entityId: triggerEntityId })) {
        const state = getComponent({ componentId: 'State', entityId: triggerEntityId });
        if (!(state._load) || state._cooldown) {
            return findPriorityTriggerEntityId({ triggerEntityIds: triggerEntityIds.slice(1) });
        }

        return triggerEntityId;
    }
    else {
        return triggerEntityId;
    }
};
//#endregion

//#region SYSTEMS
export const setTrigger = ({ entityId }: { entityId: string }) => {
    const entityPosition = getComponent({ componentId: 'Position', entityId });
    const entityTrigger = getComponent({ componentId: 'Trigger', entityId });

    for (const point of entityTrigger.points) {
        const pointTile = findTileByPosition({
            x: entityPosition._x + point._offsetX,
            y: entityPosition._y + point._offsetY,
        });

        if (pointTile) {
            pointTile._entityTriggerIds.push(entityId);
            if (pointTile._entityTriggerIds.length > 1) {
                pointTile._entityTriggerIds = sortTriggersByPriority({ triggerEntityIds: pointTile._entityTriggerIds });
            }
        }
    }
};

export const checkTrigger = ({ entityId }: { entityId?: string | null }) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: checkTrigger.name });

    const entityPosition = getComponent({ componentId: 'Position', entityId });

    const entityTile = findTileByPosition({
        x: entityPosition._x,
        y: entityPosition._y,
    }) ?? error({
        message: `Tile (${entityPosition._x}-${entityPosition._y}) does not exist`,
        where: checkTrigger.name,
    });

    if (entityTile._entityTriggerIds.length === 0) {
        return null;
    }

    const triggerEntityId = findPriorityTriggerEntityId({ triggerEntityIds: entityTile._entityTriggerIds });
    if (triggerEntityId) {
        const triggerEntityPosition = getComponent({ componentId: 'Position', entityId: triggerEntityId });

        if (
            isFacingPosition({
                entityId,
                targetPosition: { x: triggerEntityPosition._x, y: triggerEntityPosition._y },
            })
            ||
            samePosition({
                entityPosition: { x: entityPosition._x, y: entityPosition._y },
                targetPosition: { x: triggerEntityPosition._x, y: triggerEntityPosition._y },
            })
        ) {
            onTrigger({ entityId, triggerEntityId: triggerEntityId });
        }
    }
};

export const onTrigger = ({ entityId, triggerEntityId }: {
    entityId?: string | null,
    triggerEntityId: string,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined ', where: onTrigger.name });

    const resource = checkComponent({ componentId: 'Resource', entityId: triggerEntityId });
    if (resource) {
        useResource({ resourceEntityId: triggerEntityId });
        return;
    }

    const dialog = checkComponent({ componentId: 'Dialog', entityId: triggerEntityId });
    if (dialog) {
        startDialog({ entityId: triggerEntityId });
        return;
    }
};

export const destroyTrigger = ({ entityId }: { entityId: string }) => {
    const entityPosition = getComponent({ componentId: 'Position', entityId });
    const entityTrigger = getComponent({ componentId: 'Trigger', entityId });

    for (const point of entityTrigger.points) {
        const pointTile = findTileByPosition({
            x: entityPosition._x + point._offsetX,
            y: entityPosition._y + point._offsetY,
        });

        if (pointTile) {
            pointTile._entityTriggerIds = pointTile._entityTriggerIds.filter((id) => id !== entityId);
        }
    }
};
//#endregion
