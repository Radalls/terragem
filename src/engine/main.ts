import { Admin, GemTypes, ItemTypes } from './components';

import { createAssetManager, AssetManager } from '@/engine/services/asset';
import { startCycle } from '@/engine/services/cycle';
import { emit, GameEventTypes } from '@/engine/services/emit';
import { createEntityAdmin, createEntityGem, createEntityTileMap } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEventTypes } from '@/engine/services/event';
import { setState } from '@/engine/services/state';

//#region CONSTANTS
export let asset: AssetManager;

const testAdmin: Admin = {
    _: 'Admin',
    gems: [],
    items: [
        {
            _amount: 25,
            _type: ItemTypes.COPPER,
        },
        {
            _amount: 25,
            _type: ItemTypes.IRON,
        },
        {
            _amount: 25,
            _type: ItemTypes.STONE,
        },
        {
            _amount: 1,
            _type: ItemTypes.LUMYN,
        },
    ],
    recipes: [
        'GEM_MINE',
        'GEM_CARRY',
    ],
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

    emit({ target: 'all', type: GameEventTypes.GAME_LOADING_ON });

    createEntityTileMap({ tileMapName: 'map1' });
    createEntityGem({ type: GemTypes.MINE });
    createEntityGem({ type: GemTypes.CARRY });

    emit({ target: 'engine', type: EngineEventTypes.ENGINE_PLAY });
};
