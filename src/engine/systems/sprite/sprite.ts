import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getComponent } from '@/engine/systems/entity';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
const spriteFiles: Record<string, { default: string }>
    = import.meta.glob('/src/assets/sprites/**/*.{png,gif}', { eager: true });
//#endregion

//#region SYSTEMS
export const getSpritePath = ({ spriteName }: { spriteName: string }) => {
    const spriteKey = spriteName.replace(/^(.*?)(\/[^/]+)?(\.[^./]+)?$/, '$1').split('_')[0];
    const spritePath = `/src/assets/sprites/${spriteKey}/${spriteName}.png`;

    return spriteFiles[spritePath].default
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
};
//#endregion
