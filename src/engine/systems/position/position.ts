import { invalidPosition, updatePositionXY } from './position.utils';

import { getComponent, isPlayer } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { updateSpriteDirection } from '@/engine/systems/sprite';
import { event } from '@/render/events';

//#region SYSTEMS
export const updatePosition = ({ entityId, tileMapEntityId, target, x, y, subX = 0, subY = 0 }: {
    entityId?: string | null,
    subX?: number,
    subY?: number,
    target?: 'up' | 'down' | 'left' | 'right',
    tileMapEntityId?: string | null,
    x: number,
    y: number,
}) => {
    if (invalidPosition({ x, y })) {
        throw error({ message: `Position (${x}-${y}) is invalid`, where: updatePosition.name });
    }

    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updatePosition.name });

    if (target) {
        updateSpriteDirection({ entityId, target });
    }

    const position = getComponent({ componentId: 'Position', entityId });

    updatePositionXY({ entityId, subX, subY, x, y });

    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: updatePosition.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });
    if (position._tileMapName !== tileMap._name) {
        position._tileMapName = tileMap._name;
    }

    if (isPlayer({ entityId })) {
        event({ entityId, type: EventTypes.MAIN_CAMERA_UPDATE });
    }
    else {
        event({ entityId, type: EventTypes.ENTITY_POSITION_UPDATE });
    }

    event({ entityId, type: EventTypes.ENTITY_SPRITE_UPDATE });
};

export const getTargetPosition = ({
    target,
    x,
    y,
    subX = 0,
    subY = 0,
    step = 0.1,
}: {
    step?: number,
    subX?: number,
    subY?: number,
    target: 'up' | 'down' | 'left' | 'right',
    x: number,
    y: number,
}) => {
    let targetX = x;
    let targetY = y;
    let targetSubX = subX;
    let targetSubY = subY;

    switch (target) {
        case 'up':
            targetSubY -= step;
            if (targetSubY < 0) {
                targetY -= 1;
                targetSubY = 1 + targetSubY;
            }
            break;
        case 'down':
            targetSubY += step;
            if (targetSubY >= 1) {
                targetY += 1;
                targetSubY -= 1;
            }
            break;
        case 'left':
            targetSubX -= step;
            if (targetSubX < 0) {
                targetX -= 1;
                targetSubX = 1 + targetSubX;
            }
            break;
        case 'right':
            targetSubX += step;
            if (targetSubX >= 1) {
                targetX += 1;
                targetSubX -= 1;
            }
            break;
        default:
            throw error({
                message: 'Invalid movement target',
                where: getTargetPosition.name,
            });
    }

    return {
        targetSubX,
        targetSubY,
        targetX,
        targetY,
    };
};
//#endregion
