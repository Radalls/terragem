import { Gems } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { checkComponent, getAdmin, getComponent } from '@/engine/systems/entity';
import {
    isGemAtCapacity,
    isGemAt,
    getGem,
    getGemType,
    setGemAction,
    setGemRequest,
    getGemStat,
    gemHasItems,
} from '@/engine/systems/gem';
import { addAdminItem, addGemItem, removeGemItem } from '@/engine/systems/item';
import { getGemsAtPosition, getTileAtPosition, moveToTarget } from '@/engine/systems/position';
import { updateSprite } from '@/engine/systems/sprite';
import { digTile, isGround, lockTile } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const runGemWork = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });

    if (gemType === Gems.MINE) {
        runGemMine({ gemId });
    }
    else if (gemType === Gems.CARRY) {
        runGemCarry({ gemId });
    }
    else if (gemType === Gems.TUNNEL) {
        runGemTunnel({ gemId });
    }
    else if (gemType === Gems.LIFT) {
        runGemLift({ gemId });
    }
};

//#region MOVE
export const requestGemMove = ({ gemId, targetX, targetY }: {
    gemId: string,
    targetX: number,
    targetY: number,
}) => {
    const gem = getGem({ gemId });

    gem._moveX = targetX;
    gem._moveY = targetY;

    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'move', gemId });
};

export const stopGemMove = ({ gemId }: { gemId: string }) => {
    const gem = getGem({ gemId });

    gem._moveX = undefined;
    gem._moveY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_MOVE_STOP });
};

