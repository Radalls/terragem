import { launch, run } from '@/engine/main';
import { pauseAudio, playAudio, stopAudio } from '@/engine/services/audio';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { setState } from '@/engine/services/state';
import { clearStore, setStore } from '@/engine/services/store';
import {
    equipGem,
    requestGemLift,
    requestGemMine,
    requestGemTunnel,
    setGemStore,
    stopGemCarry,
    stopGemLift,
    stopGemMine,
    stopGemMove,
    stopGemTunnel,
} from '@/engine/systems/gem';
import { craftAdminItem } from '@/engine/systems/item';
import { runLab } from '@/engine/systems/lab';
import { progressQuestCarry, progressQuestMine } from '@/engine/systems/quest';
import { selectTile } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region TYPES
export type EngineEvent = {
    data?: any
    entityId?: string,
    type: EngineEvents | GameEvents,
};

export enum EngineEvents {
    /* AUDIO */
    AUDIO_PAUSE = 'AUDIO_PAUSE',
    AUDIO_PLAY = 'AUDIO_PLAY',
    AUDIO_STOP = 'AUDIO_STOP',
    /* CRAFT */
    CRAFT_REQUEST = 'CRAFT_REQUEST',
    /* ENGINE */
    ENGINE_PLAY = 'ENGINE_PLAY',
    /* GEM */
    GEM_CARRY = 'GEM_CARRY',
    GEM_CARRY_CANCEL = 'GEM_CARRY_CANCEL',
    GEM_CARRY_CONFIRM_START = 'GEM_CARRY_CONFIRM_START',
    GEM_CARRY_CONFIRM_TARGET = 'GEM_CARRY_CONFIRM_TARGET',
    GEM_EQUIP = 'GEM_EQUIP',
    GEM_LIFT_CANCEL = 'GEM_LIFT_CANCEL',
    GEM_MINE = 'GEM_MINE',
    GEM_MINE_CANCEL = 'GEM_MINE_CANCEL',
    GEM_MOVE_CANCEL = 'GEM_MOVE_CANCEL',
    GEM_MOVE_CONFIRM = 'GEM_MOVE_CONFIRM',
    GEM_TUNNEL_CANCEL = 'GEM_TUNNEL_CANCEL',
    /* LAB */
    LAB_RUN = 'LAB_RUN',
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
    if (type === GameEvents.GAME_LAUNCH) {
        launch();
    }
    else if (type === GameEvents.GAME_LOADING_ERROR) error({
        message: 'Error loading game',
        where: onEvent.name,
    });
    else if (type === GameEvents.GAME_LOADING_OFF) {
        setState({ key: 'gameLoad', value: false });
    }
    else if (type === GameEvents.GAME_LOADING_ON) {
        setState({ key: 'gameLoad', value: true });
    }
    else if (type === GameEvents.GAME_RUN) {
        run({ saveData: data });
    }
    /* ENGINE */
    else if (type === EngineEvents.ENGINE_PLAY) {
        setState({ key: 'gameLaunch', value: false });
        setState({ key: 'gamePlay', value: true });

        emit({ target: 'all', type: GameEvents.GAME_LOADING_OFF });
    }
    /* AUDIO */
    else if (type === EngineEvents.AUDIO_PAUSE && data.audioName) {
        pauseAudio({ audioName: data.audioName });
    }
    else if (type === EngineEvents.AUDIO_PLAY && data.audioName) {
        playAudio({ audioName: data.audioName, loop: data.loop });
    }
    else if (type === EngineEvents.AUDIO_STOP && data.audioName) {
        stopAudio({ audioName: data.audioName });
    }
    /* GEM */
    else if (type === GameEvents.GEM_MOVE_REQUEST && entityId) {
        setState({ key: 'requestGemMove', value: true });
        setState({ key: 'requestTile', value: true });
        setStore({ key: 'requestId', value: entityId });
    }
    else if (type === EngineEvents.GEM_MOVE_CONFIRM && entityId) {
        setState({ key: 'requestGemMove', value: false });
        setState({ key: 'requestTile', value: false });
        clearStore({ key: 'requestId' });
    }
    else if (type === EngineEvents.GEM_MOVE_CANCEL && entityId) {
        stopGemMove({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_MINE && (data.amount !== undefined) && data.name) {
        progressQuestMine({ amount: data.amount, name: data.name });
    }
    else if (type === GameEvents.GEM_MINE_REQUEST && entityId) {
        requestGemMine({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_MINE_CANCEL && entityId) {
        stopGemMine({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_CARRY && (data.amount !== undefined)) {
        progressQuestCarry({ amount: data.amount });

        emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_STORAGE });
    }
    else if (type === GameEvents.GEM_CARRY_REQUEST && entityId) {
        setState({ key: 'requestGemCarryStart', value: true });
        setState({ key: 'requestTile', value: true });
        setStore({ key: 'requestId', value: entityId });
    }
    else if (type === EngineEvents.GEM_CARRY_CONFIRM_START && entityId) {
        setState({ key: 'requestGemCarryStart', value: false });
        setState({ key: 'requestGemCarryTarget', value: true });
    }
    else if (type === EngineEvents.GEM_CARRY_CONFIRM_TARGET && entityId) {
        setState({ key: 'requestGemCarryTarget', value: false });
        setState({ key: 'requestTile', value: false });
        clearStore({ key: 'requestId' });
    }
    else if (type === EngineEvents.GEM_CARRY_CANCEL && entityId) {
        stopGemCarry({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_EQUIP && entityId) {
        equipGem({ gemId: entityId });
    }
    else if (type === GameEvents.GEM_TUNNEL_REQUEST && entityId) {
        requestGemTunnel({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_TUNNEL_CANCEL && entityId) {
        stopGemTunnel({ gemId: entityId });
    }
    else if (type === GameEvents.GEM_LIFT_REQUEST && entityId) {
        requestGemLift({ gemId: entityId });
    }
    else if (type === EngineEvents.GEM_LIFT_CANCEL && entityId) {
        stopGemLift({ gemId: entityId });
    }
    else if (type === GameEvents.GEM_STORE_DEPLOY && entityId) {
        setGemStore({ gemId: entityId, store: false });
    }
    else if (type === GameEvents.GEM_STORE && entityId) {
        setGemStore({ gemId: entityId, store: true });
    }
    /* LAB */
    else if (type === EngineEvents.LAB_RUN && data) {
        runLab({ name: data });
    }
    /* TILEMAP */
    else if (type === EngineEvents.TILE_SELECT && entityId) {
        selectTile({ selectedTileId: entityId });
    }
    /* CRAFT */
    else if (type === EngineEvents.CRAFT_REQUEST && data) {
        craftAdminItem({ itemName: data });
    }
    else error({
        message: `Unknown event type: ${type} ${entityId} ${data}`,
        where: onEvent.name,
    });
};
//#endregion
