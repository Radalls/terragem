import { emit } from '@/engine/services/emit';
import { createEntityTile } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEventTypes } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getComponent } from '@/engine/systems/entities';
import { gemAtCapacity, requestGemCarry, requestGemMove } from '@/engine/systems/gem';
import { addGemItem } from '@/engine/systems/item';
import { moveToTarget } from '@/engine/systems/position';
import { loadTileMapData } from '@/engine/systems/tilemap';
import { RenderEventTypes } from '@/render/events';

//#region SYSTEMS
//#region TILEMAP
export const generateTileMap = ({ tileMapId }: { tileMapId?: string | null }) => {
    if ((!(tileMapId))) tileMapId = getStore({ key: 'tileMapId' });

    generateTileMapLayers({ tileMapId });
};

const generateTileMapLayers = ({ tileMapId }: { tileMapId?: string | null }) => {
    if ((!(tileMapId))) tileMapId = getStore({ key: 'tileMapId' });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapId });

    const tileMapData = loadTileMapData({ tileMapName: tileMap._name });

    for (const layer of tileMapData.layers) {
        for (let i = 0; i < layer.height; i++) {
            for (let j = 0; j < tileMapData.width; j++) {
                const tileId = createEntityTile({
                    dropAmount: (tileMapData.layers.indexOf(layer) + 1) * 20, //TODO: remove magic
                    drops: layer.drops.map(({ rate, type }) => ({ _rate: rate, _type: type })),
                    x: j,
                    y: i,
                });

                tileMap.tiles.push(tileId);
            }
        }
    }
};
//#endregion

//#region TILE
export const selectTile = ({ tileId }: { tileId: string }) => {
    if (!(getState({ key: 'requestTile' }))) error({
        message: 'No request for tile selection was made',
        where: selectTile.name,
    });

    const tilePosition = getComponent({ componentId: 'Position', entityId: tileId });

    if (getState({ key: 'requestGemMove' })) {
        const gemId = getStore({ key: 'requestId' });

        requestGemMove({
            gemId,
            targetX: tilePosition._x,
            targetY: 0,
        });

        emit({ target: 'render', type: RenderEventTypes.MODE_BASE });
        emit({ entityId: gemId, target: 'engine', type: EngineEventTypes.GEM_MOVE_CONFIRM });
    }
    else if (getState({ key: 'requestGemCarryStart' }) || getState({ key: 'requestGemCarryTarget' })) {
        const gemId = getStore({ key: 'requestId' });
        const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

        requestGemCarry({
            gemId,
            x: tilePosition._x,
            y: gemPosition._y,
        });

        if (getState({ key: 'requestGemCarryTarget' })) {
            emit({ target: 'render', type: RenderEventTypes.MODE_BASE });
        }

        emit({
            entityId: gemId,
            target: 'engine',
            type: (getState({ key: 'requestGemCarryStart' }))
                ? EngineEventTypes.GEM_CARRY_CONFIRM_START
                : EngineEventTypes.GEM_CARRY_CONFIRM_TARGET,
        });
    }
};

export const mineTile = ({ tileId, gemId }: {
    gemId: string,
    tileId: string,
}) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemAtCapacity({ gemId })) {
        return false;
    }

    if (tile._dropAmount <= 0) {
        moveToTarget({ entityId: gemId, targetX: gemPosition._x, targetY: gemPosition._y + 1 });

        emit({ entityId: tileId, target: 'render', type: RenderEventTypes.TILE_DESTROY });

        return true;
    }
    else {
        tile._dropAmount--;

        const drop = rollTileDrop({ tileId });

        if (drop) {
            addGemItem({ amount: 1, gemId, type: drop });
        }

        return false;
    }
};

const rollTileDrop = ({ tileId }: { tileId: string }) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    const totalRate = tile.drops.reduce((acc, drop) => acc + drop._rate, 0);
    let roll = Math.random();

    if (roll > totalRate) {
        return null;
    }

    for (const drop of tile.drops) {
        if (roll < drop._rate) {
            return drop._type;
        }

        roll -= drop._rate;
    }

    return null;
};
//#endregion
//#endregion
