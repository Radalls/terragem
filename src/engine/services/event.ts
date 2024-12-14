import { run } from '@/engine/main';
import { emit, GameEventTypes } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { setState } from '@/engine/services/state';
import { clearStore, setStore } from '@/engine/services/store';
import { requestGemMine, setGemStore, stopGemCarry, stopGemMine, stopGemMove } from '@/engine/systems/gem';
import { selectTile } from '@/engine/systems/tilemap';

//#region TYPES
export type EngineEvent = {
    data?: any
    entityId?: string,
    type: EngineEventTypes | GameEventTypes,
};

export enum EngineEventTypes {
    /* ENGINE */
    ENGINE_PLAY = 'ENGINE_PLAY',
    /* GEM */
    GEM_CARRY_CANCEL = 'GEM_CARRY_CANCEL',
    GEM_CARRY_CONFIRM_START = 'GEM_CARRY_CONFIRM_START',
    GEM_CARRY_CONFIRM_TARGET = 'GEM_CARRY_CONFIRM_TARGET',
    GEM_MINE_CANCEL = 'GEM_MINE_CANCEL',
    GEM_MOVE_CANCEL = 'GEM_MOVE_CANCEL',
    GEM_MOVE_CONFIRM = 'GEM_MOVE_CONFIRM',
    /* TILEMAP */
    TILE_SELECT = 'TILE_SELECT',
}
//#endregion

//#region SERVICES
export const onEvent = ({
    type,
    entityId,
    data,
}: EngineEvent) => {
    /* GAME */
    if (type === GameEventTypes.GAME_LOADING_ERROR) error({
        message: 'Error loading game',
        where: onEvent.name,
    });
    else if (type === GameEventTypes.GAME_LOADING_OFF) {
        setState({ key: 'gameLoad', value: false });
    }
    else if (type === GameEventTypes.GAME_LOADING_ON) {
        setState({ key: 'gameLoad', value: true });
    }
    else if (type === GameEventTypes.GAME_RUN) {
        run();
    }
    /* ENGINE */
    else if (type === EngineEventTypes.ENGINE_PLAY) {
        setState({ key: 'gameLaunch', value: false });
        setState({ key: 'gamePlay', value: true });

        emit({ target: 'all', type: GameEventTypes.GAME_LOADING_OFF });
    }
    /* GEM */
    else if (type === GameEventTypes.GEM_MOVE_REQUEST && entityId) {
        setState({ key: 'requestGemMove', value: true });
        setState({ key: 'requestTile', value: true });
        setStore({ key: 'requestId', value: entityId });
    }
    else if (type === EngineEventTypes.GEM_MOVE_CONFIRM && entityId) {
        setState({ key: 'requestGemMove', value: false });
        setState({ key: 'requestTile', value: false });
        clearStore({ key: 'requestId' });
    }
    else if (type === EngineEventTypes.GEM_MOVE_CANCEL && entityId) {
        stopGemMove({ gemId: entityId });
    }
    else if (type === GameEventTypes.GEM_MINE_REQUEST && entityId) {
        requestGemMine({ gemId: entityId });
    }
    else if (type === EngineEventTypes.GEM_MINE_CANCEL && entityId) {
        stopGemMine({ gemId: entityId });
    }
    else if (type === GameEventTypes.GEM_CARRY_REQUEST && entityId) {
        setState({ key: 'requestGemCarryStart', value: true });
        setState({ key: 'requestTile', value: true });
        setStore({ key: 'requestId', value: entityId });
    }
    else if (type === EngineEventTypes.GEM_CARRY_CONFIRM_START && entityId) {
        setState({ key: 'requestGemCarryStart', value: false });
        setState({ key: 'requestGemCarryTarget', value: true });
    }
    else if (type === EngineEventTypes.GEM_CARRY_CONFIRM_TARGET && entityId) {
        setState({ key: 'requestGemCarryTarget', value: false });
        setState({ key: 'requestTile', value: false });
        clearStore({ key: 'requestId' });
    }
    else if (type === EngineEventTypes.GEM_CARRY_CANCEL && entityId) {
        stopGemCarry({ gemId: entityId });
    }
    else if (type === GameEventTypes.GEM_STORE_DEPLOY && entityId) {
        setGemStore({ gemId: entityId, store: false });
    }
    else if (type === GameEventTypes.GEM_STORE && entityId) {
        setGemStore({ gemId: entityId, store: true });
    }
    /* TILEMAP */
    else if (type === EngineEventTypes.TILE_SELECT && entityId) {
        selectTile({ tileId: entityId });
    }
    else error({
        message: `Unknown event type: ${type} ${entityId} ${data}`,
        where: onEvent.name,
    });
};
//#endregion
