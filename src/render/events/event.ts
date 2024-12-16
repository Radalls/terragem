import { emit, GameEventTypes } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { run } from '@/render/main';
import {
    createAdminMenu,
    createGem,
    createTile,
    createTileMap,
    destroyGem,
    destroyTile,
    destroyTileMap,
    displayInfo,
    displayLoading,
    setAdminMode,
    setGemMode,
    setTileMode,
    setUIMode,
    updateTileEntity,
} from '@/render/templates';

//#region TYPES
export type RenderEvent = {
    data?: any
    entityId?: string,
    type: RenderEventTypes | GameEventTypes,
};

export enum RenderEventTypes {
    /* ADMIN */
    ADMIN_CREATE = 'ADMIN_CREATE',
    /* GEM */
    GEM_CARRY_STOP = 'GEM_CARRY_STOP',
    GEM_CREATE = 'GEM_CREATE',
    GEM_DESTROY = 'GEM_DESTROY',
    GEM_MINE_STOP = 'GEM_MINE_STOP',
    GEM_MOVE_STOP = 'GEM_MOVE_STOP',
    /* INFO */
    INFO = 'INFO',
    INFO_ALERT = 'INFO_ALERT',
    /* MODE */
    MODE_BASE = 'MODE_BASE',
    MODE_REQUEST = 'MODE_REQUEST',
    /* POSITION */
    POSITION_UPDATE = 'POSITION_UPDATE',
    /* TILEMAP */
    TILEMAP_CREATE = 'TILEMAP_CREATE',
    TILEMAP_DESTROY = 'TILEMAP_DESTROY',
    TILE_CREATE = 'TILE_CREATE',
    TILE_DESTROY = 'TILE_DESTROY',
}
//#endregion

//#region EVENTS
export const onEvent = ({
    data,
    entityId,
    type,
}: RenderEvent) => {
    /* GAME */
    if (
        type === GameEventTypes.GAME_LOADING_ERROR
        || type === GameEventTypes.GAME_LOADING_OFF
        || type === GameEventTypes.GAME_LOADING_ON
    ) {
        displayLoading({ load: (type === GameEventTypes.GAME_LOADING_ON) });
    }
    else if (type === GameEventTypes.GAME_RUN) {
        run();
    }
    /* ADMIN */
    else if (type === RenderEventTypes.ADMIN_CREATE && entityId) {
        createAdminMenu();
    }
    /* GEM */
    else if (type === RenderEventTypes.GEM_CREATE && entityId) {
        createGem({ gemId: entityId });
    }
    else if (type === RenderEventTypes.GEM_DESTROY && entityId) {
        destroyGem({ gemId: entityId });
    }
    else if (type === GameEventTypes.GEM_MOVE_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'request' });

        emit({ target: 'render', type: RenderEventTypes.MODE_REQUEST });
    }
    else if (type === RenderEventTypes.GEM_MOVE_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEventTypes.GEM_MINE_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'mine' });
    }
    else if (type === RenderEventTypes.GEM_MINE_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
        setGemMode({ gemId: entityId, mode: 'mine', remove: true });
    }
    else if (type === GameEventTypes.GEM_CARRY_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'carry' });

        emit({ target: 'render', type: RenderEventTypes.MODE_REQUEST });
    }
    else if (type === RenderEventTypes.GEM_CARRY_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEventTypes.GEM_STORE_DEPLOY && entityId) {
        emit({ entityId, target: 'render', type: RenderEventTypes.GEM_CREATE });
    }
    else if (type === GameEventTypes.GEM_STORE && entityId) {
        emit({ entityId, target: 'render', type: RenderEventTypes.GEM_DESTROY });
    }
    /* INFO */
    else if (type === RenderEventTypes.INFO && data) {
        displayInfo({ alert: false, text: data });
    }
    else if (type === RenderEventTypes.INFO_ALERT && data) {
        displayInfo({ alert: true, text: data });
    }
    /* MODE */
    else if (type === RenderEventTypes.MODE_BASE) {
        setAdminMode({ mode: 'base' });
        setTileMode({ mode: 'base' });
        setUIMode({ mode: 'base' });
    }
    else if (type === RenderEventTypes.MODE_REQUEST) {
        setAdminMode({ mode: 'disable' });
        setTileMode({ mode: 'request' });
        setUIMode({ mode: 'request' });
    }
    /* POSITION */
    else if (type === RenderEventTypes.POSITION_UPDATE && entityId) {
        updateTileEntity({ elId: entityId });
    }
    /* TILEMAP */
    else if (type === RenderEventTypes.TILEMAP_CREATE && entityId) {
        createTileMap({ tileMapId: entityId });
    }
    else if (type === RenderEventTypes.TILEMAP_DESTROY && entityId) {
        destroyTileMap({ tileMapId: entityId });
    }
    else if (type === RenderEventTypes.TILE_CREATE && entityId) {
        createTile({ tileId: entityId });
    }
    else if (type === RenderEventTypes.TILE_DESTROY && entityId) {
        destroyTile({ tileId: entityId });
    }
    else error({
        message: `Unknown event type: ${type} ${entityId} ${data}`,
        where: onEvent.name,
    });
};
//#endregion
