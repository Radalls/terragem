import { createTileMapState, getProjectVersion, saveTileMapStates } from './manager.utils';

import { Energy } from '@/engine/components/energy';
import { Inventory } from '@/engine/components/inventory';
import { Manager } from '@/engine/components/manager';
import { Position } from '@/engine/components/position';
import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { event as renderEvent } from '@/render/events';

//#region TYPES
export type SaveData = {
    manager: Manager,
    playerEnergy: Energy,
    playerInventory: Inventory,
    playerPosition: Position,
    tileMapName: string,
    version: string,
};
//#endregion

//#region DATA
export const createSave = ({ managerEntityId, playerEntityId, tileMapEntityId }: {
    managerEntityId?: string | null,
    playerEntityId?: string | null,
    tileMapEntityId?: string | null
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: createSave.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: createSave.name });

    const playerPosition = getComponent({ componentId: 'Position', entityId: playerEntityId });
    const playerInventory = getComponent({ componentId: 'Inventory', entityId: playerEntityId });
    const playerEnergy = getComponent({ componentId: 'Energy', entityId: playerEntityId });

    if (!(tileMapEntityId)) tileMapEntityId = getStore('tileMapId')
        ?? error({ message: 'Store tileMapId is undefined', where: createSave.name });

    const tileMapName = getComponent({ componentId: 'TileMap', entityId: tileMapEntityId })._name
        ?? error({ message: 'TileMap name is undefined', where: createSave.name });

    createTileMapState({ managerEntityId, player: true, tileMapEntityId });
    saveTileMapStates({ managerEntityId });

    const saveData: SaveData = {
        manager,
        playerEnergy,
        playerInventory,
        playerPosition,
        tileMapName,
        version: getProjectVersion(),
    };

    downloadSave({ saveData });

    renderEvent({ data: { audioName: 'menu_settings_save' }, type: EventTypes.AUDIO_PLAY });
};

export const loadSave = (): Promise<SaveData> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        const handleCancel = () => {
            reject('File selection was canceled by the user.');
            cleanup();
        };

        const cleanup = () => {
            input.removeEventListener('change', handleFileSelect);
            input.removeEventListener('focusout', handleCancel);
            input.removeEventListener('blur', handleCancel);
            input.remove();
        };

        const handleFileSelect = async (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            cleanup();

            if (!(file)) {
                reject(error({
                    message: 'No file was selected.',
                    where: loadSave.name,
                }));

                return;
            }

            try {
                const fileContents = await file.text();
                const saveData: SaveData = JSON.parse(fileContents);
                resolve(saveData);
            } catch (err) {
                console.error('Failed to read or parse the file:', err);
                reject(err);
            }
        };

        input.addEventListener('change', handleFileSelect);
        input.addEventListener('focusout', handleCancel);
        input.addEventListener('blur', handleCancel);

        input.click();
    });
};

export const downloadSave = ({ saveData, saveName }: { saveData: SaveData, saveName?: string }) => {
    const jsonData = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = saveName ?? `save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
//#endregion
