import { Gems } from '@/engine/components';
import { createAssetManager, AssetManager } from '@/engine/services/asset';
import { startCycle } from '@/engine/services/cycle';
import { emit, GameEvents } from '@/engine/services/emit';
import { createEntityAdmin, createEntityGem, createEntityTileMap } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { createQuest } from '@/engine/systems/quest';

//#region CONSTANTS
export let asset: AssetManager;
//#endregion

export const main = () => {
    asset = createAssetManager();
    asset.startLoading();

    launch();
};

const launch = () => {
    setState({ key: 'gameLaunch', value: true });

    createEntityAdmin({});

    startCycle();
};

export const run = () => {
    if (!(asset.isLoadingComplete())) {
        error({
            message: 'Loading manager is not complete',
            where: run.name,
        });
    }

    emit({ target: 'all', type: GameEvents.GAME_LOADING_ON });

    createEntityTileMap({ tileMapName: 'map1' });
    createEntityGem({ type: Gems.MINE });
    createEntityGem({ type: Gems.MINE });
    createEntityGem({ type: Gems.CARRY });
    createEntityGem({ type: Gems.CARRY });
    createEntityGem({ type: Gems.TUNNEL });
    createEntityGem({ type: Gems.LIFT });
    createQuest({ questName: 'QUEST_MINE_IRON_1' });
    createQuest({ questName: 'QUEST_MINE_COPPER_1' });
    createQuest({ questName: 'QUEST_CARRY_1' });

    emit({ target: 'engine', type: EngineEvents.ENGINE_PLAY });
};
