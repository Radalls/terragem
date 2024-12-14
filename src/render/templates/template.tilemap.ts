import { createElement, TILE_PIXEL_SIZE } from './template';
import { getElement, getSpritePath } from './template.utils';

import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region TEMPLATES
export const getTileMap = () => {
    const tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: createTileMap.name });

    return getElement({ elementId: tileMapEntityId });
};

export const createTileMap = () => {
    const tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: createTileMap.name });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId });

    const tileMapElement = getElement({ elementId: tileMapEntityId });

    tileMapElement.style.width = `${tileMap._width * TILE_PIXEL_SIZE}px`;
    tileMapElement.style.height = `${tileMap._height * TILE_PIXEL_SIZE}px`;

    for (let y = 0; y < tileMap._height; y += 10) {
        for (let x = 0; x < tileMap._width; x += 10) {
            const tileMapChunkElement = createElement({
                elementAbsolute: false,
                elementClass: 'tilemap-chunk',
                elementId: `${tileMapEntityId}-${x}-${y}`,
                elementParent: tileMapElement,
                entityId: tileMapEntityId,
            });

            tileMapChunkElement.style.backgroundImage = `url(${getSpritePath({
                spriteName: `${tileMap._name}_${y / 10}-${x / 10}`,
            })})`;
        }
    }
};
//#endregion
