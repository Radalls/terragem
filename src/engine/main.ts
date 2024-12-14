import { startCycle } from '@/engine/services/cycle';
import { createEntityManager, createEntityPlayer, createEntityTileMap } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { createLoadingManager, LoadingManager } from '@/engine/services/load';
import { initState, setState } from '@/engine/services/state';
import { initQuest, SaveData } from '@/engine/systems/manager';
import { event } from '@/render/events';

const playerInit = {
    initMap: 'map_plains',
    initPositionX: 58,
    initPositionY: 31,
};

let loadingManager: LoadingManager;

export const main = () => {
    loadingManager = createLoadingManager();
    loadingManager.startLoading();
    launch();
};

export const run = ({ saveData }: { saveData?: SaveData }) => {
    if (!(loadingManager.isLoadingComplete())) {
        error({
            message: 'Loading manager is not complete',
            where: run.name,
        });
    }

    setState('isGameLoading', true);
    event({ type: EventTypes.MAIN_LOADING_ON });

    if (saveData?.manager) {
        createEntityManager({ savedManager: saveData.manager });
    }
    else {
        createEntityManager({});
    }

    createEntityTileMap({
        tileMapName: (saveData?.tileMapName)
            ? saveData.tileMapName
            : playerInit.initMap,
    });

    createEntityPlayer({
        positionX: (saveData?.playerPosition)
            ? undefined
            : playerInit.initPositionX,
        positionY: (saveData?.playerPosition)
            ? undefined
            : playerInit.initPositionY,
        savedEnergy: saveData?.playerEnergy,
        savedInventory: saveData?.playerInventory,
        savedPosition: saveData?.playerPosition,
        spritePath: 'player_player1_down',
    });

    initState({});
    initQuest({});

    setState('isGameRunning', true);

    setTimeout(() => {
        setState('isGameLoading', false);
        event({ type: EventTypes.MAIN_LOADING_OFF });
    }, 1000);
};

export const launch = () => {
    setState('isGameLaunching', true);

    createEntityManager({});
    initState({});
    startCycle();
};
