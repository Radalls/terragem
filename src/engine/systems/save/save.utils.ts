import pkg from '../../../../package.json';

import { Items, TileMap } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { createEntityGem } from '@/engine/services/entity';
import { getAdmin } from '@/engine/systems/entity';
import { getGemType } from '@/engine/systems/gem';
import { SaveData } from '@/engine/systems/save';
import { RenderEvents } from '@/render/events';

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

export const loadSaveBuild = () => {
    const admin = getAdmin();

    for (let v = 0; v < admin.builds.forges.vulkan; v++) {
        emit({ data: Items.BUILD_FORGE_VULKAN, target: 'render', type: RenderEvents.BUILD_CREATE });
    }

    for (let o = 0; o < admin.builds.forges.oryon; o++) {
        emit({ data: Items.BUILD_FORGE_ORYON, target: 'render', type: RenderEvents.BUILD_CREATE });
    }
};
//#endregion
