import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { launch, run } from '@/render/main';
import {
    createAdminMenu,
    createGem,
    createSprite,
    createTile,
    createTileMap,
    destroyGem,
    destroyTileMap,
    displayInfo,
    displayLoading,
    displayQuests,
    setAdminMode,
    setGemMode,
    setTileMode,
    setUIMode,
    updateGemInfo,
    updateAdminGems,
    updateLabs,
    updateQuests,
    updateStorage,
    updateTileEntity,
    updateWorkshop,
    updateGems,
    updateScroll,
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
    ADMIN_UPDATE_GEMS = 'ADMIN_UPDATE_GEMS',
    ADMIN_UPDATE_LABS = 'ADMIN_UPDATE_LABS',
    ADMIN_UPDATE_STORAGE = 'ADMIN_UPDATE_STORAGE',
    ADMIN_UPDATE_WORKSHOP = 'ADMIN_UPDATE_WORKSHOP',
    /* GEM */
    GEM_CARRY_STOP = 'GEM_CARRY_STOP',
    GEM_CREATE = 'GEM_CREATE',
    GEM_DESTROY = 'GEM_DESTROY',
    GEM_LIFT_STOP = 'GEM_LIFT_STOP',
    GEM_MINE_STOP = 'GEM_MINE_STOP',
    GEM_MOVE_STOP = 'GEM_MOVE_STOP',
    GEM_TUNNEL_STOP = 'GEM_TUNNEL_STOP',
    GEM_UPDATE = 'GEM_UPDATE',
    /* INFO */
    INFO = 'INFO',
    /* MODE */
    MODE_BASE = 'MODE_BASE',
    MODE_REQUEST = 'MODE_REQUEST',
    /* POSITION */
    POSITION_UPDATE = 'POSITION_UPDATE',
    /* QUEST */
    QUEST_CREATE = 'QUEST_CREATE',
    QUEST_END = 'QUEST_END',
    QUEST_UPDATE = 'QUEST_UPDATE',
    /* SCROLL */
    SCROLL_UPDATE = 'SCROLL_UPDATE',
    /* SPRITE */
    SPRITE_UPDATE = 'SPRITE_UPDATE',
    /* TILEMAP */
    TILEMAP_CREATE = 'TILEMAP_CREATE',
    TILEMAP_DESTROY = 'TILEMAP_DESTROY',
    TILE_CREATE = 'TILE_CREATE',
    TILE_DESTROY = 'TILE_DESTROY',
    TILE_GROUND = 'TILE_GROUND',
}
//#endregion

//#region EVENTS
export const onEvent = ({
    data,
    entityId,
    type,
}: RenderEvent) => {
    /* GAME */
    if (type === GameEvents.GAME_LAUNCH) {
        launch();
    }
    else if (
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
    else if (type === RenderEvents.ADMIN_UPDATE_GEMS) {
        updateAdminGems();
    }
    else if (type === RenderEvents.ADMIN_UPDATE_LABS) {
        updateLabs();
    }
    else if (type === RenderEvents.ADMIN_UPDATE_STORAGE) {
        updateStorage();
        updateWorkshop();
    }
    else if (type === RenderEvents.ADMIN_UPDATE_WORKSHOP) {
        updateWorkshop();
    }
    /* GEM */
    else if (type === RenderEvents.GEM_CREATE && entityId) {
        createGem({ gemId: entityId });
    }
    else if (type === RenderEvents.GEM_UPDATE && entityId) {
        updateGemInfo({ gemId: entityId });
    }
    else if (type === RenderEvents.GEM_DESTROY && entityId) {
        destroyGem({ gemId: entityId });
    }
    else if (type === GameEvents.GEM_MOVE_REQUEST && entityId) {
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
    else if (type === GameEvents.GEM_TUNNEL_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'mine' });
    }
    else if (type === RenderEvents.GEM_TUNNEL_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEvents.GEM_LIFT_REQUEST && entityId) {
        setGemMode({ gemId: entityId, mode: 'carry' });
    }
    else if (type === RenderEvents.GEM_LIFT_STOP && entityId) {
        setGemMode({ gemId: entityId, mode: 'base' });
    }
    else if (type === GameEvents.GEM_STORE_DEPLOY && entityId) {
        updateGems();

        emit({ entityId, target: 'render', type: RenderEvents.GEM_CREATE });
    }
    else if (type === GameEvents.GEM_STORE && entityId) {
        updateGems();

        emit({ entityId, target: 'render', type: RenderEvents.GEM_DESTROY });
    }
    /* INFO */
    else if (type === RenderEvents.INFO && data.text) {
        displayInfo({ alert: data.alert, text: data.text, type: data.type });
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
    /* SCROLL */
    else if (type === RenderEvents.SCROLL_UPDATE) {
        updateScroll();
    }
    /* SPRITE */
    else if (type === RenderEvents.SPRITE_UPDATE && entityId) {
        createSprite({ elId: entityId });
        updateAdminGems();
        updateGems();
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
        setTileMode({ mode: 'destroy', tileId: entityId });
    }
    else if (type === RenderEvents.TILE_GROUND && entityId) {
        setTileMode({ mode: 'ground', tileId: entityId });
    }
    else error({
        message: `Unknown event type: ${type} ${entityId} ${data}`,
        where: onEvent.name,
    });
};
//#endregion
