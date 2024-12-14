import { ResourceTypes } from '@/engine/components/resource';
import { checkComponent, getComponent } from '@/engine/entities';
import { setCycle } from '@/engine/services/cycle';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { getStore, setStore } from '@/engine/services/store';
import { checkEnergy, useEnergy } from '@/engine/systems/energy';
import { playerHasActivityToolActive } from '@/engine/systems/inventory';
import { getResourceItem } from '@/engine/systems/resource';
import { event } from '@/render/events';

//#region CHECKS
export const canPlay = ({ activity, entityId, strict = true }: {
    activity?: ResourceTypes,
    entityId: string,
    strict: boolean,
}) => {
    let check = () => true;

    if (activity) {
        const _check = check;
        check = () => _check() && playerHasActivityToolActive({ activity, playerEntityId: entityId });
    }

    if (strict) {
        const _check = check;
        check = () => _check() && useEnergy({ amount: 1, entityId });
    }
    else {
        const _check = check;
        check = () => _check() && checkEnergy({ amount: 1, entityId });
    }

    return check();
};
//#endregion

//#region SERVICES
export const startActivity = ({ activityId }: { activityId: string }) => {
    if (checkComponent({ componentId: 'State', entityId: activityId })) {
        const state = getComponent({ componentId: 'State', entityId: activityId });
        if (state._cooldown) return;
    }

    setCycle('activityWinTickInterval', 2);
    setState('isActivityRunning', true);
    setStore('activityId', activityId);

    event({ type: EventTypes.ACTIVITY_START });
};

export const winActivity = ({ activityId }: { activityId?: string | null }) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: winActivity.name });

    const gotItem = getResourceItem({ resourceEntityId: activityId });
    if (!(gotItem)) {
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });
        return;
    }

    setState('isActivityWin', true);
    setState('isActivityInputCooldown', true);

    event({ type: EventTypes.ACTIVITY_WIN });
};

export const loseActivity = () => {
    setState('isActivityLose', true);
    setState('isActivityInputCooldown', true);

    event({ type: EventTypes.ACTIVITY_LOSE });
    event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });
};

export const endActivity = ({ activityId }: { activityId?: string | null }) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: endActivity.name });

    setState('isActivityRunning', false);
    setState('isActivityWin', false);
    setState('isActivityLose', false);
    setState('isActivityInputCooldown', false);

    event({ type: EventTypes.ACTIVITY_END });
};
//#endregion
