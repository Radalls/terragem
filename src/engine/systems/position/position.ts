import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin, getComponent, getTileMap } from '@/engine/systems/entities';
import { RenderEventTypes } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const moveToTarget = ({ entityId, targetX, targetY }: {
    entityId: string,
    targetX: number,
    targetY: number
}) => {
    const entityPosition = getComponent({ componentId: 'Position', entityId });
    if ((entityPosition._x === targetX && entityPosition._y === targetY)) {
        return true;
    }

    const xDiff = targetX - entityPosition._x;
    const yDiff = targetY - entityPosition._y;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) entityPosition._x += 1;
        else entityPosition._x -= 1;
    } else {
        if (yDiff > 0) entityPosition._y += 1;
        else entityPosition._y -= 1;
    }

    emit({ entityId, target: 'render', type: RenderEventTypes.POSITION_UPDATE });

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

export const getGemAtPosition = ({ gemId, x, y }: {
    gemId: string,
    x: number,
    y: number,
}) => {
    const admin = getAdmin();

    for (const gem of admin.gems) {
        const gemPosition = getComponent({ componentId: 'Position', entityId: gem });

        if (gemId !== gem && gemPosition._x === x && gemPosition._y === y) {
            return gem;
        }
    }
};
//#endregion
