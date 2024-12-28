import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin, getComponent, getTileMap } from '@/engine/systems/entity';
import { activePathRequests, calculatePath } from '@/engine/systems/position';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const moveToTarget = ({ entityId, targetX, targetY }: {
    entityId: string,
    targetX: number,
    targetY: number
}): boolean => {
    const entityPosition = getComponent({ componentId: 'Position', entityId });

    if (entityPosition._x === targetX && entityPosition._y === targetY) {
        activePathRequests.delete(entityId);

        return true;
    }

    let pathRequest = activePathRequests.get(entityId);

    if (
        !(pathRequest)
        || pathRequest.targetX !== targetX
        || pathRequest.targetY !== targetY
    ) {
        const path = calculatePath({
            startX: entityPosition._x,
            startY: entityPosition._y,
            targetX,
            targetY,
        });

        if (path.length === 0) {
            throw error({
                message: `No valid path found for entity ${entityId} to (${targetX},${targetY})`,
                where: moveToTarget.name,
            });
        }

        pathRequest = {
            entityId,
            path: path.slice(1),
            targetX,
            targetY,
        };

        activePathRequests.set(entityId, pathRequest);
    }

    const nextPosition = pathRequest.path[0];

    const tileId = getTileAtPosition({ x: nextPosition.x, y: nextPosition.y });
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    if (!(tile._destroy)) {
        activePathRequests.delete(entityId);

        return moveToTarget({ entityId, targetX, targetY });
    }

    entityPosition._x = nextPosition.x;
    entityPosition._y = nextPosition.y;

    pathRequest.path.shift();

    emit({ entityId, target: 'render', type: RenderEvents.POSITION_UPDATE });

    return (entityPosition._x === targetX && entityPosition._y === targetY);
};

export const getTileAtPosition = ({ x, y }: { x: number; y: number }) => {
    const tileMap = getTileMap();

    for (const tileId of tileMap.tiles) {
        const tilePosition = getComponent({ componentId: 'Position', entityId: tileId });

        if (tilePosition._x === x && tilePosition._y === y) {
            return tileId;
        }
    }

    throw error({
        message: `Tile at position (${x},${y}) not found`,
        where: getTileAtPosition.name,
    });
};

export const getGemsAtPosition = ({ gemId, x, y }: {
    gemId: string,
    x: number,
    y: number,
}) => {
    const admin = getAdmin();

    const gemsAtPosition = [];
    for (const gem of admin.gems) {
        const gemPosition = getComponent({ componentId: 'Position', entityId: gem });

        if (gemId !== gem && gemPosition._x === x && gemPosition._y === y) {
            gemsAtPosition.push(gem);
        }
    }

    return gemsAtPosition;
};
//#endregion