export const runGemMove = ({ gemId }: { gemId: string }) => {
    const gem = getGem({ gemId });

    if ((gem._moveX === undefined) || (gem._moveY === undefined)) throw error({
        message: `${gemId} has invalid move target`,
        where: runGemMove.name,
    });

    const stopMove = moveToTarget({
        entityId: gemId,
        targetX: gem._moveX,
        targetY: gem._moveY,
    });

    if (stopMove) {
        emit({
            data: { text: `${gemId} is at destination`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemMove({ gemId });
    }
};
//#endregion

//#region EQUIP
export const equipGem = ({ gemId }: { gemId: string }) => {
    const admin = getAdmin();

    const gemType = getGemType({ gemId });
    const gem = getGem({ gemId });

    if (gem._mech) {
        admin.mechs.push(gem._mech.slice());
        gem._mech = undefined;

        updateSprite({ entityId: gemId, image: `gem_${gemType.toLowerCase()}` });

        return;
    }

    const mech = admin.mechs.find(mech => mech.includes(gemType.toUpperCase()));

    if (mech) {
        gem._mech = mech;
        admin.mechs.splice(admin.mechs.indexOf(mech), 1);

        updateSprite({ entityId: gemId, image: `mech_${gem._mech.toLowerCase()}` });

        emit({
            data: { text: `Equipped ${gemId} with ${gem._mech}`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else {
        emit({
            data: { alert: true, text: `No mech found for ${gemId}`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};
//#endregion

//#region MINE
//#region CONSTANTS
const GEM_MINE_DISTANCE_FROM_BASE = 10;
//#endregion

export const requestGemMine = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemMine = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_MINE_STOP });
};

export const runGemMine = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._x < GEM_MINE_DISTANCE_FROM_BASE && gemPosition._y === 0) {
        emit({
            data: { alert: true, text: `${gemId} is too close to the base to start mining`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemMine({ gemId });
        return;
    }

    const mineTileId = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y + 1 });
    const mineTile = getComponent({ componentId: 'Tile', entityId: mineTileId });

    if (mineTile._lock) {
        emit({
            data: { alert: true, text: `${gemId} cannot mine a locked tile`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemMine({ gemId });
        return;
    }

    const { drop, stop } = digTile({ gemId, tileId: mineTileId });

    if (drop) {
        xpGemMine({ gemId });

        emit({
            data: { amount: 1, name: drop },
            entityId: gemId,
            target: 'engine',
            type: EngineEvents.GEM_MINE,
        });
    }

    if (stop) {
        stopGemMine({ gemId });
    }
};

const xpGemMine = ({ gemId }: { gemId: string }) => {
    const gemMine = getComponent({ componentId: 'Mine', entityId: gemId });

    gemMine._xp += 1;

    if (gemMine._xp >= gemMine._xpToNext) {
        gemMine._xp = 0;
        gemMine._xpLvl += 1;
        gemMine._xpToNext = gemMine._xpToNext * 1.5;

        gemMine._digSpeed += 0.5;

        if (gemMine._xpLvl % 10 === 0) {
            gemMine._itemCapacity += 1;
        }
        else if (gemMine._xpLvl % 50 === 0) {
            gemMine._digStrength += 1;
        }
        else if (gemMine._xpLvl % 100 === 0) {
            gemMine._digAmount += 1;
        }
    }
};
//#endregion

//#region CARRY
//#region CONSTANTS
const GEM_CARRY_X_DISTANCE_FROM_BASE = 10;
//#endregion

export const requestGemCarry = ({ gemId, x, y }: {
    gemId: string,
    x: number,
    y: number,
}) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    if (getState({ key: 'requestGemCarryStart' })) {
        gemCarry._moveTo = 'start';
        gemCarry._moveStartX = x;
        gemCarry._moveStartY = y;

        emit({
            data: { text: `${gemId} carry start set`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (getState({ key: 'requestGemCarryTarget' })) {
        gemCarry._moveTargetX = x;
        gemCarry._moveTargetY = y;

        setGemRequest({ gemId, request: true });
        setGemAction({ action: 'work', gemId });

        emit({
            data: { text: `${gemId} carry target set`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};

export const stopGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    gemCarry._moveTo = undefined;
    gemCarry._moveStartX = undefined;
    gemCarry._moveStartY = undefined;
    gemCarry._moveTargetX = undefined;
    gemCarry._moveTargetY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_CARRY_STOP });
};

export const runGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    if (isGemAt({ at: 'start', gemId })) {
        if (!(isGemAtCapacity({ gemId }))) {
            const pick = runGemCarryPick({ gemId });

            if (pick) {
                return;
            }
        }
    }
    else if (isGemAt({ at: 'target', gemId })) {
        const drop = runGemCarryDrop({ gemId });

        if (drop) {
            xpGemCarry({ gemId });
            return;
        }
    }

    const switchCarry = carryTo({ gemId });

    if (switchCarry) {
        gemCarry._moveTo = (gemCarry._moveTo === 'start')
            ? 'target'
            : 'start';
    }
};

const runGemCarryPick = ({ gemId }: { gemId: string }) => {
    if (!(isGemAt({ at: 'start', gemId }))) throw error({
        message: `${gemId} is not at start`,
        where: runGemCarryPick.name,
    });

    if (isGemAtCapacity({ gemId })) throw error({
        message: `${gemId} is at capacity`,
        where: runGemCarryPick.name,
    });

    const pickGems = findGemCarryPicks({ gemId });
    if (pickGems.length) {
        for (const pickGemId of pickGems) {
            const pickGemType = getGemType({ gemId: pickGemId });

            const item = removeGemItem({
                amount: getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' }),
                gemId: pickGemId,
            });

            if (item) {
                if (pickGemType === Gems.LIFT) {
                    xpGemLift({ gemId: pickGemId });
                }

                addGemItem({ amount: item.amount, gemId, name: item.name });

                updateSprite({ entityId: gemId, image: 'gem_carry' });

                return true;
            }
            else {
                continue;
            }
        }
    }
    else {
        updateSprite({ entityId: gemId, image: 'gem_carry_error' });

        return false;
    }

    return false;
};

const findGemCarryPicks = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    const itemRange = getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemRange' });
    const pickGems: string[] = [];
    for (let y = gemPosition._y; y < gemPosition._y + itemRange; y++) {
        const gemsAtPosition = getGemsAtPosition({ gemId, x: gemPosition._x, y });

        for (const g of gemsAtPosition) {
            const gemType = getGemType({ gemId: g });

            if (gemType === Gems.CARRY) continue;

            const gem = getGem({ gemId: g });

            if (gemHasItems(gem)) {
                pickGems.push(g);
            }
        }
    }

    return pickGems;
};

const runGemCarryDrop = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (!(isGemAt({ at: 'target', gemId }))) throw error({
        message: `${gemId} is not at target`,
        where: runGemCarryDrop.name,
    });

    if (!(gemCarry.items.length)) {
        return false;
    }

    const dropGems = findGemCarryDrops({ gemId });
    if (dropGems.length) {
        const priorityDropGem = dropGems.sort((a, b) => {
            return a.priority - b.priority;
        })[0];

        const item = removeGemItem({
            amount: getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' }),
            gemId,
        });

        if (item) {
            addGemItem({
                amount: item.amount,
                gemId: priorityDropGem.gemId,
                name: item.name,
            });

            return true;
        }
        else {
            return false;
        }
    }
    else if (
        gemPosition._x < GEM_CARRY_X_DISTANCE_FROM_BASE
        && gemPosition._y === 0
    ) {
        const item = removeGemItem({
            amount: getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' }),
            gemId,
        });

        if (item) {
            addAdminItem({ amount: item.amount, name: item.name });

            emit({
                data: { amount: item.amount },
                entityId: gemId,
                target: 'engine',
                type: EngineEvents.GEM_CARRY,
            });

            return true;
        }
        else {
            return false;
        }
    }
    else {
        updateSprite({ entityId: gemId, image: 'gem_carry_error' });

        return false;
    }
};

const findGemCarryDrops = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    const dropGems: { gemId: string, priority: number }[] = [];
    const gemsAtPosition = getGemsAtPosition({ gemId, x: gemPosition._x, y: gemPosition._y });
    for (const g of gemsAtPosition) {
        const gemType = getGemType({ gemId: g });

        if (gemType === Gems.CARRY) continue;

        const gem = getGem({ gemId: g });

        if (!(gemHasItems(gem))) continue;
        if (isGemAtCapacity({ gemId: g })) continue;

        if (checkComponent({ componentId: Gems.LIFT, entityId: g })) {
            dropGems.push({ gemId: g, priority: 1 });
        }
    }

    return dropGems;
};

const carryTo = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (!(gemCarry._moveTo)) throw error({
        message: `${gemId} is not moving to a target`,
        where: carryTo.name,
    });

    if (
        (gemCarry._moveStartX === undefined)
        || (gemCarry._moveStartY === undefined)
        || (gemCarry._moveTargetX === undefined)
        || (gemCarry._moveTargetY === undefined)
    ) throw error({
        message: `${gemId} has invalid carry target`,
        where: carryTo.name,
    });

    const gemCarryTarget = (gemCarry._moveTo === 'start')
        ? { x: gemCarry._moveStartX, y: gemCarry._moveStartY }
        : { x: gemCarry._moveTargetX, y: gemCarry._moveTargetY };

    const xDiff = gemCarryTarget.x - gemPosition._x;
    const yDiff = gemCarryTarget.y - gemPosition._y;

    if (Math.abs(yDiff) > 0) {
        stopGemCarry({ gemId });

        emit({
            data: { alert: true, text: `${gemId} cannot carry to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    const gemMoveTarget = {
        x: (xDiff > 0)
            ? gemPosition._x + 1
            : gemPosition._x - 1,
        y: gemPosition._y,
    };

    const gemMoveTargetTileId = getTileAtPosition({ x: gemMoveTarget.x, y: gemMoveTarget.y });
    const gemMoveTargetTile = getComponent({ componentId: 'Tile', entityId: gemMoveTargetTileId });

    if (!(gemMoveTargetTile._destroy)) {
        stopGemCarry({ gemId });

        emit({
            data: { alert: true, text: `${gemId} cannot carry to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    gemPosition._x = gemMoveTarget.x;
    gemPosition._y = gemMoveTarget.y;

    emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

    return (isGemAt({ at: 'start', gemId }) || isGemAt({ at: 'target', gemId }));
};

const xpGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    gemCarry._xp += 1;

    if (gemCarry._xp >= gemCarry._xpToNext) {
        gemCarry._xp = 0;
        gemCarry._xpLvl += 1;
        gemCarry._xpToNext = gemCarry._xpToNext * 1.5;

        gemCarry._itemSpeed += 0.5;

        if (gemCarry._xpLvl % 10 === 0) {
            gemCarry._itemCapacity += 1;
        }
        else if (gemCarry._xpLvl % 50 === 0) {
            gemCarry._itemAmount += 1;
        }
        else if (gemCarry._xpLvl % 100 === 0) {
            gemCarry._itemRange += 1;
        }
    }
};
//#endregion

//#region TUNNEL
//#region CONSTANTS
const GEM_TUNNEL_DISTANCE_FROM_GROUND = 4;
//#endregion

export const requestGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnel = getComponent({ componentId: 'Tunnel', entityId: gemId });

    gemTunnel._digOffset = 1;

    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnel = getComponent({ componentId: 'Tunnel', entityId: gemId });

    gemTunnel._digOffset = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_TUNNEL_STOP });
};

export const runGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnel = getComponent({ componentId: 'Tunnel', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._y < GEM_TUNNEL_DISTANCE_FROM_GROUND) {
        emit({
            data: { alert: true, text: `${gemId} is too close to the surface to dig a tunnel`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemTunnel({ gemId });
        return;
    }

    if (!(gemTunnel._digOffset)) throw error({
        message: `${gemId} has no tunnel offset`,
        where: runGemTunnel.name,
    });

    const digRange = getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digRange' });
    if (gemTunnel._digOffset > digRange) {
        emit({
            data: { text: `${gemId} tunnel has reached maximum range`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemTunnel({ gemId });
        return;
    }

    const tileLeft = getTileAtPosition({ x: gemPosition._x - gemTunnel._digOffset, y: gemPosition._y });
    const tileRight = getTileAtPosition({ x: gemPosition._x + gemTunnel._digOffset, y: gemPosition._y });

    const { destroy: destroyLeft, stop: stopLeft } = digTile({ gemId, tileId: tileLeft });
    const { destroy: destroyRight, stop: stopRight } = digTile({ gemId, tileId: tileRight });

    if (stopLeft || stopRight) {
        stopGemTunnel({ gemId });
    }
    else if (destroyLeft && destroyRight) {
        gemTunnel._digOffset++;
    }
    else {
        xpGemTunnel({ gemId });
    }
};

const xpGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnel = getComponent({ componentId: 'Tunnel', entityId: gemId });

    gemTunnel._xp += 1;

    if (gemTunnel._xp >= gemTunnel._xpToNext) {
        gemTunnel._xp = 0;
        gemTunnel._xpLvl += 1;
        gemTunnel._xpToNext = gemTunnel._xpToNext * 1.5;

        gemTunnel._digSpeed += 0.5;

        if (gemTunnel._xpLvl % 10 === 0) {
            gemTunnel._digRange += 1;
        }
        else if (gemTunnel._xpLvl % 50 === 0) {
            gemTunnel._digStrength += 1;
        }
    }
};
//#endregion

//#region LIFT
//#region CONSTANTS
const GEM_LIFT_DISTANCE_FROM_GROUND = 4;
//#endregion

export const requestGemLift = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    gemLift._moveTo = 'start';
    gemLift._moveStartX = gemPosition._x;
    gemLift._moveStartY = gemPosition._y;

    if (gemLift._moveStartY >= GEM_LIFT_DISTANCE_FROM_GROUND) {
        const gemTileId = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY + 1 });
        const gemTile = getComponent({ componentId: 'Tile', entityId: gemTileId });

        if (gemTile._destroy || !(isGround({ tileId: gemTileId }))) {
            emit({
                data: { alert: true, text: `${gemId} is not on ground`, type: 'error' },
                entityId: gemId,
                target: 'render',
                type: RenderEvents.INFO,
            });

            emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_LIFT_STOP });

            return;
        }

        lockTile({ tileId: gemTileId, value: true });
    }

    setGemLiftTarget({ gemId });

    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemLift = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });

    if (
        gemLift._moveStartX === undefined
        || gemLift._moveStartY === undefined
    ) throw error({
        message: `${gemId} has no lift start position`,
        where: stopGemLift.name,
    });

    if (gemLift._moveStartY >= GEM_LIFT_DISTANCE_FROM_GROUND) {
        const gemTileId = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY + 1 });
        lockTile({ tileId: gemTileId, value: false });
    }

    gemLift._moveTo = undefined;
    gemLift._moveStartX = undefined;
    gemLift._moveStartY = undefined;
    gemLift._moveTargetX = undefined;
    gemLift._moveTargetY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_LIFT_STOP });
};

export const runGemLift = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });

    if (
        (gemLift._moveStartX === undefined)
        || (gemLift._moveStartY === undefined)
        || (gemLift._moveTargetX === undefined)
        || (gemLift._moveTargetY === undefined)
    ) throw error({
        message: `${gemId} has invalid lift target`,
        where: runGemLift.name,
    });

    if (gemLift._moveStartY < GEM_LIFT_DISTANCE_FROM_GROUND) {
        emit({
            data: { alert: true, text: `${gemId} is too close to the surface to start a lift`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemLift({ gemId });
        return;
    }

    if (isGemAt({ at: 'start', gemId })) {
        if (!(isGemAtCapacity({ gemId }))) {
            return;
        }
    }
    else if (isGemAt({ at: 'target', gemId })) {
        if (!(gemLift.items.length === 0)) {
            return;
        }
    }

    const switchCarry = liftTo({ gemId });

    if (switchCarry) {
        gemLift._moveTo = (gemLift._moveTo === 'start')
            ? 'target'
            : 'start';
    }
};

const setGemLiftTarget = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });

    if (gemLift._moveStartX === undefined || gemLift._moveStartY === undefined) throw error({
        message: `${gemId} has no lift start position`,
        where: setGemLiftTarget.name,
    });

    gemLift._moveTargetX = gemLift._moveStartX;
    gemLift._moveTargetY = gemLift._moveStartY;

    while (gemLift._moveTargetY > 0) {
        gemLift._moveTargetY--;

        const targetTileId = getTileAtPosition({ x: gemLift._moveTargetX, y: gemLift._moveTargetY });

        if (!targetTileId) continue;

        const targetTile = getComponent({ componentId: 'Tile', entityId: targetTileId });

        if (!targetTile._destroy) {
            gemLift._moveTargetY++;
            break;
        }
    }
};

