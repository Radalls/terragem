import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { event } from '@/render/events';

//#region HELPERS
const getBaseSprite = ({ path }: { path: string }) => path.substring(0, path.lastIndexOf('_'));
//#endregion

//#region SYSTEMS
export const updateSprite = ({ entityId, path }: {
    entityId?: string | null,
    path: string
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateSpriteDirection.name });

    const sprite = getComponent({ componentId: 'Sprite', entityId });
    sprite._image = path;

    event({ entityId, type: EventTypes.ENTITY_SPRITE_UPDATE });
};

export const updateSpriteDirection = ({ entityId, target }: {
    entityId?: string | null,
    target: 'up' | 'down' | 'left' | 'right'
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateSpriteDirection.name });

    const sprite = getComponent({ componentId: 'Sprite', entityId });
    sprite._image = `${getBaseSprite({ path: sprite._image })}_${target}`;
    sprite._direction = target;

    event({ entityId, type: EventTypes.ENTITY_SPRITE_UPDATE });
};

export const updateSpriteActive = ({ entityId, active, gif = false }: {
    active: boolean,
    entityId?: string | null,
    gif?: boolean
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateSpriteDirection.name });

    const sprite = getComponent({ componentId: 'Sprite', entityId });
    sprite._image = (active)
        ? `${sprite._image}_active`
        : sprite._image.split('_active')[0];
    sprite._gif = gif ?? false;

    event({ entityId, type: EventTypes.ENTITY_SPRITE_UPDATE });
};
//#endregion
