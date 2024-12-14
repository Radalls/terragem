import { error } from '@/engine/services/error';
import { getState } from '@/engine/services/state';
import { getAdmin, getComponent, isGem } from '@/engine/systems/entities';
import { getGemActionSpeed, runGemMove, runGemWork } from '@/engine/systems/gem';

//#region TYPES
type RequestCycle = { id: string, progress: number };

const cycle = {
    deltaTime: 1 / 60,
    requests: [] as RequestCycle[],
};

let cycleInterval: NodeJS.Timeout;
//#endregion

//#region SERVICES
export const startCycle = () => {
    cycleInterval = setInterval(() => runCycle(), cycle.deltaTime * 1000);
};

export const stopCycle = () => {
    clearInterval(cycleInterval);
};

const createCycle = ({ id }: { id: string }) => cycle.requests.push({ id, progress: 0 });

const getCycle = ({ id }: { id: string }) => cycle.requests.find((request) => request.id === id);

const clearCycle = ({ id }: { id: string }) => cycle.requests = cycle.requests.filter((request) => request.id !== id);

const addProgress = ({ id }: { id: string }) => {
    const reqCycle = getCycle({ id });

    if (reqCycle) {
        reqCycle.progress += cycle.deltaTime;
    }
    else error({
        message: `Cycle ${id} not found`,
        where: addProgress.name,
    });
};

const clearProgress = ({ id }: { id: string }) => {
    const reqCycle = getCycle({ id });

    if (reqCycle) {
        reqCycle.progress = 0;
    }
    else error({
        message: `Cycle ${id} not found`,
        where: clearProgress.name,
    });
};

const runCycle = () => {
    if (getState({ key: 'gamePlay' })) {
        const admin = getAdmin();

        for (const reqId of cycle.requests) {
            if (!(admin.requests.includes(reqId.id))) {
                clearCycle({ id: reqId.id });
            }
        }

        for (const reqId of admin.requests) {
            const reqCycle = getCycle({ id: reqId });

            if (!(reqCycle)) {
                createCycle({ id: reqId });
            }
            else {
                addProgress({ id: reqId });

                if (isGem({ gemId: reqId })) {
                    const gemState = getComponent({ componentId: 'State', entityId: reqId });

                    if (!(gemState._request)) continue;
                    if (gemState._action === 'idle') continue;

                    const gemActionSpeed = getGemActionSpeed({ gemId: reqId });
                    const gemTrigger = reqCycle.progress * gemActionSpeed;

                    if (gemTrigger >= 1) {
                        clearProgress({ id: reqId });

                        if (gemState._action === 'move') {
                            runGemMove({ gemId: reqId });
                        }
                        else if (gemState._action === 'work') {
                            runGemWork({ gemId: reqId });
                        }
                    }
                }
            }
        }
    }
};
//#endregion
