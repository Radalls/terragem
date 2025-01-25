import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

const tileMapFiles: Record<string, { default: TileMapData }>
    = import.meta.glob('/src/assets/data/maps/*.json', { eager: true });

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
            drops: {
                name: Items,
                rate: number,
            }[],
            name: string,
            spawns: {
                dropAmount: { max: number, min: number },
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
//#endregion

//#region DATA
export const loadTileMapData = ({ tileMapName }: { tileMapName: string }) => {
    const tileMapPath = `/src/assets/data/maps/${tileMapName}.json`;
    const tileMapData = tileMapFiles[tileMapPath].default
        ?? error({ message: `TileMapData for ${tileMapName} not found`, where: loadTileMapData.name });

    return tileMapData as TileMapData;
};
//#endregion
