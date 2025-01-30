import { Items } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getState } from '@/engine/services/state';
import { runBuild } from '@/engine/systems/build';
import { getAdmin, getComponent, isGem } from '@/engine/systems/entity';
import { getGemActionSpeed, runGemMove, runGemWork } from '@/engine/systems/gem';
import { progressLab } from '@/engine/systems/lab';
import { RenderEvents } from '@/render/events';

//#region TYPES
type RequestCycle = { id: string, progress: number };

const cycle = {
    deltaTime: 1 / 60,
    forgeOryonTime: 0,
    forgeVulkanTime: 0,
    labTime: 0,
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

//#region REQUEST
const createRequestCycle = ({ id }: { id: string }) => cycle.requests.push({ id, progress: 0 });

const getRequestCycle = ({ id }: { id: string }) => cycle.requests.find((request) => request.id === id);

const clearRequestCycle = ({ id }: { id: string }) => cycle.requests = cycle.requests
    .filter((request) => request.id !== id);

const addRequestCycleProgress = ({ id }: { id: string }) => {
    const reqCycle = getRequestCycle({ id });

    if (reqCycle) {
        reqCycle.progress += cycle.deltaTime;
    }
    else error({
        message: `Cycle ${id} not found`,
        where: addRequestCycleProgress.name,
    });
};

const clearRequestCycleProgress = ({ id }: { id: string }) => {
    const reqCycle = getRequestCycle({ id });

    if (reqCycle) {
        reqCycle.progress = 0;
    }
    else error({
        message: `Cycle ${id} not found`,
        where: clearRequestCycleProgress.name,
    });
};
//#endregion

const runCycle = () => {
    if (getState({ key: 'gamePlay' })) {
        const admin = getAdmin();

        /* GEM REQUESTS */
        for (const reqId of cycle.requests) {
            if (!(admin.requests.includes(reqId.id))) {
                clearRequestCycle({ id: reqId.id });
            }
        }

        for (const reqId of admin.requests) {
            const reqCycle = getRequestCycle({ id: reqId });

            if (!(reqCycle)) {
                createRequestCycle({ id: reqId });
            }
            else {
                addRequestCycleProgress({ id: reqId });

                if (isGem({ gemId: reqId })) {
                    const gemState = getComponent({ componentId: 'State', entityId: reqId });

                    if (!(gemState._request)) continue;
                    if (gemState._action === 'idle') continue;

                    const gemActionSpeed = getGemActionSpeed({ gemId: reqId });
                    const gemTrigger = reqCycle.progress * gemActionSpeed;

                    if (gemTrigger >= 1) {
                        clearRequestCycleProgress({ id: reqId });

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

        /* LABS */
        cycle.labTime += cycle.deltaTime;
        if (cycle.labTime >= 1) {
            cycle.labTime = 0;

            for (const lab of admin.labs) {
                if (lab._run) {
                    progressLab({ name: lab._name });
                }
            }
        }

        /* FORGES */
        //TODO: future proof
        if (admin.builds.forges.vulkan) {
            cycle.forgeVulkanTime += cycle.deltaTime;
            const forgeVulkanTrigger = cycle.forgeVulkanTime * admin.stats._forgeVulkanSpeed;

            if (forgeVulkanTrigger >= 1) {
                cycle.forgeVulkanTime = 0;

                runBuild({ buildName: Items.BUILD_FORGE_VULKAN });
            }
        }

        if (admin.builds.forges.oryon) {
            cycle.forgeOryonTime += cycle.deltaTime;
            const forgeOryonTrigger = cycle.forgeOryonTime * admin.stats._forgeOryonSpeed;

            if (forgeOryonTrigger >= 1) {
                cycle.forgeOryonTime = 0;

                runBuild({ buildName: Items.BUILD_FORGE_ORYON });
            }
        }

        /* SCROLL */
        if (!(getState({ key: 'gamePause' }))) {
            emit({ target: 'render', type: RenderEvents.SCROLL_UPDATE });
        }
    }
};
//#endregion
