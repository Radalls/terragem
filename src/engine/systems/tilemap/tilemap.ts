import { Gems, TileMap } from '@/engine/components';
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
import { destroyTile, loadTileMapData, lockTile } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region SYSTEMS
//#region TILEMAP
//#region CONSTANTS
const TILEMAP_BASE_TILES_LOCKED = 10;
const TILEMAP_MIN_X_VARIATION = -2;
const TILEMAP_MAX_X_VARIATION = 2;
const TILEMAP_MIN_Y_VARIATION = -1;
const TILEMAP_MAX_Y_VARIATION = 1;
const TILEMAP_MIN_WIDTH_VARIATION = -1;
const TILEMAP_MAX_WIDTH_VARIATION = 2;
//#endregion

export const generateTileMap = ({ tileMapId, saveTileMap }: {
    saveTileMap?: TileMap,
    tileMapId?: string | null,
}) => {
    if ((!(tileMapId))) tileMapId = getStore({ key: 'tileMapId' });

    if (saveTileMap) {
        //TODO: handle save tiles

        // for (const tileId of saveTileMap.tiles) {
        //     createEntityTile({ tileId });
        // }
    }
    else {
        generateTileMapLayers({ tileMapId });
    }
};

const generateTileMapLayers = ({ tileMapId }: { tileMapId?: string | null }) => {
    if (!tileMapId) tileMapId = getStore({ key: 'tileMapId' });

    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapId });
    const tileMapData = loadTileMapData({ tileMapName: tileMap._name });

    let currentHeight = 0;
    for (let x = 0; x < tileMapData.width; x++) {
        const tileId = createEntityTile({
            density: 0,
            destroy: true,
            dropAmount: 0,
            drops: [],
            sprite: 'tile_ground',
            x,
            y: currentHeight,
        });
        tileMap.tiles.push(tileId);
    }
    currentHeight++;

    tileMapData.layers.forEach((layer, layerIndex) => {
        const tileGrid: string[][] = Array(layer.height).fill(null)
            .map(() => Array(tileMapData.width).fill(''));

        if (layer.resources) {
            layer.resources.forEach(res => {
                res.spawns.forEach(spawn => {
                    const baseY = spawn.startY;

                    spawn.points.forEach((point) => {
                        const varX = Math.floor(
                            Math.random()
                            * (TILEMAP_MAX_X_VARIATION - TILEMAP_MIN_X_VARIATION + 1)
                        ) + TILEMAP_MIN_X_VARIATION;

                        const varY = Math.floor(
                            Math.random()
                            * (TILEMAP_MAX_Y_VARIATION - TILEMAP_MIN_Y_VARIATION + 1)
                        ) + TILEMAP_MIN_Y_VARIATION;

                        const varWidth = Math.floor(
                            Math.random()
                            * (TILEMAP_MAX_WIDTH_VARIATION - TILEMAP_MIN_WIDTH_VARIATION + 1)
                        ) + TILEMAP_MIN_WIDTH_VARIATION;

                        const finalX = point.x + varX;
                        const finalY = baseY + point.y + varY;
                        const finalWidth = Math.max(1, point.width + varWidth);

                        for (let w = 0; w < finalWidth; w++) {
                            const tileX = finalX + w;
                            const tileY = finalY;

                            if (tileX >= 0 && tileX < tileMapData.width &&
                                tileY >= 0 && tileY < layer.height) {
                                tileGrid[tileY][tileX] = res.name;
                            }
                        }
                    });
                });
            });
        }

        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < tileMapData.width; x++) {
                let tileData = layer.ground;

                const resourceType = tileGrid[y][x];
                if (resourceType && layer.resources) {
                    const resource = layer.resources.find(res => res.name === resourceType);

                    if (resource) {
                        tileData = resource;
                    }
                }

                const dropAmount = Math.floor(Math.random()
                    * (tileData.dropAmount.max - tileData.dropAmount.min + 1))
                    + tileData.dropAmount.min;

                const tileId = createEntityTile({
                    density: layerIndex,
                    dropAmount,
                    drops: tileData.drops.map(({ rate, name }) => ({
                        _name: name,
                        _rate: rate,
                    })),
                    sprite: tileData.name,
                    x,
                    y: y + currentHeight,
                });

                tileMap.tiles.push(tileId);
            }
        }

        currentHeight += layer.height;
    });

    for (let k = 0; k < TILEMAP_BASE_TILES_LOCKED; k++) {
        const tileId = getTileAtPosition({ x: k, y: 1 });
        lockTile({ tileId });
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

    if (tile._lock) {
        return { stop: true };
    }

    if (tile._destroy) {
        if (gemType === Gems.MINE) {
            moveToTarget({ entityId: gemId, targetX: gemPosition._x, targetY: gemPosition._y + 1 });
        }

        return { destroy: true, stop: false };
    }

    if (gemHasItems(gem)) {
        if (isGemAtCapacity({ gemId })) {
            updateSprite({ entityId: gemId, image: `gem_${gemType.toLowerCase()}_error` });

            return { stop: false };
        }
    }

    const strength = getGemStat({ gemId, gemType, stat: '_digStrength' });
    if (strength < tile._density) {
        emit({
            data: { alert: true, text: `${gemId} is not strong enough to mine`, type: 'warning' },
            target: 'render',
            type: RenderEvents.INFO,
        });

        return { stop: true };
    }

    if (tile._dropAmount <= 0) {
        destroyTile({ tileId });

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

                updateSprite({ entityId: gemId, image: `gem_${gemType.toLowerCase()}` });

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
