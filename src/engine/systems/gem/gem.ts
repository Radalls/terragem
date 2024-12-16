import { GemTypes } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getState } from '@/engine/services/state';
import { getComponent } from '@/engine/systems/entities';
import { gemAtCapacity, gemCarryAt, getGem, getGemType, setGemAction, setGemRequest } from '@/engine/systems/gem';
import { addAdminItem, addGemItem, removeGemItem } from '@/engine/systems/item';
import { getGemAtPosition, getTileAtPosition, moveToTarget } from '@/engine/systems/position';
import { mineTile } from '@/engine/systems/tilemap';
import { RenderEventTypes } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const runGemWork = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });

    if (gemType === GemTypes.MINE) {
        runGemMine({ gemId });
    }
    else if (gemType === GemTypes.CARRY) {
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

    emit({ entityId: gemId, target: 'render', type: RenderEventTypes.GEM_MOVE_STOP });
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
            type: RenderEventTypes.INFO,
        });

        stopGemMove({ gemId });
    }
};
//#endregion

//#region MINE
export const requestGemMine = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (gemPosition._x < 10) {
        emit({
            data: `${gemId} is too close to the base to start mining`,
            entityId: gemId,
            target: 'render',
            type: RenderEventTypes.INFO_ALERT,
        });

        stopGemMine({ gemId });
        return;
    }

    setGemRequest({ gemId, request: true });
    setGemAction({ action: 'work', gemId });
};

export const stopGemMine = ({ gemId }: { gemId: string }) => {
    setGemRequest({ gemId, request: false });
    setGemAction({ action: 'idle', gemId });

    emit({ entityId: gemId, target: 'render', type: RenderEventTypes.GEM_MINE_STOP });
};

export const runGemMine = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const mineTileId = getTileAtPosition({ x: gemPosition._x, y: gemPosition._y });

    const stopMine = mineTile({ gemId, tileId: mineTileId });

    if (stopMine) {
        return;

        emit({
            data: `${gemId} stopped mining`,
            entityId: gemId,
            target: 'render',
            type: RenderEventTypes.INFO,
        });

        stopGemMine({ gemId });
    }
};
//#endregion

//#region CARRY
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
            type: RenderEventTypes.INFO,
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
            type: RenderEventTypes.INFO,
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

    emit({ entityId: gemId, target: 'render', type: RenderEventTypes.GEM_CARRY_STOP });
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
            const item = removeGemItem({ amount: 1, gemId: gemSourceId }); //TODO: remove magic

            if (item) {
                addGemItem({ amount: item.amount, gemId, type: item.type });
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
            type: RenderEventTypes.INFO_ALERT,
        });

        return false;
    }
};

const findGemCarrySource = ({ gemId }: { gemId: string }) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    let gemSource;
    for (let y = gemPosition._y; y < gemPosition._y + 9; y++) { //TODO: remove magic
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
        const item = removeGemItem({ amount: 1, gemId }); //TODO: remove magic

        if (item) {
            addAdminItem({ amount: item.amount, type: item.type });
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
            type: RenderEventTypes.INFO_ALERT,
        });

        return false;
    }
};
//#endregion
//#endregion
