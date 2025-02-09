import { Items } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getBuildData, isBuild } from '@/engine/systems/build';
import { getAdmin } from '@/engine/systems/entity';
import { addAdminItem, removeAdminItem } from '@/engine/systems/item';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const createBuild = ({ buildName }: { buildName: Items }) => {
    if (!(isBuild({ buildName }))) error({
        message: `${buildName} is not a build`,
        where: createBuild.name,
    });

    const admin = getAdmin();

    if (buildName === Items.BUILD_FORGE_VULKAN) {
        admin.builds.forges.vulkan++;
    }
    else if (buildName === Items.BUILD_FORGE_ORYON) {
        admin.builds.forges.oryon++;
    }

    emit({ data: buildName, target: 'render', type: RenderEvents.BUILD_CREATE });
};

export const runBuild = ({ buildName }: { buildName: Items }) => {
    if (!(isBuild({ buildName }))) error({
        message: `${buildName} is not a build`,
        where: runBuild.name,
    });

    const admin = getAdmin();
    const buildData = getBuildData({ buildName });

    if (buildData.type === 'forge') {
        const forgeCount = (buildName === Items.BUILD_FORGE_VULKAN)
            ? admin.builds.forges.vulkan
            : admin.builds.forges.oryon;

        for (let i = 0; i < forgeCount; i++) {
            for (const input of buildData.forge.inputs) {
                const removeItem = removeAdminItem({ amount: input.amount, name: input.name });

                if (!(removeItem)) return;
            }

            for (const output of buildData.forge.outputs) {
                addAdminItem({ amount: output.amount, name: output.name });

                emit({
                    data: { amount: output.amount, name: output.name },
                    target: 'engine',
                    type: EngineEvents.QUEST_FORGE,
                });
            }
        }
    }

    emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_STORAGE });
};
//#endregion
