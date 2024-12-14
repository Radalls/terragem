import { destroyEnergy } from './template.energy';
import { destroyInventory } from './template.inventory';
import { destroyQuestMenu } from './template.quest';
import { getElement, getSpritePath } from './template.utils';

import { getComponent, getRawEntityId, isPlace, isPlayer } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region CONSTANTS
export const TILE_PIXEL_SIZE = 72;

type ElementData =
    | {
        elementAbsolute?: boolean;
        elementClass?: string;
        elementId?: string;
        elementParent?: HTMLElement;
        entityId: string;
    }
    | {
        elementAbsolute?: boolean;
        elementClass?: string;
        elementId: string;
        elementParent?: HTMLElement;
        entityId?: string;
    };
//#endregion

//#region TEMPLATES
export const createElement = ({
    entityId,
    elementId,
    elementClass,
    elementParent,
    elementAbsolute = true,
}: ElementData) => {
    if (!(entityId) && !(elementId)) {
        throw error({
            message: 'Either entityId or elementId must be provided',
            where: createElement.name,
        });
    }

    const element = document.createElement('div');

    const id = elementId ?? entityId!;
    element.setAttribute('id', id);
    element.setAttribute('class', elementClass ?? getRawEntityId({ entityId: id }).toLowerCase());

    element.style.position = elementAbsolute ? 'absolute' : 'relative';

    const parent = elementParent ?? getElement({ elementId: 'Frame' });
    parent.appendChild(element);

    return element;
};

export const destroyElement = ({ elementId }: { elementId: string }) => {
    const element = getElement({ elementId });

    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    if (isPlayer({ entityId: elementId })) {
        destroyInventory();
        destroyQuestMenu();
        destroyEnergy();
    }

    element.remove();
};

export const updateCamera = () => {
    const playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateCamera.name });

    const playerPosition = getComponent({ componentId: 'Position', entityId: playerEntityId });

    const tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: updateCamera.name });

    const tilemapElement = getElement({ elementId: tileMapEntityId });

    const offsetX = -((playerPosition._x + playerPosition._subX) * TILE_PIXEL_SIZE + TILE_PIXEL_SIZE / 2);
    const offsetY = -((playerPosition._y + playerPosition._subY) * TILE_PIXEL_SIZE);

    updatePosition({ elementId: playerEntityId });

    setTimeout(() => {
        tilemapElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }, 1);
};

export const updatePosition = ({ elementId }: { elementId: string }) => {
    const position = getComponent({ componentId: 'Position', entityId: elementId });

    const element = getElement({ elementId });

    const pixelOffsetX = position._subX * TILE_PIXEL_SIZE;
    const pixelOffsetY = position._subY * TILE_PIXEL_SIZE;

    const basePosX = position._x * TILE_PIXEL_SIZE;
    const basePosY = position._y * TILE_PIXEL_SIZE;

    const elementHeight = parseInt(element.style.height);
    const verticalAdjustment = elementHeight > TILE_PIXEL_SIZE
        ? ((elementHeight / TILE_PIXEL_SIZE) - 1) * TILE_PIXEL_SIZE
        : 0;

    element.style.left = `${basePosX + pixelOffsetX}px`;
    element.style.top = `${basePosY - verticalAdjustment + pixelOffsetY}px`;

    element.style.zIndex = (isPlayer({ entityId: elementId }) || isPlace({ entityId: elementId }))
        ? `${(position._y * 10 + (position._subY * 10)) - 1}`
        : `${(position._y * 10 + (position._subY * 10))}`;
};

export const createSprite = ({ elementId }: { elementId: string }) => {
    const sprite = getComponent({ componentId: 'Sprite', entityId: elementId });

    const element = getElement({ elementId });

    element.style.backgroundImage = (!(sprite._gif))
        ? `url(${getSpritePath({ spriteName: sprite._image })})`
        : `url(${getSpritePath({ gif: true, spriteName: sprite._image })})`;
    element.style.width = `${sprite._width * TILE_PIXEL_SIZE}px`;
    element.style.height = `${sprite._height * TILE_PIXEL_SIZE}px`;
};
//#endregion