const liftTo = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (!(gemLift._moveTo)) throw error({
        message: `${gemId} is not moving to a target`,
        where: liftTo.name,
    });

    if (
        (gemLift._moveStartX === undefined)
        || (gemLift._moveStartY === undefined)
        || (gemLift._moveTargetX === undefined)
        || (gemLift._moveTargetY === undefined)
    ) throw error({
        message: `${gemId} has invalid lift target`,
        where: liftTo.name,
    });

    const gemLiftTarget = (gemLift._moveTo === 'start')
        ? { x: gemLift._moveStartX, y: gemLift._moveStartY }
        : { x: gemLift._moveTargetX, y: gemLift._moveTargetY };

    const xDiff = gemLiftTarget.x - gemPosition._x;
    const yDiff = gemLiftTarget.y - gemPosition._y;

    if (Math.abs(xDiff) > 0) {
        stopGemLift({ gemId });

        emit({
            data: { alert: true, text: `${gemId} cannot lift to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    const gemMoveTarget = {
        x: gemPosition._x,
        y: (yDiff > 0)
            ? gemPosition._y + 1
            : gemPosition._y - 1,
    };

    const gemMoveTargetTileId = getTileAtPosition({ x: gemMoveTarget.x, y: gemMoveTarget.y });
    const gemMoveTargetTile = getComponent({ componentId: 'Tile', entityId: gemMoveTargetTileId });

    if (!(gemMoveTargetTile._destroy)) {
        stopGemLift({ gemId });

        emit({
            data: { alert: true, text: `${gemId} cannot lift to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    gemPosition._x = gemMoveTarget.x;
    gemPosition._y = gemMoveTarget.y;

    emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

    return (isGemAt({ at: 'start', gemId }) || isGemAt({ at: 'target', gemId }));
};

const xpGemLift = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });

    gemLift._xpLvl += 1;

    if (gemLift._xp >= gemLift._xpToNext) {
        gemLift._xp = 0;
        gemLift._xpLvl += 1;
        gemLift._xpToNext = gemLift._xpToNext * 1.5;

        gemLift._itemSpeed += 0.5;

        if (gemLift._xpLvl % 10 === 0) {
            gemLift._itemCapacity += 1;
        }
        else if (gemLift._xpLvl % 50 === 0) {
            gemLift._itemAmount += 1;
        }
    }
};
//#endregion
//#endregion
