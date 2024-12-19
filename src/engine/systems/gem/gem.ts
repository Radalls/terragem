import { Gems } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getComponent } from '@/engine/systems/entity';
import { gemAtCapacity, gemCarryAt, getGem, getGemType, setGemAction, setGemRequest } from '@/engine/systems/gem';
import { addAdminItem, addGemItem, removeGemItem } from '@/engine/systems/item';
import { getGemAtPosition, getTileAtPosition, moveToTarget } from '@/engine/systems/position';
import { mineTile } from '@/engine/systems/tilemap';
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
            data: `${gemId} is at destination`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });

        stopGemMove({ gemId });
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
    const mineTileId = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y });

    if (gemPosition._x < GEM_MINE_DISTANCE_FROM_BASE) {
        emit({
            data: `${gemId} is too close to the base to start mining`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        stopGemMine({ gemId });
        return;
    }

    const { drop, stop } = mineTile({ gemId, tileId: mineTileId });

    if (drop) {
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
//#endregion

//#region CARRY
//#region CONSTANTS
const GEM_CARRY_PICK_AMOUNT = 1;
const GEM_CARRY_DROP_AMOUNT = 1;
const GEM_CARRY_SOURCE_SEARCH_RANGE = 10;
//#endregion

export const requestGemCarry = ({ gemId, x, y }: {
    gemId: string,
    x: number,
    y: number,
}) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    if (getState({ key: 'requestGemCarryStart' })) {
        gemCarry._carryTo = 'start';
        gemCarry._carryStartX = x;
        gemCarry._carryStartY = y;

        emit({
            data: `${gemId} carry start set`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
    else if (getState({ key: 'requestGemCarryTarget' })) {
        gemCarry._carryTargetX = x;
        gemCarry._carryTargetY = y;

        setGemRequest({ gemId, request: true });
        setGemAction({ action: 'work', gemId });

        emit({
            data: `${gemId} carry target set`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};

export const stopGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    gemCarry._carryTo = undefined;
    gemCarry._carryStartX = undefined;
    gemCarry._carryStartY = undefined;
    gemCarry._carryTargetX = undefined;
    gemCarry._carryTargetY = undefined;

    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_CARRY_STOP });
};

export const runGemCarry = ({ gemId }: { gemId: string }) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

    if (
        (gemCarry._carryStartX === undefined)
        || (gemCarry._carryStartY === undefined)
        || (gemCarry._carryTargetX === undefined)
        || (gemCarry._carryTargetY === undefined)
    ) throw error({
        message: `${gemId} has invalid carry target`,
        where: runGemCarry.name,
    });

    if (gemCarryAt({ at: 'start', gemId })) {
        if (!(gemAtCapacity({ gemId }))) {
            const pick = runGemCarryPick({ gemId });
            if (pick) {
                return;
            }
        }
    }
    else if (gemCarryAt({ at: 'target', gemId })) {
        const drop = runGemCarryDrop({ gemId });
        if (drop) {
            return;
        }
    }

    const switchCarry = moveToTarget({
        entityId: gemId,
        targetX: (gemCarry._carryTo === 'start')
            ? gemCarry._carryStartX
            : gemCarry._carryTargetX,
        targetY: (gemCarry._carryTo === 'start')
            ? gemCarry._carryStartY
            : gemCarry._carryTargetY,
    });

    if (switchCarry) {
        gemCarry._carryTo = (gemCarry._carryTo === 'start')
            ? 'target'
            : 'start';
    }
};

const runGemCarryPick = ({ gemId }: { gemId: string }) => {
    if (!(gemCarryAt({ at: 'start', gemId }))) throw error({
        message: `${gemId} is not at start`,
        where: runGemCarryPick.name,
    });

    if (gemAtCapacity({ gemId })) throw error({
        message: `${gemId} is at capacity`,
        where: runGemCarryPick.name,
    });

    const gemSourceId = findGemCarrySource({ gemId });
    if (gemSourceId) {
        const gemSource = getGem({ gemId: gemSourceId });

        if (gemSource.items.length) {
            const item = removeGemItem({ amount: GEM_CARRY_PICK_AMOUNT, gemId: gemSourceId });

            if (item) {
                addGemItem({ amount: item.amount, gemId, name: item.name });
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else {
        emit({
            data: `${gemId} has not found any items to pick up`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        return false;
    }
};

const findGemCarrySource = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    let gemSource;
    for (let y = gemPosition._y; y < gemPosition._y + GEM_CARRY_SOURCE_SEARCH_RANGE; y++) {
        const gem = getGemAtPosition({ gemId, x: gemPosition._x, y });

        if (gem) {
            gemSource = gem;
            break;
        }
    }

    return gemSource;
};

const runGemCarryDrop = ({ gemId }: { gemId: string }) => {
    if (!(gemCarryAt({ at: 'target', gemId }))) throw error({
        message: `${gemId} is not at target`,
        where: runGemCarryDrop.name,
    });

    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (!(gemCarry.items.length)) {
        return false;
    }

    if (gemPosition._x < 10) {
        const item = removeGemItem({ amount: GEM_CARRY_DROP_AMOUNT, gemId });

        if (item) {
            addAdminItem({ amount: item.amount, name: item.name });

            emit({
                data: { amount: GEM_CARRY_DROP_AMOUNT },
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
        emit({
            data: `${gemId} is too far from the base to drop items`,
            entityId: gemId,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        return false;
    }
};
//#endregion
//#endregion
