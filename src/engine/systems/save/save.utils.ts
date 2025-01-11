import pkg from '../../../../package.json';

import { TileMap } from '@/engine/components';
import { createEntityGem } from '@/engine/services/entity';
import { getAdmin } from '@/engine/systems/entity';
import { getGemType } from '@/engine/systems/gem';
import { SaveData } from '@/engine/systems/save';

//#region UTILS
export const getProjectVersion = () => pkg.version;

export const getSaveTileMap = ({ saveData }: { saveData: SaveData }) => {
    return saveData.entities[saveData.store.tileMapId].components['TileMap'] as TileMap;
};

export const loadSaveGem = () => {
    const admin = getAdmin();

    for (const gemId of admin.gems) {
        const gemType = getGemType({ gemId });

        createEntityGem({ gemId, type: gemType });
    }
};
//#endregion
