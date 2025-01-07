import { SaveData, loadGame, saveGame } from '@/engine/systems/save';

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

export const importSaveFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target?.result as string) as SaveData;
                loadGame(saveData);
                resolve();
            } catch (error) {
                reject(new Error('Failed to parse save file'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read save file'));
        reader.readAsText(file);
    });
};
//#endregion
