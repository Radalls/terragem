import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin, getComponent, getTileMap } from '@/engine/systems/entity';
import { RenderEvents } from '@/render/events';

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

    const moveAxis = (Math.abs(yDiff) > Math.abs(xDiff))
        ? 'vertical'
        : 'horizontal';

    const getMoveDirection = ({ moveAxis, xDiff, yDiff }: {
        moveAxis: 'vertical' | 'horizontal',
        xDiff: number,
        yDiff: number
    }) => {
        const moveDirection = (moveAxis === 'vertical')
            ? (yDiff > 0)
                ? 'down'
                : 'up'
            : (xDiff > 0)
                ? 'right'
                : 'left';

        return moveDirection;
    };

    const getMoveTarget = ({ moveAxis, moveDirection }: {
        moveAxis: 'vertical' | 'horizontal',
        moveDirection: 'down' | 'up' | 'right' | 'left'
    }) => {
        const moveTargetX = (moveAxis === 'vertical')
            ? entityPosition._x
            : (moveDirection === 'right')
                ? entityPosition._x + 1
                : entityPosition._x - 1;

        const moveTargetY = (moveAxis === 'horizontal')
            ? entityPosition._y
            : (moveDirection === 'down')
                ? entityPosition._y + 1
                : entityPosition._y - 1;

        return { moveTargetX, moveTargetY };
    };

    const isMoveTargetValid = ({ moveTargetX, moveTargetY }: { moveTargetX: number; moveTargetY: number }) => {
        const moveTargetTileId = getTileAtPosition({ x: moveTargetX, y: moveTargetY });
        const moveTargetTile = getComponent({ componentId: 'Tile', entityId: moveTargetTileId });

        return moveTargetTile._destroy;
    };

    const moveDirection = getMoveDirection({ moveAxis, xDiff, yDiff });
    const { moveTargetX, moveTargetY } = getMoveTarget({ moveAxis, moveDirection });
    const canMove = isMoveTargetValid({ moveTargetX, moveTargetY });

    let hasMoved = false;
    if (canMove) {
        entityPosition._x = moveTargetX;
        entityPosition._y = moveTargetY;
        hasMoved = true;
    }

    if (!(hasMoved)) {
        const moveDirection = getMoveDirection({
            moveAxis: (moveAxis === 'vertical')
                ? 'horizontal'
                : 'vertical',
            xDiff,
            yDiff,
        });

        const { moveTargetX, moveTargetY } = getMoveTarget({
            moveAxis: (moveAxis === 'vertical')
                ? 'horizontal'
                : 'vertical',
            moveDirection,
        });
        const canMove = isMoveTargetValid({ moveTargetX, moveTargetY });

        if (canMove) {
            entityPosition._x = moveTargetX;
            entityPosition._y = moveTargetY;
            hasMoved = true;
        }
    }

    if (!(hasMoved)) throw error({
        message: `Unable to move entity ${entityId}
            to (${targetX},${targetY})
            through (${entityPosition._x},${entityPosition._y})`,
        where: moveToTarget.name,
    });

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
