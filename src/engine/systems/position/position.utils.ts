import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { findTileByPosition } from '@/engine/systems/tilemap';

//#region CHECKS
export const invalidPosition = ({ x, y }: {
    x: number,
    y: number,
}) => x < 0 || y < 0;

export const samePosition = ({ entityPosition, targetPosition }: {
    entityPosition: { x: number, y: number },
    targetPosition: { x: number, y: number },
}) => entityPosition.x === targetPosition.x && entityPosition.y === targetPosition.y;

export const isFacingPosition = ({ entityId, targetPosition }: {
    entityId?: string | null,
    targetPosition?: { x: number, y: number }
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: isFacingPosition.name });

    const position = getComponent({ componentId: 'Position', entityId });
    const sprite = getComponent({ componentId: 'Sprite', entityId });

    if (!(targetPosition)) targetPosition = getFacingPosition({ entityId })
        ?? error({ message: 'Target position is undefined', where: isFacingPosition.name });

    if (position._x < targetPosition.x) {
        return sprite._direction === 'right';
    } else if (position._x > targetPosition.x) {
        return sprite._direction === 'left';
    } else if (position._y < targetPosition.y) {
        return sprite._direction === 'down';
    } else if (position._y > targetPosition.y) {
        return sprite._direction === 'up';
    }
};

export const validItemPosition = ({ entityId }: { entityId?: string | null }) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: validItemPosition.name });

    const position = getComponent({ componentId: 'Position', entityId });
    const tile = findTileByPosition({ x: position._x, y: position._y })
        ?? error({ message: 'Player tile is undefined', where: validItemPosition.name });

    return tile._entityIds.length === 1 && tile._entityIds[0] === entityId;
};

export const validPlacePosition = ({
    entityId,
    placeWidth = 1,
    placeHeight = 1,
}: {
    entityId?: string | null,
    placeHeight?: number,
    placeWidth?: number,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: validPlacePosition.name });

    const originPlacePosition = getOriginPlacePosition({ entityId, placeHeight, placeWidth });

    for (let dx = 0; dx < placeWidth; dx++) {
        for (let dy = 0; dy < placeHeight; dy++) {
            const checkTile = findTileByPosition({
                x: originPlacePosition.x + dx,
                y: originPlacePosition.y - dy,
            });

            if (
                !(checkTile)
                || checkTile._solid
                || checkTile._entityIds.length > 0
                || checkTile._entityColliderIds.length > 0
            ) {
                return false;
            }
        }
    }

    return true;
};
//#endregion

//#region UTILS
export const updatePositionXY = ({ entityId, x, y, subX = 0, subY = 0 }: {
    entityId?: string | null,
    subX?: number,
    subY?: number,
    x: number,
    y: number,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updatePositionXY.name });

    const position = getComponent({ componentId: 'Position', entityId });

    position._x = x;
    position._y = y;
    position._subX = subX;
    position._subY = subY;

    if (subX >= 1) {
        position._x += 1;
        position._subX = 0;
    }
    else if (subX < 0) {
        position._x -= 1;
        position._subX = 1;
    }

    if (subY >= 1) {
        position._y += 1;
        position._subY = 0;
    }
    else if (subY < 0) {
        position._y -= 1;
        position._subY = 1;
    }
};

export const getFacingPosition = ({ entityId }: { entityId?: string | null }) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: getFacingPosition.name });

    const position = getComponent({ componentId: 'Position', entityId });
    const sprite = getComponent({ componentId: 'Sprite', entityId });

    if (!(sprite._direction)) error({
        message: 'Sprite direction is undefined',
        where: getFacingPosition.name,
    });

    if (sprite._direction === 'up') return { x: position._x, y: position._y - 1 };
    else if (sprite._direction === 'down') return { x: position._x, y: position._y + 1 };
    else if (sprite._direction === 'left') return { x: position._x - 1, y: position._y };
    else if (sprite._direction === 'right') return { x: position._x + 1, y: position._y };
};

export const getOriginPlacePosition = ({
    entityId,
    placeWidth = 1,
    placeHeight = 1,
}: {
    entityId?: string | null,
    placeHeight?: number,
    placeWidth?: number,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: getOriginPlacePosition.name });

    const playerPosition = getComponent({ componentId: 'Position', entityId });

    const playerSprite = getComponent({ componentId: 'Sprite', entityId });

    const originPlacePosition = {
        x: playerPosition._x,
        y: playerPosition._y,
    };
    switch (playerSprite._direction) {
        case 'up':
            originPlacePosition.y -= 1;
            break;
        case 'down':
            originPlacePosition.y += placeHeight;
            break;
        case 'left':
            originPlacePosition.x -= placeWidth;
            break;
        case 'right':
            originPlacePosition.x += 1;
            break;
        default:
            error({ message: 'Invalid player orientation', where: getOriginPlacePosition.name });
    }

    return originPlacePosition;
};
//#endregion
