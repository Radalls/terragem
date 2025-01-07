import { Drop, Items } from '@/engine/components';
import { error } from '@/engine/services/error';

const tileMapFiles: Record<string, { default: TileMapData }>
    = import.meta.glob('/src/assets/maps/*.json', { eager: true });

//#region TYPES
export type TileMapData = {
    height: number,
    layers: {
        ground: {
            dropAmount: { max: number, min: number },
            drops: {
                name: Items,
                rate: number,
            }[],
            name: string,
        }
        height: number,
        resources: {
            dropAmount: { max: number, min: number },
            drops: {
                name: Items,
                rate: number,
            }[],
            name: string,
            spawns: {
                points: {
                    width: number,
                    x: number,
                    y: number,
                }[],
                startY: number,
            }[],
        }[],
    }[],
    name: string,
    width: number
};

export type TileData =
    | { tileId: string } & Record<keyof TileParams, never>
    | (TileParams & { tileId?: never })

type TileParams = {
    density: number;
    destroy?: boolean;
    dropAmount: number;
    drops: Drop[];
    sprite: string;
    x: number;
    y: number;
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
