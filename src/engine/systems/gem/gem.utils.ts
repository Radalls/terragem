import { GemTypes, State } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { checkComponent, getAdmin, getComponent } from '@/engine/systems/entities';
import { RenderEventTypes } from '@/render/events';

//#region UTILS
export const getGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gem = getComponent({ componentId: gemType, entityId: gemId });

    return gem;
};

export const getGemType = ({ gemId }: { gemId: string }) => {
    const isMine = checkComponent({ componentId: 'Mine', entityId: gemId });
    const isCarry = checkComponent({ componentId: 'Carry', entityId: gemId });

    if (!(isMine || isCarry)) error({
        message: `Gem ${gemId} has no type`,
        where: getGemType.name,
    });

    return (isMine)
        ? GemTypes.MINE
        : GemTypes.CARRY;
};

export const setGemRequest = ({ gemId, request }: {
    gemId: string,
    request: boolean,
}) => {
    const admin = getAdmin();

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._request = request;

    if (request) {
        admin.requests.push(gemId);
    }
    else {
        const index = admin.requests.indexOf(gemId);
        if (index > -1) admin.requests.splice(index, 1);
    }
};

export const setGemStore = ({ gemId, store }: {
    gemId: string,
    store: boolean,
}) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._store = store;
    setGemAction({ action: 'idle', gemId });

    emit({
        data: `${gemId} ${store ? 'stored' : 'deployed'}`,
        entityId: gemId,
        target: 'render',
        type: RenderEventTypes.INFO,
    });
};

export const setGemAction = ({ gemId, action }: {
    action: State['_action'],
    gemId: string,
}) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._action = action;
};

export const gemAtCapacity = ({ gemId }: { gemId: string }) => {
    const gem = getGem({ gemId });

    const gemItemCount = gem.items.reduce((acc, item) => acc + item._amount, 0);

    return (gemItemCount >= gem._itemCapacity);
};

export const gemCarryAt = ({ gemId, at }: {
    at: 'start' | 'target',
    gemId: string,
}) => {
    const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (at === 'start') {
        return (gemPosition._x === gemCarry._carryStartX && gemPosition._y === gemCarry._carryStartY);
    }
    else if (at === 'target') {
        return (gemPosition._x === gemCarry._carryTargetX && gemPosition._y === gemCarry._carryTargetY);
    }

    return false;
};

export const getGemActionSpeed = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemType === GemTypes.MINE) {
        const gemMine = getComponent({ componentId: 'Mine', entityId: gemId });

        const gemActionSpeed = (gemState._action === 'move')
            ? gemMine._moveSpeed
            : gemMine._mineSpeed;

        return gemActionSpeed;
    }
    else if (gemType === GemTypes.CARRY) {
        const gemCarry = getComponent({ componentId: 'Carry', entityId: gemId });

        const gemActionSpeed = (gemState._action === 'move')
            ? gemCarry._moveSpeed
            : (gemCarryAt({ at: 'start', gemId }) || gemCarryAt({ at: 'target', gemId }))
                ? gemCarry._carryPickSpeed
                : gemCarry._carrySpeed;

        return gemActionSpeed;
    }
    else {
        throw error({
            message: `Gem ${gemId} has no action speed`,
            where: getGemActionSpeed.name,
        });
    }
};
//#endregion
