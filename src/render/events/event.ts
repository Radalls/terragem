import { emit, GameEvents } from '@/engine/services/emit';
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
    displayQuests,
    setAdminMode,
    setGemMode,
    setTileMode,
    setUIMode,
    updateQuests,
    updateTileEntity,
} from '@/render/templates';

//#region TYPES
export type RenderEvent = {
    data?: any
    entityId?: string,
    type: RenderEvents | GameEvents,
};

export enum RenderEvents {
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
    /* QUEST */
    QUEST_CREATE = 'QUEST_CREATE',
    QUEST_END = 'QUEST_END',
    QUEST_UPDATE = 'QUEST_UPDATE',
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
        type === GameEvents.GAME_LOADING_ERROR
        || type === GameEvents.GAME_LOADING_OFF
        || type === GameEvents.GAME_LOADING_ON
    ) {
        displayLoading({ load: (type === GameEvents.GAME_LOADING_ON) });
    }
    else if (type === GameEvents.GAME_RUN) {
        run();
    }
    /* ADMIN */
    else if (type === RenderEvents.ADMIN_CREATE && entityId) {
        createAdminMenu();
    }
    /* GEM */
    else if (type === RenderEvents.GEM_CREATE && entityId) {
        createGem({ gemId: entityId });
    }
    else if (type === RenderEvents.GEM_DESTROY && entityId) {
        destroyGem({ gemId: entityId });
    }
    else if (type === GameEvents.GEM_MOVE_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'request' });

        emit({ target: 'render', type: RenderEvents.MODE_REQUEST });
    }
    else if (type === RenderEvents.GEM_MOVE_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEvents.GEM_MINE_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'mine' });
    }
    else if (type === RenderEvents.GEM_MINE_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEvents.GEM_CARRY_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'carry' });

        emit({ target: 'render', type: RenderEvents.MODE_REQUEST });
    }
    else if (type === RenderEvents.GEM_CARRY_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEvents.GEM_STORE_DEPLOY && entityId) {
        emit({ entityId, target: 'render', type: RenderEvents.GEM_CREATE });
    }
    else if (type === GameEvents.GEM_STORE && entityId) {
        emit({ entityId, target: 'render', type: RenderEvents.GEM_DESTROY });
    }
    /* INFO */
    else if (type === RenderEvents.INFO && data) {
        displayInfo({ alert: false, text: data });
    }
    else if (type === RenderEvents.INFO_ALERT && data) {
        displayInfo({ alert: true, text: data });
    }
    /* MODE */
    else if (type === RenderEvents.MODE_BASE) {
        setAdminMode({ mode: 'base' });
        setTileMode({ mode: 'base' });
        setUIMode({ mode: 'base' });
    }
    else if (type === RenderEvents.MODE_REQUEST) {
        setAdminMode({ mode: 'disable' });
        setTileMode({ mode: 'request' });
        setUIMode({ mode: 'request' });
    }
    /* POSITION */
    else if (type === RenderEvents.POSITION_UPDATE && entityId) {
        updateTileEntity({ elId: entityId });
    }
    /* QUEST */
    else if (type === RenderEvents.QUEST_CREATE) {
        updateQuests();
        displayQuests({ display: true });
    }
    else if (type === RenderEvents.QUEST_END) {
        updateQuests();
    }
    else if (type === RenderEvents.QUEST_UPDATE) {
        updateQuests();
    }
    /* TILEMAP */
    else if (type === RenderEvents.TILEMAP_CREATE && entityId) {
        createTileMap({ tileMapId: entityId });
    }
    else if (type === RenderEvents.TILEMAP_DESTROY && entityId) {
        destroyTileMap({ tileMapId: entityId });
    }
    else if (type === RenderEvents.TILE_CREATE && entityId) {
        createTile({ tileId: entityId });
    }
    else if (type === RenderEvents.TILE_DESTROY && entityId) {
        destroyTile({ tileId: entityId });
    }
    else error({
        message: `Unknown event type: ${type} ${entityId} ${data}`,
        where: onEvent.name,
    });
};
//#endregion
