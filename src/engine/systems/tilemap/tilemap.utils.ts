import { emit } from '@/engine/services/emit';
import { getComponent } from '@/engine/systems/entity';
import { updateSprite } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region UTILS
export const isGround = ({ tileId }: { tileId: string }) => {
    const tileSprite = getComponent({ componentId: 'Sprite', entityId: tileId });

    return tileSprite._image.includes('ground')
        || tileSprite._image.includes('floor');
};

export const isLock = ({ tileId }: { tileId: string }) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    return tile._lock;
};

export const destroyTile = ({ tileId, value = true }: {
    tileId: string,
    value?: boolean
}) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    tile._destroy = value;

    if (value) {
        updateSprite({ entityId: tileId, image: `tile_ground${tile._density}_destroy` });

        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_DESTROY });
    }
    else {
        updateSprite({ entityId: tileId, image: 'tile_floor' });

        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_CREATE });
    }
};

export const lockTile = ({ tileId, value = true }: {
    tileId: string,
    value?: boolean
}) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    tile._lock = value;

    if (value) {
        updateSprite({ entityId: tileId, image: 'tile_lock' });
    }
    else {
        updateSprite({ entityId: tileId, image: `tile_ground${tile._density}` });
    }
};
//#endregion
