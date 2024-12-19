import { emit } from '@/engine/services/emit';
import { createEntityTile } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getComponent } from '@/engine/systems/entity';
import { gemAtCapacity, requestGemCarry, requestGemMove } from '@/engine/systems/gem';
import { addGemItem } from '@/engine/systems/item';
import { moveToTarget } from '@/engine/systems/position';
import { loadTileMapData } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region SYSTEMS
//#region TILEMAP
//#region CONSTANTS
const TILEMAP_LAYER_DROP_AMOUNT = 20;
//#endregion

export const generateTileMap = ({ tileMapId }: { tileMapId?: string | null }) => {
    if ((!(tileMapId))) tileMapId = getStore({ key: 'tileMapId' });

    generateTileMapLayers({ tileMapId });
};

const generateTileMapLayers = ({ tileMapId }: { tileMapId?: string | null }) => {
    if ((!(tileMapId))) tileMapId = getStore({ key: 'tileMapId' });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapId });

    const tileMapData = loadTileMapData({ tileMapName: tileMap._name });

    let generatedHeight = 0;
    for (const layer of tileMapData.layers) {
        for (let i = generatedHeight; i < generatedHeight + layer.height; i++) {
            for (let j = 0; j < tileMapData.width; j++) {
                const layerIndex = tileMapData.layers.indexOf(layer) + 1;

                const tileId = createEntityTile({
                    density: layerIndex,
                    dropAmount: layerIndex * TILEMAP_LAYER_DROP_AMOUNT,
                    drops: layer.drops.map(({ rate, name }) => ({ _name: name, _rate: rate })),
                    sprite: `tile_tile${layerIndex}`,
                    x: j,
                    y: i,
                });

                tileMap.tiles.push(tileId);
            }
        }

        generatedHeight += layer.height;
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

        emit({ target: 'render', type: RenderEvents.MODE_BASE });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MOVE_CONFIRM });
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
            emit({ target: 'render', type: RenderEvents.MODE_BASE });
        }

        emit({
            entityId: gemId,
            target: 'engine',
            type: (getState({ key: 'requestGemCarryStart' }))
                ? EngineEvents.GEM_CARRY_CONFIRM_START
                : EngineEvents.GEM_CARRY_CONFIRM_TARGET,
        });
    }
};

export const mineTile = ({ tileId, gemId }: {
    gemId: string,
    tileId: string,
}) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });
    const gemMine = getComponent({ componentId: 'Mine', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemAtCapacity({ gemId })) {
        return { drop: undefined, stop: false };
    }

    if (gemMine._mineStrength < tile._density) {
        emit({
            data: `${gemId} is not strong enough to mine`,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        return { drop: undefined, stop: true };
    }

    if (tile._dropAmount <= 0) {
        moveToTarget({ entityId: gemId, targetX: gemPosition._x, targetY: gemPosition._y + 1 });

        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_DESTROY });

        return { drop: undefined, stop: false };
    }
    else {
        tile._dropAmount--;

        const drop = rollTileDrop({ tileId });

        if (drop) {
            addGemItem({ amount: 1, gemId, name: drop });

            return { drop, stop: false };
        }

        return { drop: undefined, stop: false };
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
            return drop._name;
        }

        roll -= drop._rate;
    }

    return null;
};
//#endregion
//#endregion
