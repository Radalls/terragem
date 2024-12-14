import { getResourceData } from '../resource.data';

import { canPlay, loseActivity, startActivity, winActivity } from './activity';

import { ActivityFishData } from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { randAudio } from '@/engine/services/audio';
import { clearCycle, setCooldown, setCycle } from '@/engine/services/cycle';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { playerInventoryFull } from '@/engine/systems/inventory';
import { setEntityCooldown } from '@/engine/systems/state';
import { event } from '@/render/events';

//#region SERVICES
export const onActivityFishInput = ({ inputKey, activityId, managerEntityId }: {
    activityId?: string | null,
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onActivityFishInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: onActivityFishInput.name });

    if (inputKey === manager.settings.keys.action._back) {
        loseActivityFish({ activityId });
    }
    else {
        playActivityFish({ activityId, symbol: inputKey });
    }
};

export const startActivityFish = ({ activityId, playerEntityId }: {
    activityId: string,
    playerEntityId?: string | null,
}) => {
    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });

    if (!(activityResource.item)) {
        throw error({ message: `Resource ${activityId} does not have an item`, where: startActivityFish.name });
    }

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: startActivityFish.name });

    if (!(canPlay({ activity: activityResource._type, entityId: playerEntityId, strict: false }))) {
        event({ data: { message: 'Je ne peux pas faire ça maintenant' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Player can't play activity ${activityResource._type}`,
            where: startActivityFish.name,
        });
    }
    if (playerInventoryFull({ item: activityResource.item })) {
        event({ data: { message: 'Mon sac est plein' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Player will not be able to get ${activityResource.item?.info._name}`,
            where: startActivityFish.name,
        });
    }

    canPlay({ activity: activityResource._type, entityId: playerEntityId, strict: true });
    startActivity({ activityId });

    const activityFishData = activityResource.activityData as ActivityFishData;
    activityFishData._hp = activityFishData._maxHp;
    activityFishData._rodTension = 0;
    activityFishData._isFrenzy = false;

    setState('isActivityFishRunning', true);
    setState('isActivityFishFrenzy', false);
    setCycle('activityFishTickInterval', 1 / 2);
    setCycle('activityFishTickIntervalFrenzyOff', activityFishData._frenzyInterval);
    setCycle('activityFishTickIntervalFrenzyOn', activityFishData._frenzyDuration);

    event({ type: EventTypes.ACTIVITY_FISH_START });
    event({ data: { audioName: 'activity_fish_start' }, type: EventTypes.AUDIO_PLAY });
};

export const updateActivityFish = ({ activityId }: { activityId: string }) => {
    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityResourceData = getResourceData({ resourceEntityId: activityId });

    //TODO: handle fishrod data
    activityResource.activityData = {
        _damage: activityResourceData.data.damage,
        _frenzyDuration: activityResourceData.data.frenzyDuration,
        _frenzyInterval: activityResourceData.data.frenzyInterval,
        _hp: activityResourceData.data.maxHp,
        _maxHp: activityResourceData.data.maxHp,
        _rodDamage: 8,
        _rodMaxTension: 1000,
        _rodTension: 0,
    };

    const activityResourceTrigger = getComponent({ componentId: 'Trigger', entityId: activityId });
    //TODO: temp
    activityResourceTrigger._priority = 1;
};

export const tickActivityFish = ({ activityId }: { activityId?: string | null }) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: tickActivityFish.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityFishData = activityResource.activityData as ActivityFishData;
    activityFishData._hp += Math.floor(activityFishData._rodDamage / 2);
    activityFishData._hp = Math.min(activityFishData._hp, activityFishData._maxHp);
    activityFishData._rodTension -= activityFishData._damage * 3;
    activityFishData._rodTension = Math.max(activityFishData._rodTension, 0);

    event({ type: EventTypes.ACTIVITY_FISH_UPDATE });

    if (activityFishData._isFrenzy) {
        event({ data: { audioName: 'activity_fish_frenzy' }, type: EventTypes.AUDIO_PLAY });
    }
};

export const tickActivityFishFrenzy = ({ activityId }: { activityId?: string | null }) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: tickActivityFishFrenzy.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityFishData = activityResource.activityData as ActivityFishData;
    activityFishData._isFrenzy = !(activityFishData._isFrenzy);

    setState('isActivityFishFrenzy', activityFishData._isFrenzy);

    event({ type: EventTypes.ACTIVITY_FISH_UPDATE });
};

export const playActivityFish = ({ symbol, activityId, managerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
    symbol: string,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: playActivityFish.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: playActivityFish.name });

    if (symbol !== manager.settings.keys.action._act) return;

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityFishData = activityResource.activityData as ActivityFishData;
    if (activityFishData._isFrenzy) {
        activityFishData._rodTension += activityFishData._damage * 3;
        activityFishData._hp -= Math.floor(activityFishData._rodDamage / 2);
    }
    else {
        activityFishData._rodTension += activityFishData._damage;
        activityFishData._hp -= activityFishData._rodDamage;
    }

    if (activityFishData._hp <= 0) {
        winActivityFish({ activityId });

        event({ data: { audioName: 'activity_fish_win' }, type: EventTypes.AUDIO_PLAY });

        return;
    }
    else if (activityFishData._rodTension > activityFishData._rodMaxTension) {
        loseActivityFish({ activityId });
        return;
    }

    event({ type: EventTypes.ACTIVITY_FISH_UPDATE });
    event({ data: { audioName: `activity_fish_play${randAudio({ nb: 2 })}` }, type: EventTypes.AUDIO_PLAY });
};

export const winActivityFish = ({ activityId }: { activityId: string }) => {
    endActivityFish({ activityId });
    winActivity({ activityId });
};

export const loseActivityFish = ({ activityId }: { activityId: string }) => {
    endActivityFish({ activityId });
    loseActivity();
};

export const endActivityFish = ({ activityId }: { activityId: string }) => {
    setState('isActivityFishRunning', false);
    setState('isActivityFishFrenzy', false);
    clearCycle('activityFishTickInterval');
    clearCycle('activityFishTickIntervalFrenzyOn');
    clearCycle('activityFishTickIntervalFrenzyOff');

    setEntityCooldown({ entityId: activityId, value: true });
    setCooldown({ entityId: activityId });

    event({ type: EventTypes.ACTIVITY_FISH_END });
};
//#endregion
