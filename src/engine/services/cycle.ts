import { checkComponent, getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { onInputKeyDown } from '@/engine/services/event';
import { getState, setState } from '@/engine/services/state';
import { clearStore } from '@/engine/services/store';
import { completeQuest } from '@/engine/systems/manager';
import {
    endActivity,
    tickActivityBug,
    tickActivityFish,
    tickActivityFishFrenzy,
    generateResourceItem,
} from '@/engine/systems/resource';
import { setEntityCooldown } from '@/engine/systems/state';

//#region TYPES
const cycle = {
    activityBugTickInterval: 0,
    activityFishTickInterval: 0,
    activityFishTickIntervalFrenzyOff: 0,
    activityFishTickIntervalFrenzyOn: 0,
    activityWinTickInterval: 0,
    checkTime: 1 / 10,
    deltaTime: 1 / 60,
    elapsedTimeSinceActivityBugTick: 0,
    elapsedTimeSinceActivityFishFrenzyOffTick: 0,
    elapsedTimeSinceActivityFishFrenzyOnTick: 0,
    elapsedTimeSinceActivityFishInputTick: 0,
    elapsedTimeSinceActivityWinTick: 0,
    elapsedTimeSinceInputTick: 0,
    inputTickInterval: 1 / 20,
};
let cycleInterval: NodeJS.Timeout;

const check = {
    questCheck: () => false,
};
let checkInterval: NodeJS.Timeout;

const cooldowns: NodeJS.Timeout[] = [];
//#endregion

//#region HELPERS
export const setCycle = (key: keyof typeof cycle, value: number) => cycle[key] = value;
export const getCycle = (key: keyof typeof cycle) => cycle[key];
export const clearCycle = (key: keyof typeof cycle) => cycle[key] = 0;

export const setCheck = (key: keyof typeof check, value: () => boolean) => check[key] = value;
export const getCheck = (key: keyof typeof check) => check[key]();
export const clearCheck = (key: keyof typeof check) => check[key] = () => false;

export const setCooldown = ({ entityId, value = 10 }: {
    entityId: string,
    value?: number,
}) => {
    const state = getComponent({ componentId: 'State', entityId });
    if (!(state._cooldown)) throw error({
        message: 'Entity is not on cooldown',
        where: setCooldown.name,
    });

    const entityCooldown = setInterval(() => {
        setEntityCooldown({ entityId, value: false });

        if (checkComponent({ componentId: 'Resource', entityId })) {
            const resource = getComponent({ componentId: 'Resource', entityId });
            if (!(resource?.items)) throw error({
                message: 'Resource component does not have items',
                where: setCooldown.name,
            });

            generateResourceItem({ resourceEntityId: entityId });
        }

        clearInterval(entityCooldown);
        cooldowns.splice(cooldowns.indexOf(entityCooldown), 1);
    }, value * 1000);

    cooldowns.push(entityCooldown);
};
//#endregion

//#region CYCLE
export const startCycle = () => {
    cycleInterval = setInterval(() => {
        runCycle();
    }, getCycle('deltaTime') * 1000);
    checkInterval = setInterval(() => {
        runCheck();
    }, getCycle('checkTime') * 1000);
};

export const stopCycle = () => {
    clearInterval(cycleInterval);
    clearInterval(checkInterval);

    for (const cooldown of cooldowns) {
        clearInterval(cooldown);
    }

    clearCycle('activityBugTickInterval');
    clearCycle('activityFishTickInterval');
    clearCycle('activityFishTickIntervalFrenzyOff');
    clearCycle('activityFishTickIntervalFrenzyOn');
    clearCycle('activityWinTickInterval');
    clearCycle('elapsedTimeSinceInputTick');
    clearCycle('elapsedTimeSinceActivityWinTick');
    clearCycle('elapsedTimeSinceActivityBugTick');
    clearCycle('elapsedTimeSinceActivityFishFrenzyOffTick');
    clearCycle('elapsedTimeSinceActivityFishFrenzyOnTick');
    clearCycle('elapsedTimeSinceActivityFishInputTick');

    clearCheck('questCheck');
};

const runCycle = () => {
    if (
        getState('isInputCooldown')
        && !(getState('isActivityInputCooldown'))
        && !(getState('isActivityBugInputCooldown'))
    ) {
        const inputTickIntervalProgress = cycle.elapsedTimeSinceInputTick / cycle.inputTickInterval;

        if (inputTickIntervalProgress >= 1) {
            clearCycle('elapsedTimeSinceInputTick');
            setState('isInputCooldown', false);
        }
    }

    cycle.elapsedTimeSinceInputTick += cycle.deltaTime;

    onInputKeyDown();

    if (getState('isGameRunning')) {
        if (getState('isActivityRunning')) {
            if (getState('isActivityWin') && cycle.activityWinTickInterval > 0) {
                cycle.elapsedTimeSinceActivityWinTick += cycle.deltaTime;

                const activityTickIntervalProgress
                    = cycle.elapsedTimeSinceActivityWinTick / cycle.activityWinTickInterval;

                if (activityTickIntervalProgress >= 1) {
                    clearCycle('elapsedTimeSinceActivityWinTick');
                    clearCycle('activityWinTickInterval');

                    endActivity({});

                    clearStore('activityId');
                }
            }
            if (getState('isActivityLose') && cycle.activityWinTickInterval > 0) {
                cycle.elapsedTimeSinceActivityWinTick += cycle.deltaTime;

                const activityTickIntervalProgress
                    = cycle.elapsedTimeSinceActivityWinTick / cycle.activityWinTickInterval;

                if (activityTickIntervalProgress >= 1) {
                    clearCycle('elapsedTimeSinceActivityWinTick');
                    clearCycle('activityWinTickInterval');

                    endActivity({});

                    clearStore('activityId');
                }
            }
            if (getState('isActivityBugRunning') && cycle.activityBugTickInterval > 0) {
                cycle.elapsedTimeSinceActivityBugTick += cycle.deltaTime;

                const activityBugTickIntervalProgress =
                    cycle.elapsedTimeSinceActivityBugTick / cycle.activityBugTickInterval;

                if (activityBugTickIntervalProgress >= 1) {
                    clearCycle('elapsedTimeSinceActivityBugTick');

                    tickActivityBug({});
                }
            }
            if (getState('isActivityFishRunning')) {
                cycle.elapsedTimeSinceActivityFishInputTick += cycle.deltaTime;

                const activityFishInputTickIntervalProgress =
                    cycle.elapsedTimeSinceActivityFishInputTick / cycle.activityFishTickInterval;

                if (activityFishInputTickIntervalProgress >= 1) {
                    clearCycle('elapsedTimeSinceActivityFishInputTick');

                    tickActivityFish({});
                }
                if (getState('isActivityFishFrenzy') && cycle.activityFishTickIntervalFrenzyOn > 0) {
                    cycle.elapsedTimeSinceActivityFishFrenzyOnTick += cycle.deltaTime;

                    const activityFishFrenzyOnTickInvervalProgress =
                        cycle.elapsedTimeSinceActivityFishFrenzyOnTick / cycle.activityFishTickIntervalFrenzyOn;
                    if (activityFishFrenzyOnTickInvervalProgress >= 1) {
                        clearCycle('elapsedTimeSinceActivityFishFrenzyOnTick');

                        tickActivityFishFrenzy({});
                    }
                }
                else if (!(getState('isActivityFishFrenzy')) && cycle.activityFishTickIntervalFrenzyOff > 0) {
                    cycle.elapsedTimeSinceActivityFishFrenzyOffTick += cycle.deltaTime;

                    const activityFishFrenzyOffTickInvervalProgress =
                        cycle.elapsedTimeSinceActivityFishFrenzyOffTick / cycle.activityFishTickIntervalFrenzyOff;
                    if (activityFishFrenzyOffTickInvervalProgress >= 1) {
                        clearCycle('elapsedTimeSinceActivityFishFrenzyOffTick');

                        tickActivityFishFrenzy({});
                    }
                }
            }
        }
    }
};

const runCheck = () => {
    if (getState('isGameRunning')) {
        if (getState('isQuestActive')) {
            const questCheckResult = getCheck('questCheck');

            if (questCheckResult) {
                completeQuest({ questState: true });
            }
        }
        else if (getState('isQuestComplete')) {
            const questCheckResult = getCheck('questCheck');

            if (!(questCheckResult)) {
                completeQuest({ questState: false });
            }
        }
        else if (getState('isQuestEnd')) {
            setCheck('questCheck', () => false);
            setState('isQuestEnd', false);
        }
    }
};
//#endregion
