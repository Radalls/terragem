import { Tile } from '@/engine/components/tilemap';
import { getComponent, isManager, isTileMap } from '@/engine/entities';
import { AudioData } from '@/engine/services/audio';
import { ErrorData } from '@/engine/services/error';
import {
    createElement,
    destroyElement,
    updatePosition,
    createSprite,
    getElement,
    getTileMap,
} from '@/render/templates';

//#region UTILS
export const onEntityCreate = ({ entityId }: { entityId: string }) => {
    createElement({
        elementParent: (isManager({ entityId }) || isTileMap({ entityId }))
            ? undefined
            : getTileMap(),
        entityId,
    });
};

export const onEntityDestroy = ({ entityId }: { entityId: string }) => destroyElement({ elementId: entityId });

export const onEntityDisplay = ({ entityId }: { entityId: string }) => {
    const state = getComponent({ componentId: 'State', entityId });

    const element = getElement({ elementId: entityId });

    element.style.display = 'block';
    if (!(state._load)) element.style.display = 'none';
    if (state._cooldown) element.style.display = 'none';
};

export const onEntityPositionUpdate = ({ entityId }: { entityId: string }) => updatePosition({ elementId: entityId });

export const onEntitySpriteCreate = ({ entityId }: { entityId: string }) => createSprite({ elementId: entityId });

export const onEntitySpriteUpdate = ({ entityId }: { entityId: string }) => createSprite({ elementId: entityId });

export const checkAudioData = (data: any): data is AudioData => data;

export const checkTileData = (data: any): data is Tile => data;

export const checkErrorData = (data: any): data is ErrorData => data;
//#endregion
