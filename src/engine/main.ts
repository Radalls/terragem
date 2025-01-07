import { Gems } from '@/engine/components';
import { createAssetManager, AssetManager } from '@/engine/services/asset';
import { initAudios } from '@/engine/services/audio';
import { startCycle } from '@/engine/services/cycle';
import { emit, GameEvents } from '@/engine/services/emit';
import { createEntityAdmin, createEntityGem, createEntityTileMap } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { createQuest } from '@/engine/systems/quest';
import { getSaveTileMap, SaveData } from '@/engine/systems/save';

//#region CONSTANTS
export let asset: AssetManager;
//#endregion

export const main = () => {
    asset = createAssetManager();
    asset.startLoading();

    initAudios();
};

export const launch = () => {
    setState({ key: 'gameLaunch', value: true });

    createEntityAdmin({});

    startCycle();
};

export const run = ({ saveData }: { saveData?: SaveData }) => {
    if (!(asset.isLoadingComplete())) {
        error({
            message: 'Loading manager is not complete',
            where: run.name,
        });
    }

    emit({ target: 'all', type: GameEvents.GAME_LOADING_ON });

    if (saveData) {
        createEntityAdmin({ adminId: saveData.store.adminId });

        const saveTileMap = getSaveTileMap({ saveData });
        createEntityTileMap({
            saveTileMap,
            tileMapName: saveTileMap._name,
        });
    }
    else {
        createEntityAdmin({ adminId: getStore({ key: 'adminId' }) });
        createEntityTileMap({ tileMapName: 'map1' });

        createEntityGem({ type: Gems.MINE });
        createEntityGem({ type: Gems.CARRY });

        createQuest({ questName: 'QUEST_MINE_IRON_1' });
        createQuest({ questName: 'QUEST_MINE_COPPER_1' });
        createQuest({ questName: 'QUEST_CARRY_1' });
    }

    emit({ target: 'engine', type: EngineEvents.ENGINE_PLAY });
};
