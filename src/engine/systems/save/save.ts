import { Component, Gems } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { createEntityAdmin, createEntityGem, createEntityTileMap } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import {
    addComponent,
    ADMIN_ENTITY_NAME,
    checkComponent,
    entities,
    Entity,
    getRawEntityId,
} from '@/engine/systems/entity';
import { createQuest } from '@/engine/systems/quest';
import { getProjectVersion, getSaveTileMap, loadSaveBuild, loadSaveGem, SaveData } from '@/engine/systems/save';
import { RenderEvents } from '@/render/events';

//#region SYSTEMS
export const exportSaveFile = () => {
    const saveData = saveGame();

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `terragem-save-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importSaveFile = ({ saveFile }: { saveFile: File }): Promise<void> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target?.result as string) as SaveData;
                loadGame(saveData);
                resolve();
            } catch (err) {
                reject(error({
                    message: `Failed to parse save file: ${(err as Error).message}`,
                    where: importSaveFile.name,
                }));
            }
        };

        reader.onerror = () => reject(error({
            message: 'Failed to import save file',
            where: importSaveFile.name,
        }));

        reader.readAsText(saveFile);
    });
};

export const saveGame = () => {
    const saveData: SaveData = {
        entities: {},
        store: {
            adminId: getStore({ key: 'adminId' }),
            tileMapId: getStore({ key: 'tileMapId' }),
        },
        timestamp: Date.now(),
        version: getProjectVersion(),
    };

    const adminIds = Object.keys(entities).filter(id => getRawEntityId({ entityId: id }) === ADMIN_ENTITY_NAME);
    for (const adminId of adminIds) {
        if (adminId !== getStore({ key: 'adminId' })) delete entities[adminId];
    }

    Object.entries(entities).forEach(([entityId, entity]) => {
        const components: Record<string, unknown> = {};

        Object.entries(entity).forEach(([componentKey, component]) => {
            if (component !== undefined) {
                components[componentKey] = component;
            }
        });

        saveData.entities[entityId] = {
            components,
            entityName: getRawEntityId({ entityId }),
        };
    });

    return saveData;
};

export const loadGame = (saveData: SaveData) => {
    if (saveData.version !== getProjectVersion()) {
        throw error({
            emit: true,
            message: `Save version mismatch. Expected ${getProjectVersion()}, got ${saveData.version}`,
            where: loadGame.name,
        });
    }

    Object.entries(saveData.entities).forEach(([entityId, serializedEntity]) => {
        entities[entityId] = {} as Entity;

        Object.entries(serializedEntity.components).forEach(([componentKey, componentData]) => {
            // @ts-expect-error - Dynamic component restoration
            addComponent({ component: componentData, entityId });
            checkComponent({ componentId: componentKey as keyof Component, entityId });
        });
    });

    emit({ data: saveData, target: 'all', type: GameEvents.GAME_RUN });
};

export const createRun = () => {
    createEntityAdmin({ adminId: getStore({ key: 'adminId' }) });
    createEntityTileMap({ tileMapName: 'map1' });

    createQuest({ questName: 'QUEST_MINE_STONE_1' });
    createQuest({ questName: 'QUEST_MINE_GEOLYN_1' });
    createQuest({ questName: 'QUEST_MINE_CERULYN_1' });
    createQuest({ questName: 'QUEST_CARRY_1' });
    createQuest({ questName: 'QUEST_GEMS_1' });

    createEntityGem({ deploy: true, type: Gems.MINE, x: 18, y: 0 });
    createEntityGem({ deploy: true, type: Gems.CARRY, x: 10, y: 0 });

    emit({ data: { audioName: 'main_start' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    emit({ data: { audioName: 'bgm_menu', list: true }, target: 'engine', type: EngineEvents.AUDIO_STOP });
    emit({ data: { audioName: 'bgm_game', list: true }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

export const loadRun = ({ saveData }: { saveData: SaveData }) => {
    createEntityAdmin({ adminId: saveData.store.adminId });

    const saveTileMap = getSaveTileMap({ saveData });
    createEntityTileMap({
        saveTileMap,
        tileMapName: saveTileMap._name,
    });

    emit({ target: 'render', type: RenderEvents.QUEST_CREATE });

    loadSaveGem();
    loadSaveBuild();

    emit({ data: { audioName: 'main_start' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    emit({ data: { audioName: 'bgm_menu', list: true }, target: 'engine', type: EngineEvents.AUDIO_STOP });
    emit({ data: { audioName: 'bgm_game', list: true }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion
