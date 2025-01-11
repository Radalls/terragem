import { error } from '@/engine/services/error';
import { EngineEvents, onEvent as onEngineEvent } from '@/engine/services/event';
import { RenderEvents, onEvent as onRenderEvent } from '@/render/events';

//#region TYPES
export type Emit =
    | {
        data?: any,
        entityId?: string,
        target: 'render'
        type: RenderEvents
    }
    | {
        data?: any,
        entityId?: string,
        target: 'engine'
        type: EngineEvents
    }
    | {
        data?: any,
        entityId?: string,
        target: 'all'
        type: GameEvents
    }

export enum GameEvents {
    /* GAME */
    GAME_LAUNCH = 'GAME_LAUNCH',
    GAME_LOADING_ERROR = 'GAME_LOADING_ERROR',
    GAME_LOADING_OFF = 'GAME_LOADING_OFF',
    GAME_LOADING_ON = 'GAME_LOADING_ON',
    GAME_RUN = 'GAME_RUN',
    /* GEM */
    GEM_CARRY_REQUEST = 'GEM_CARRY_REQUEST',
    GEM_FLOOR_REQUEST = 'GEM_FLOOR_REQUEST',
    GEM_LIFT_REQUEST = 'GEM_LIFT_REQUEST',
    GEM_MINE_REQUEST = 'GEM_MINE_REQUEST',
    GEM_MOVE_REQUEST = 'GEM_MOVE_REQUEST',
    GEM_SHAFT_REQUEST = 'GEM_SHAFT_REQUEST',
    GEM_STORE = 'GEM_STORE',
    GEM_STORE_DEPLOY = 'GEM_STORE_DEPLOY',
    GEM_TUNNEL_REQUEST = 'GEM_TUNNEL_REQUEST',
}
//#endregion

//#region SERVICES
export const emit = ({ data, entityId, target, type }: Emit) => {
    if (target === 'engine') onEngineEvent({ data, entityId, type });
    else if (target === 'render') onRenderEvent({ data, entityId, type });
    else if (target === 'all') {
        onEngineEvent({ data, entityId, type });
        onRenderEvent({ data, entityId, type });
    }
    else error({ message: `Unknown emit target: ${target}`, where: emit.name });
};
//#endregion
