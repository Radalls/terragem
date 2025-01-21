import { asset } from '@/engine/main';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getComponent, isGem } from '@/engine/systems/entity';
import { RenderEvents } from '@/render/events';

//#region SYSTEMS
export const getSpritePath = ({ spriteName }: { spriteName: string }) => {
    return asset.getSpriteUrl(spriteName)
        ?? error({ message: `Sprite ${spriteName} not found`, where: getSpritePath.name });
};

export const updateSprite = ({ entityId, image }: {
    entityId: string,
    image: string,
}) => {
    const entitySprite = getComponent({ componentId: 'Sprite', entityId });

    const newImage = getSpritePath({ spriteName: image });
    if (entitySprite._image === newImage) {
        return;
    }

    entitySprite._image = newImage;

    emit({ entityId, target: 'render', type: RenderEvents.SPRITE_UPDATE });

    if (isGem({ gemId: entityId })) {
        emit({ entityId, target: 'render', type: RenderEvents.GEM_UPDATE });
    }
};
//#endregion
