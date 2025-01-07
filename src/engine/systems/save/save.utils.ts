import pkg from '../../../../package.json';

import { Admin, Component, TileMap } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { entities, getRawEntityId, Entity, checkComponent } from '@/engine/systems/entity';
import { SaveData } from '@/engine/systems/save';

//#region UTILS
export const getProjectVersion = () => pkg.version;

export const saveGame = () => {
    const saveData: SaveData = {
        entities: {},
        store: {
            adminId: getStore({ key: 'adminId' }),
            requestId: getStore({ key: 'requestId' }),
            tileMapId: getStore({ key: 'tileMapId' }),
        },
        timestamp: Date.now(),
        version: getProjectVersion(),
    };

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

    // Clear store
    // voidStore();
    // Clear state

    // Restore store values
    // Object.entries(saveData.store).forEach(([key, value]) => {
    //     setStore({ key, value });
    // });

    // Recreate entities and their components
    Object.entries(saveData.entities).forEach(([entityId, serializedEntity]) => {
        entities[entityId] = {} as Entity;

        Object.entries(serializedEntity.components).forEach(([componentKey, componentData]) => {
            // @ts-expect-error - Dynamic component restoration
            addComponent({ component: componentData, entityId });
            checkComponent({ componentId: componentKey as keyof Component, entityId });
        });
    });

    emit({ target: 'all', type: GameEvents.GAME_RUN });
};

export const getSaveAdmin = ({ saveData }: { saveData: SaveData }) => {
    return saveData.entities[saveData.store.adminId].components['Admin'] as Admin;
};

export const getSaveTileMap = ({ saveData }: { saveData: SaveData }) => {
    return saveData.entities[saveData.store.tileMapId].components['TileMap'] as TileMap;
};
//#endregion
