import { createAssetManager, AssetManager } from '@/engine/services/asset';
import { initAudios } from '@/engine/services/audio';
import { startCycle } from '@/engine/services/cycle';
import { emit, GameEvents } from '@/engine/services/emit';
import { createEntityAdmin } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { createRun, loadRun, SaveData } from '@/engine/systems/save';

//#region CONSTANTS
export let asset: AssetManager;
//#endregion

export const main = () => {
    asset = createAssetManager();
    asset.startLoading();
};

export const launch = () => {
    if (!(asset.isLoadingComplete())) {
        error({
            message: 'Loading manager is not complete',
            where: run.name,
        });
    }

    setState({ key: 'gameLaunch', value: true });

    createEntityAdmin({});
    startCycle();
    initAudios();
};

export const run = ({ saveData }: { saveData?: SaveData }) => {
    emit({ target: 'all', type: GameEvents.GAME_LOADING_ON });

    if (saveData) {
        loadRun({ saveData });
    }
    else {
        createRun();
    }

    emit({ target: 'engine', type: EngineEvents.ENGINE_PLAY });
};
