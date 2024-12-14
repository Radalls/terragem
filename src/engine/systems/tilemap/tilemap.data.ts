import { error } from '@/engine/services/error';

const tileMapFiles: Record<string, { default: TileMapData }>
    = import.meta.glob('/src/assets/maps/*.json', { eager: true });

//#region TYPES
export type TileMapData = {
    entities: {
        items?: { name: string, rate: number }[],
        name?: string,
        type: string,
        x: number,
        y: number,
    }[],
    height: number,
    id: number,
    name: string,
    tiles: {
        exits?: {
            direction: 'up' | 'down' | 'left' | 'right',
            map: string,
            x: number,
            y: number
        }[],
        solid?: boolean,
        sound?: string,
        x: number,
        y: number
    }[],
    width: number
};
//#endregion

//#region DATA
export const loadTileMapData = ({ tileMapName }: { tileMapName: string }) => {
    const tileMapPath = `/src/assets/maps/${tileMapName.toLowerCase()}.json`;
    const tileMapData = tileMapFiles[tileMapPath].default
        ?? error({ message: `TileMapData for ${tileMapName} not found`, where: loadTileMapData.name });

    return tileMapData as TileMapData;
};
//#endregion
