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
    getGemSprite,
} from '@/engine/systems/gem';
import { addAdminItem, addGemItem, removeGemItem } from '@/engine/systems/item';
import { getGemsAtPosition, getTileAtPosition, moveToTarget } from '@/engine/systems/position';
import { updateSprite } from '@/engine/systems/sprite';
import { destroyTile, digTile, isGround, isLock, lockTile } from '@/engine/systems/tilemap';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS

//#endregion

//#region SYSTEMS
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

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
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
            data: { text: `${gem._name} is at destination`, type: 'confirm' },
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

        updateSprite({ entityId: gemId, image: getGemSprite({ gemId }) });

        return;
    }

    const mech = admin.mechs.find(mech => mech.includes(gemType.toUpperCase()));

    if (mech) {
        gem._mech = mech;
        admin.mechs.splice(admin.mechs.indexOf(mech), 1);

        updateSprite({ entityId: gemId, image: getGemSprite({ gemId }) });

        emit({
            data: { text: `Equipped ${gem._name} with ${gem._mech}`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else {
        emit({
            data: { alert: true, text: `No mech found for ${gem._name}`, type: 'warning' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};
//#endregion

//#region CARRY
//#region CONSTANTS
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

        const { tile } = getTileAtPosition({ x, y });
        tile.carry.push(gemId);

        emit({
            data: { text: `${gemCarry._name} carry start set`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (getState({ key: 'requestGemCarryTarget' })) {
        gemCarry._moveTargetX = x;
        gemCarry._moveTargetY = y;

        const { tile } = getTileAtPosition({ x, y });
        tile.carry.push(gemId);

        setGemRequest({ gemId, request: true });
        setGemAction({ action: 'work', gemId });

        emit({
            data: { text: `${gemCarry._name} carry target set`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};

export const stopGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    if (gemCarry._moveStartX && gemCarry._moveStartY) {
        const { tile: startTile } = getTileAtPosition({ x: gemCarry._moveStartX, y: gemCarry._moveStartY });
        startTile.carry.splice(startTile.carry.indexOf(gemId), 1);
    }

    if (gemCarry._moveTargetX && gemCarry._moveTargetY) {
        const { tile: targetTile } = getTileAtPosition({ x: gemCarry._moveTargetX, y: gemCarry._moveTargetY });
        targetTile.carry.splice(targetTile.carry.indexOf(gemId), 1);
    }

    gemCarry._moveTo = undefined;
    gemCarry._moveStartX = undefined;
    gemCarry._moveStartY = undefined;
    gemCarry._moveTargetX = undefined;
    gemCarry._moveTargetY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
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
            const item = removeGemItem({
                amount: getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' }),
                gemId: pickGemId,
            });

            if (item) {
                addGemItem({ amount: item.amount, gemId, name: item.name });

                updateSprite({ entityId: gemId, image: getGemSprite({ gemId }) });

                return true;
            }
            else {
                continue;
            }
        }
    }
    else {
        updateSprite({ entityId: gemId, image: getGemSprite({ error: true, gemId }) });
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

    if (!(pickGems.length)) {
        const { tile: gemTile } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y });
        if (gemTile._lift) {
            pickGems.push(gemTile._lift);
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

            updateSprite({ entityId: gemId, image: getGemSprite({ gemId }) });

            return true;
        }
        else {
            return false;
        }
    }
    else if (gemPosition._y === 0) {
        const { tile: gemCarryTile } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y + 1 });
        if (!(gemCarryTile._lock)) {
            updateSprite({ entityId: gemId, image: getGemSprite({ error: true, gemId }) });
            return false;
        }

        const item = removeGemItem({
            amount: getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' }),
            gemId,
        });

        if (item) {
            addAdminItem({ amount: item.amount, name: item.name });

            updateSprite({ entityId: gemId, image: getGemSprite({ gemId }) });

            emit({
                data: { amount: item.amount },
                entityId: gemId,
                target: 'engine',
                type: EngineEvents.GEM_CARRY_QUEST,
            });

            return true;
        }
        else {
            return false;
        }
    }
    else {
        updateSprite({ entityId: gemId, image: getGemSprite({ error: true, gemId }) });
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

    if (!(dropGems.length)) {
        const { tile: gemTile } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y });
        if (gemTile._lift) {
            if (!(isGemAtCapacity({ gemId: gemTile._lift }))) {
                dropGems.push({ gemId: gemTile._lift, priority: 1 });
            }
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
        gemCarry._moveStartX === undefined ||
        gemCarry._moveStartY === undefined ||
        gemCarry._moveTargetX === undefined ||
        gemCarry._moveTargetY === undefined
    ) throw error({
        message: `${gemId} has invalid carry target`,
        where: carryTo.name,
    });

    const gemCarryTarget = (gemCarry._moveTo === 'start')
        ? { x: gemCarry._moveStartX, y: gemCarry._moveStartY }
        : { x: gemCarry._moveTargetX, y: gemCarry._moveTargetY };

    if (gemCarry._moveTo === 'start' && !(isGemAt({ at: 'start', gemId }))) {
        const xDiff = gemCarryTarget.x - gemPosition._x;
        const yDiff = gemCarryTarget.y - gemPosition._y;

        if (Math.abs(yDiff) > 0) {
            const newY = gemPosition._y + Math.sign(yDiff);
            const { tile: targetTile } = getTileAtPosition({ x: gemPosition._x, y: newY });

            if (!(targetTile._destroy)) {
                stopGemCarry({ gemId });

                emit({
                    data: { alert: true, text: `${gemCarry._name} cannot reach start position`, type: 'error' },
                    entityId: gemId,
                    target: 'render',
                    type: RenderEvents.INFO,
                });

                return false;
            }

            gemPosition._y = newY;

            emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

            return false;
        }

        if (Math.abs(xDiff) > 0) {
            const newX = gemPosition._x + Math.sign(xDiff);
            const { tile: targetTile } = getTileAtPosition({ x: newX, y: gemPosition._y });

            if (!(targetTile._destroy)) {
                stopGemCarry({ gemId });

                emit({
                    data: { alert: true, text: `${gemCarry._name} cannot reach start position`, type: 'error' },
                    entityId: gemId,
                    target: 'render',
                    type: RenderEvents.INFO,
                });

                return false;
            }

            gemPosition._x = newX;

            emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

            return false;
        }

        return true;
    }

    const xDiff = gemCarryTarget.x - gemPosition._x;

    if (xDiff === 0) {
        return true;
    }

    const gemMoveTarget = {
        x: gemPosition._x + Math.sign(xDiff),
        y: gemPosition._y,
    };

    const { tile: gemMoveTargetTile } = getTileAtPosition({
        x: gemMoveTarget.x,
        y: gemMoveTarget.y,
    });

    if (!(gemMoveTargetTile._destroy)) {
        stopGemCarry({ gemId });

        emit({
            data: { alert: true, text: `${gemCarry._name} cannot carry to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    gemPosition._x = gemMoveTarget.x;
    gemPosition._y = gemMoveTarget.y;

    emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

    return isGemAt({ at: gemCarry._moveTo, gemId });
};

const xpGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    gemCarry._xp += 1;

    if (gemCarry._xp >= gemCarry._xpToNext) {
        gemCarry._xp = 0;
        gemCarry._xpLvl += 1;
        gemCarry._xpToNext = gemCarry._xpToNext * 1.5;

        gemCarry._itemCapacity += 1;

        if (gemCarry._xpLvl % 10 === 0) {
            gemCarry._itemSpeed += 0.5;
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

//#region FLOOR
//#region CONSTANTS
//#endregion

export const requestGemFloor = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemFloor = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
};

export const runGemFloor = ({ gemId }: { gemId: string }) => {
    const gemFloor = getComponent({ componentId: 'Floor', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._y <= 0) {
        emit({
            data: {
                alert: true,
                text: `${gemFloor._name} is too close to the surface to create a floor`,
                type: 'warning',
            },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemFloor({ gemId });
        return;
    }

    const { tileId: floorTileId } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y });
    floorTile({ gemId, tileId: floorTileId });
};

const floorTile = ({ gemId, tileId }: {
    gemId: string,
    tileId: string,
}) => {
    const gemFloor = getComponent({ componentId: 'Floor', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const tile = getComponent({ componentId: 'Tile', entityId: tileId });

    const { tile: aboveTile } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y - 1 });
    if (!(aboveTile._destroy)) {
        emit({
            data: { text: `${gemFloor._name} floor has reached a ceiling`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemFloor({ gemId });
        return;
    }

    const gemsAtPosition = getGemsAtPosition({ gemId, x: gemPosition._x, y: gemPosition._y });
    if (gemsAtPosition.length) {
        emit({
            data: { text: `${gemFloor._name} is blocked by other gems`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemFloor({ gemId });
        return;
    }

    if (tile._destroy) {
        const floorStrength = getGemStat({ gemId, gemType: Gems.FLOOR, stat: '_digStrength' });

        if (floorStrength < tile._density) {
            emit({
                data: { text: `${gemFloor._name} is not strong enough to floor this ground`, type: 'confirm' },
                entityId: gemId,
                target: 'render',
                type: RenderEvents.INFO,
            });

            stopGemFloor({ gemId });
            return;
        }
        else {
            gemPosition._y -= 1;

            emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

            destroyTile({ tileId, value: false });
            xpGemFloor({ gemId });
        }
    }
};

const xpGemFloor = ({ gemId }: { gemId: string }) => {
    const gemFloor = getComponent({ componentId: 'Floor', entityId: gemId });

    gemFloor._xp += 1;

    if (gemFloor._xp >= gemFloor._xpToNext) {
        gemFloor._xp = 0;
        gemFloor._xpLvl += 1;
        gemFloor._xpToNext = gemFloor._xpToNext * 1.5;

        if (gemFloor._xpLvl % 10 === 0) {
            gemFloor._digStrength += 1;
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
        const { tile: gemTile, tileId: gemTileId } = getTileAtPosition({
            x: gemLift._moveStartX,
            y: gemLift._moveStartY + 1,
        });

        if (
            gemTile._destroy
            || !(isGround({ tileId: gemTileId }))
            || isLock({ tileId: gemTileId })
            || gemTile._lift
        ) {
            emit({
                data: { alert: true, text: `${gemLift._name} cannot start a lift on this tile`, type: 'error' },
                entityId: gemId,
                target: 'render',
                type: RenderEvents.INFO,
            });

            emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });

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

    if (
        gemLift._moveTargetX === undefined
        || gemLift._moveTargetY === undefined
    ) throw error({
        message: `${gemId} has no lift target position`,
        where: stopGemLift.name,
    });

    if (gemLift._moveStartY >= GEM_LIFT_DISTANCE_FROM_GROUND) {
        const { tileId: gemTileId } = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY + 1 });
        lockTile({ tileId: gemTileId, value: false });
    }

    const { tile: gemLiftStartTile } = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY });
    gemLiftStartTile._lift = undefined;

    const { tile: gemLiftTargetTile } = getTileAtPosition({ x: gemLift._moveTargetX, y: gemLift._moveTargetY });
    gemLiftTargetTile._lift = undefined;

    gemLift._moveTo = undefined;
    gemLift._moveStartX = undefined;
    gemLift._moveStartY = undefined;
    gemLift._moveTargetX = undefined;
    gemLift._moveTargetY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
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
            data: {
                alert: true,
                text: `${gemLift._name} is too close to the surface to start a lift`,
                type: 'warning',
            },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemLift({ gemId });
        return;
    }

    xpGemLift({ gemId });

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

    const liftRange = getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemRange' });
    let liftMoveTargetDiff = 0;
    while (liftMoveTargetDiff < liftRange) {
        liftMoveTargetDiff++;
        gemLift._moveTargetY--;

        if (gemLift._moveTargetY <= 0) {
            gemLift._moveTargetY = 0;
            break;
        }

        const { tile: targetTile } = getTileAtPosition({ x: gemLift._moveTargetX, y: gemLift._moveTargetY });
        if (!(targetTile._destroy)) {
            gemLift._moveTargetY++;
            break;
        }
    }

    const { tile: startTile } = getTileAtPosition({ x: gemLift._moveStartX, y: gemLift._moveStartY });
    startTile._lift = gemId;

    const { tile: targetTile } = getTileAtPosition({ x: gemLift._moveTargetX, y: gemLift._moveTargetY });
    targetTile._lift = gemId;
};

const liftTo = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (!gemLift._moveTo) throw error({
        message: `${gemId} is not moving to a target`,
        where: liftTo.name,
    });

    if (
        gemLift._moveStartX === undefined ||
        gemLift._moveStartY === undefined ||
        gemLift._moveTargetX === undefined ||
        gemLift._moveTargetY === undefined
    ) throw error({
        message: `${gemId} has invalid lift target`,
        where: liftTo.name,
    });

    const gemLiftTarget = (gemLift._moveTo === 'start')
        ? { x: gemLift._moveStartX, y: gemLift._moveStartY }
        : { x: gemLift._moveTargetX, y: gemLift._moveTargetY };

    if (gemLift._moveTo === 'start' && !isGemAt({ at: 'start', gemId })) {
        const xDiff = gemLiftTarget.x - gemPosition._x;
        const yDiff = gemLiftTarget.y - gemPosition._y;

        if (Math.abs(xDiff) > 0) {
            const newX = gemPosition._x + Math.sign(xDiff);
            const { tile: targetTile } = getTileAtPosition({ x: newX, y: gemPosition._y });

            if (!(targetTile._destroy)) {
                stopGemLift({ gemId });
                emit({
                    data: { alert: true, text: `${gemLift._name} cannot reach start position`, type: 'error' },
                    entityId: gemId,
                    target: 'render',
                    type: RenderEvents.INFO,
                });
                return false;
            }

            gemPosition._x = newX;
            emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });
            return false;
        }

        if (Math.abs(yDiff) > 0) {
            const newY = gemPosition._y + Math.sign(yDiff);
            const { tile: targetTile } = getTileAtPosition({ x: gemPosition._x, y: newY });

            if (!(targetTile._destroy)) {
                stopGemLift({ gemId });
                emit({
                    data: { alert: true, text: `${gemLift._name} cannot reach start position`, type: 'error' },
                    entityId: gemId,
                    target: 'render',
                    type: RenderEvents.INFO,
                });
                return false;
            }

            gemPosition._y = newY;

            emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

            return false;
        }

        return true;
    }

    const yDiff = gemLiftTarget.y - gemPosition._y;

    if (yDiff === 0) {
        return true;
    }

    const gemMoveTarget = {
        x: gemPosition._x,
        y: gemPosition._y + Math.sign(yDiff),
    };

    const { tile: gemMoveTargetTile } = getTileAtPosition({
        x: gemMoveTarget.x,
        y: gemMoveTarget.y,
    });

    if (!(gemMoveTargetTile._destroy)) {
        stopGemLift({ gemId });

        emit({
            data: { alert: true, text: `${gemLift._name} cannot lift to target`, type: 'error' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return false;
    }

    gemPosition._x = gemMoveTarget.x;
    gemPosition._y = gemMoveTarget.y;

    emit({ entityId: gemId, target: 'render', type: RenderEvents.POSITION_UPDATE });

    return isGemAt({ at: gemLift._moveTo, gemId });
};

const xpGemLift = ({ gemId }: { gemId: string }) => {
    const gemLift = getComponent({ componentId: 'Lift', entityId: gemId });

    gemLift._xp += 1;

    if (gemLift._xp >= gemLift._xpToNext) {
        gemLift._xp = 0;
        gemLift._xpLvl += 1;
        gemLift._xpToNext = gemLift._xpToNext * 1.5;

        gemLift._itemCapacity += 1;
    }
};
//#endregion

//#region MINE
//#region CONSTANTS
//#endregion

export const requestGemMine = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemMine = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
};

export const runGemMine = ({ gemId }: { gemId: string }) => {
    const gemMine = getComponent({ componentId: 'Mine', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    const { tile: mineTile, tileId: mineTileId } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y + 1 });
    if (mineTile._lock) {
        emit({
            data: { alert: true, text: `${gemMine._name} cannot mine a locked tile`, type: 'warning' },
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
            target: 'render',
            type: RenderEvents.GEM_TOAST,
        });
        emit({
            data: { amount: 1, name: drop },
            entityId: gemId,
            target: 'engine',
            type: EngineEvents.GEM_MINE_QUEST,
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

        gemMine._itemCapacity += 1;

        if (gemMine._xpLvl % 10 === 0) {
            gemMine._digSpeed += 0.5;
        }
        else if (gemMine._xpLvl % 50 === 0) {
            gemMine._digAmount += 1;
        }
        else if (gemMine._xpLvl % 100 === 0) {
            gemMine._digStrength += 1;
        }
    }
};
//#endregion

//#region SHAFT
//#region CONSTANTS
const GEM_SHAFT_DISTANCE_FROM_GROUND = 4;
//#endregion

export const requestGemShaft = ({ gemId }: { gemId: string }) => {
    const gemShaft = getComponent({ componentId: 'Shaft', entityId: gemId });

    gemShaft._digOffset = 1;

    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemShaft = ({ gemId }: { gemId: string }) => {
    const gemShaft = getComponent({ componentId: 'Shaft', entityId: gemId });

    gemShaft._digOffset = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
};

export const runGemShaft = ({ gemId }: { gemId: string }) => {
    const gemShaft = getComponent({ componentId: 'Shaft', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._y < GEM_SHAFT_DISTANCE_FROM_GROUND) {
        emit({
            data: {
                alert: true,
                text: `${gemShaft._name} is too close to the surface to dig a shaft`,
                type: 'warning',
            },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemShaft({ gemId });
        return;
    }

    if (!(gemShaft._digOffset)) throw error({
        message: `${gemId} has no shaft offset`,
        where: runGemTunnel.name,
    });

    const digRange = getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digRange' });
    if (gemShaft._digOffset > digRange) {
        emit({
            data: { text: `${gemShaft._name} shaft has reached maximum range`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemShaft({ gemId });
        return;
    }

    if (gemPosition._y - gemShaft._digOffset <= 0) {
        emit({
            data: { text: `${gemShaft._name} shaft has reached the surface`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemShaft({ gemId });
        return;
    }

    const { tileId: tileUp } = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y - gemShaft._digOffset });

    const { destroy, stop } = digTile({ gemId, tileId: tileUp });
    if (stop) {
        stopGemShaft({ gemId });
    }
    else if (destroy) {
        gemShaft._digOffset++;
    }
    else {
        xpGemShaft({ gemId });
    }
};

const xpGemShaft = ({ gemId }: { gemId: string }) => {
    const gemShaft = getComponent({ componentId: 'Shaft', entityId: gemId });

    gemShaft._xp += 1;

    if (gemShaft._xp >= gemShaft._xpToNext) {
        gemShaft._xp = 0;
        gemShaft._xpLvl += 1;
        gemShaft._xpToNext = gemShaft._xpToNext * 1.5;

        gemShaft._digSpeed += 0.5;

        if (gemShaft._xpLvl % 10 === 0) {
            gemShaft._digRange += 1;
        }
        else if (gemShaft._xpLvl % 50 === 0) {
            gemShaft._digStrength += 1;
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

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_STOP });
};

export const runGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnel = getComponent({ componentId: 'Tunnel', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._y < GEM_TUNNEL_DISTANCE_FROM_GROUND) {
        emit({
            data: {
                alert: true,
                text: `${gemTunnel._name} is too close to the surface to dig a tunnel`,
                type: 'warning',
            },
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
            data: { text: `${gemTunnel._name} tunnel has reached maximum range`, type: 'confirm' },
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemTunnel({ gemId });
        return;
    }

    const { tileId: tileLeft } = getTileAtPosition({ x: gemPosition._x - gemTunnel._digOffset, y: gemPosition._y });
    const { tileId: tileRight } = getTileAtPosition({ x: gemPosition._x + gemTunnel._digOffset, y: gemPosition._y });

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

//#region WORK
//#region CONSTANTS
const gemWorks: Record<Gems, ({ gemId }: { gemId: string }) => void> = {
    [Gems.CARRY]: runGemCarry,
    [Gems.FLOOR]: runGemFloor,
    [Gems.LIFT]: runGemLift,
    [Gems.MINE]: runGemMine,
    [Gems.SHAFT]: runGemShaft,
    [Gems.TUNNEL]: runGemTunnel,
};
//#endregion

export const runGemWork = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });

    gemWorks[gemType]({ gemId });
};
//#endregion
//#endregion
