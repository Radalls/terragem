import { Lab } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';
import { getLabData, getLabDataStat, searchLab } from '@/engine/systems/lab';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const createLab = ({ name }: { name: string }) => {
    const admin = getAdmin();

    const labData = getLabData({ name });

    const lab: Lab = {
        _done: false,
        _progress: 0,
        _run: false,
        data: labData,
    };

    admin.labs.push(lab);
};

export const runLab = ({ name }: { name: string }) => {
    const admin = getAdmin();

    const lab = searchLab({ name });

    if (!(lab)) return;
    if (lab._run) return;

    if (admin.stats._labPoints >= lab.data.cost) {
        admin.stats._labPoints -= lab.data.cost;

        lab._run = true;

        emit({ data: `Starting ${name}`, target: 'render', type: RenderEvents.INFO });
        emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
    }
    else {
        emit({ data: `Not enough Lab Points to run ${name}`, target: 'render', type: RenderEvents.INFO_ALERT });
    }
};

export const progressLab = ({ name }: { name: string }) => {
    const lab = searchLab({ name });

    if (!(lab)) return;
    if (!(lab._run)) return;

    lab._progress += 1;

    if (lab._progress >= lab.data.time) {
        endLab({ name: lab.data.name });

        emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });

        return;
    }

    emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
};

export const endLab = ({ name }: { name: string }) => {
    const admin = getAdmin();

    const lab = searchLab({ name });

    if (!(lab)) throw error({
        message: `Lab ${name} not found`,
        where: endLab.name,
    });

    lab._run = false;
    lab._done = true;

    for (const unlock of lab.data.unlock) {
        if (unlock.type === 'craft') {
            admin.crafts.push(unlock.name);

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_WORKSHOP });
        }
        else if (unlock.type === 'stat') {
            const statName = getLabDataStat({ name: unlock.name });

            admin.stats[statName] += unlock.amount;

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_GEMS });
        }
    }

    emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
    emit({ data: `${name} done !`, target: 'render', type: RenderEvents.INFO });
};
//#endregion
