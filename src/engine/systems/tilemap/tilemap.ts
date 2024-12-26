import { Gems } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { createEntityTile } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getComponent } from '@/engine/systems/entity';
import {
    gemHasItems,
    getGem,
    getGemStat,
    getGemType,
    isGemAtCapacity,
    requestGemCarry,
    requestGemMove,
} from '@/engine/systems/gem';
import { addGemItem } from '@/engine/systems/item';
import { getTileAtPosition, moveToTarget } from '@/engine/systems/position';
import { updateSprite } from '@/engine/systems/sprite';
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
    for (let j = 0; j < tileMapData.width; j++) {
        const tileId = createEntityTile({
            density: 0,
            destroy: true,
            dropAmount: 0,
            drops: [],
            x: j,
            y: generatedHeight,
        });

        tileMap.tiles.push(tileId);
    }
    generatedHeight++;

    for (const layer of tileMapData.layers) {
        for (let i = generatedHeight; i < generatedHeight + layer.height; i++) {
            for (let j = 0; j < tileMapData.width; j++) {
                const layerIndex = tileMapData.layers.indexOf(layer);

                const tileId = createEntityTile({
                    density: layerIndex,
                    dropAmount: (layerIndex + 1) * TILEMAP_LAYER_DROP_AMOUNT,
                    drops: layer.drops.map(({ rate, name }) => ({ _name: name, _rate: rate })),
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
export const selectTile = ({ selectedTileId }: { selectedTileId: string }) => {
    if (!(getState({ key: 'requestTile' }))) error({
        message: 'No request for tile selection was made',
        where: selectTile.name,
    });

    const selectedTilePosition = getComponent({ componentId: 'Position', entityId: selectedTileId });
    const targetTileId = getTileAtPosition({ x: selectedTilePosition._x, y: selectedTilePosition._y - 1 });
    const targetTile = getComponent({ componentId: 'Tile', entityId: targetTileId });
    const targetTilePosition = getComponent({ componentId: 'Position', entityId: targetTileId });

    if (getState({ key: 'requestGemMove' })) {
        const gemId = getStore({ key: 'requestId' });

        requestGemMove({
            gemId,
            targetX: targetTilePosition._x,
            targetY: (targetTile._destroy)
                ? targetTilePosition._y
                : 0,
        });

        emit({ target: 'render', type: RenderEvents.MODE_BASE });
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MOVE_CONFIRM });
    }
    else if (getState({ key: 'requestGemCarryStart' }) || getState({ key: 'requestGemCarryTarget' })) {
        const gemId = getStore({ key: 'requestId' });
        const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

        requestGemCarry({
            gemId,
            x: targetTilePosition._x,
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

export const digTile = ({ tileId, gemId }: {
    gemId: string,
    tileId: string,
}) => {
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const gemType = getGemType({ gemId });
    const gem = getGem({ gemId });

    if (tile._destroy) {
        if (gemType === Gems.MINE) {
            moveToTarget({ entityId: gemId, targetX: gemPosition._x, targetY: gemPosition._y + 1 });
        }

        return { destroy: true, stop: false };
    }

    if (gemHasItems(gem)) {
        if (isGemAtCapacity({ gemId })) {
            return { stop: false };
        }
    }

    const strength = getGemStat({ gemId, gemType, stat: '_digStrength' });
    if (strength < tile._density) {
        emit({
            data: `${gemId} is not strong enough to mine`,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        return { stop: true };
    }

    if (tile._dropAmount <= 0) {
        tile._destroy = true;

        updateSprite({ entityId: tileId, image: `tile_tile${tile._density}_destroy` });

        emit({ entityId: tileId, target: 'render', type: RenderEvents.TILE_DESTROY });

        return { stop: false };
    }
    else {
        tile._dropAmount--;

        if (gemType === Gems.MINE) {
            const drop = rollTileDrop({ tileId });

            if (drop) {
                addGemItem({
                    amount: getGemStat({ gemId, gemType: Gems.MINE, stat: '_digAmount' }),
                    gemId,
                    name: drop,
                });

                return { drop, stop: false };
            }
        }

        return { stop: false };
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
