import { getResourceData } from '../resource.data';

import { canPlay, loseActivity, startActivity, winActivity } from './activity';

import { ActivityBugData } from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { clearCycle, setCooldown, setCycle } from '@/engine/services/cycle';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { consumeFirstKeyPress } from '@/engine/services/input';
import { getState, setState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { playerInventoryFull } from '@/engine/systems/inventory';
import { setEntityCooldown } from '@/engine/systems/state';
import { event } from '@/render/events';

//#region SERVICES
export const onActivityBugInput = ({ inputKey, activityId, managerEntityId }: {
    activityId?: string | null,
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onActivityBugInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: onActivityBugInput.name });

    if (inputKey === manager.settings.keys.action._back) {
        loseActivityBug({ activityId });
    }
    else {
        playActivityBug({ activityId, symbol: inputKey });
    }
};

export const startActivityBug = ({ activityId, playerEntityId }: {
    activityId: string,
    playerEntityId?: string | null,
}) => {
    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });

    if (!(activityResource.item)) {
        throw error({ message: `Resource ${activityId} does not have an item`, where: startActivityBug.name });
    }

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: startActivityBug.name });

    if (!(canPlay({ activity: activityResource._type, entityId: playerEntityId, strict: false }))) {
        event({ data: { message: 'Je ne peux pas faire ça maintenant' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Player can't play activity ${activityResource._type}`,
            where: startActivityBug.name,
        });
    }
    if (playerInventoryFull({ item: activityResource.item })) {
        event({ data: { message: 'Mon sac est plein' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Player will not be able to get ${activityResource.item?.info._name}`,
            where: startActivityBug.name,
        });
    }

    canPlay({ activity: activityResource._type, entityId: playerEntityId, strict: true });
    startActivity({ activityId });

    const activityBugData = activityResource.activityData as ActivityBugData;
    activityBugData._hp = activityBugData._maxHp;
    activityBugData._nbErrors = 0;
    activityBugData._symbol = undefined;
    activityBugData._symbolFound = undefined;

    setState('isActivityBugRunning', true);
    setCycle('activityBugTickInterval', activityBugData._symbolInterval);

    event({ type: EventTypes.ACTIVITY_BUG_START });
    event({ data: { audioName: 'activity_bug_start' }, type: EventTypes.AUDIO_PLAY });
};

export const updateActivityBug = ({ activityId }: { activityId: string }) => {
    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityResourceData = getResourceData({ resourceEntityId: activityId });

    activityResource.activityData = {
        _hp: activityResourceData.data.maxHp,
        _maxHp: activityResourceData.data.maxHp,
        _maxNbErrors: activityResourceData.data.maxNbErrors,
        _nbErrors: 0,
        _symbolInterval: activityResourceData.data.symbolInterval,
    };

    //TODO: temp
    // const activityResourceSprite = getComponent({ componentId: 'Sprite', entityId: activityId });
    // activityResourceSprite._image = `resource_${activityResource.item?.info._name.toLowerCase()}`;

    const activityResourceTrigger = getComponent({ componentId: 'Trigger', entityId: activityId });
    //TODO: temp
    activityResourceTrigger._priority = 1;
};

export const tickActivityBug = ({ activityId, managerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: tickActivityBug.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: tickActivityBug.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityBugData = activityResource.activityData as ActivityBugData;

    activityBugData._symbol = manager.settings.keys.move[Object.keys(manager.settings.keys.move)[
        Math.floor(Math.random() * Object.keys(manager.settings.keys.move).length)
    ] as keyof typeof manager.settings.keys.move];

    activityBugData._symbolFound = undefined;

    if (getState('isActivityBugInputCooldown')) {
        setState('isActivityBugInputCooldown', false);
    }

    event({ type: EventTypes.ACTIVITY_BUG_UPDATE });
    event({ data: { audioName: 'activity_bug_select' }, type: EventTypes.AUDIO_PLAY });
};

export const playActivityBug = ({ activityId, symbol }: {
    activityId?: string | null,
    symbol: string,
}) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: playActivityBug.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityBugData = activityResource.activityData as ActivityBugData;
    if (symbol === activityBugData._symbol && activityBugData._hp > 0) {
        activityBugData._hp -= 1;
        activityBugData._symbolFound = true;

        setState('isActivityBugInputCooldown', true);

        event({ data: { audioName: 'main_success' }, type: EventTypes.AUDIO_PLAY });
    }
    else if (symbol !== activityBugData._symbol) {
        activityBugData._nbErrors += 1;
        activityBugData._symbolFound = false;

        setState('isActivityBugInputCooldown', true);

        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });
    }

    if (activityBugData._hp <= 0) {
        winActivityBug({ activityId });

        event({ data: { audioName: 'activity_bug_win' }, type: EventTypes.AUDIO_PLAY });

        return;
    }
    else if (activityBugData._nbErrors >= activityBugData._maxNbErrors) {
        loseActivityBug({ activityId });

        return;
    }

    event({ type: EventTypes.ACTIVITY_BUG_UPDATE });
};

export const winActivityBug = ({ activityId }: { activityId: string }) => {
    endActivityBug({ activityId });
    winActivity({ activityId });
};

export const loseActivityBug = ({ activityId }: { activityId: string }) => {
    endActivityBug({ activityId });
    loseActivity();
};

export const endActivityBug = ({ activityId }: { activityId: string }) => {
    setState('isActivityBugRunning', false);
    setState('isActivityBugInputCooldown', false);
    clearCycle('activityBugTickInterval');

    setEntityCooldown({ entityId: activityId, value: true });
    setCooldown({ entityId: activityId });

    event({ type: EventTypes.ACTIVITY_BUG_END });
};
//#endregion
