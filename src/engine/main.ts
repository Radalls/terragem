import { Admin, Gems, Items } from '@/engine/components';
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

const testAdmin: Admin = {
    _: 'Admin',
    _gemMax: 3,
    _labPoints: 0,
    crafts: ['GEM_MINE'],
    gems: [],
    items: [
        {
            _amount: 25,
            _name: Items.STONE,
        },
        {
            _amount: 25,
            _name: Items.IRON,
        },
        {
            _amount: 25,
            _name: Items.COPPER,
        },
        {
            _amount: 1,
            _name: Items.LUMYN,
        },
    ],
    labs: [],
    quests: [],
    requests: [],
};
//#endregion

export const main = () => {
    asset = createAssetManager();
    asset.startLoading();

    launch();
};

const launch = () => {
    setState({ key: 'gameLaunch', value: true });

    createEntityAdmin({ saveAdmin: testAdmin });

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
    createEntityGem({ type: Gems.CARRY });
    createQuest({ questName: 'QUEST_MINE_IRON_1' });
    createQuest({ questName: 'QUEST_MINE_COPPER_1' });
    createQuest({ questName: 'QUEST_CARRY_1' });

    emit({ target: 'engine', type: EngineEvents.ENGINE_PLAY });
};
