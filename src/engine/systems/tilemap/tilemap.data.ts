import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

const tileMapFiles: Record<string, { default: TileMapData }>
    = import.meta.glob('/src/assets/maps/*.json', { eager: true });

//#region TYPES
export type TileMapData = {
    height: number,
    layers: {
        drops: {
            name: Items,
            rate: number,
        }[],
        height: number,
    }[],
    name: string,
    width: number
};
//#endregion

//#region DATA
export const loadTileMapData = ({ tileMapName }: { tileMapName: string }) => {
    const tileMapPath = `/src/assets/maps/${tileMapName}.json`;
    const tileMapData = tileMapFiles[tileMapPath].default
        ?? error({ message: `TileMapData for ${tileMapName} not found`, where: loadTileMapData.name });

    return tileMapData as TileMapData;
};
//#endregion
