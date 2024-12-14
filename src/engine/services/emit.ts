import { error } from '@/engine/services/error';
import { EngineEventTypes, onEvent as onEngineEvent } from '@/engine/services/event';
import { RenderEventTypes, onEvent as onRenderEvent } from '@/render/events';

//#region TYPES
export type Emit =
    | {
        data?: any,
        entityId?: string,
        target: 'render'
        type: RenderEventTypes
    }
    | {
        data?: any,
        entityId?: string,
        target: 'engine'
        type: EngineEventTypes
    }
    | {
        data?: any,
        entityId?: string,
        target: 'all'
        type: GameEventTypes
    }

export enum GameEventTypes {
    /* GAME */
    GAME_LOADING_ERROR = 'GAME_LOADING_ERROR',
    GAME_LOADING_OFF = 'GAME_LOADING_OFF',
    GAME_LOADING_ON = 'GAME_LOADING_ON',
    GAME_RUN = 'GAME_RUN',
    /* GEM */
    GEM_CARRY_REQUEST = 'GEM_CARRY_REQUEST',
    GEM_MINE_REQUEST = 'GEM_MINE_REQUEST',
    GEM_MOVE_REQUEST = 'GEM_MOVE_REQUEST',
    GEM_STORE = 'GEM_STORE',
    GEM_STORE_DEPLOY = 'GEM_STORE_DEPLOY',
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
