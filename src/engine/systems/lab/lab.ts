import { Lab } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';
import { getLabData, LAB_DATA_ADMIN_GEM_MAX, searchLab } from '@/engine/systems/lab';
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

    if (admin._labPoints >= lab.data.cost) {
        admin._labPoints -= lab.data.cost;

        lab._run = true;
    }
    else {
        emit({ data: `Not enough Lab Points to run ${name}`, target: 'render', type: RenderEvents.INFO });
    }
};

export const progressLab = ({ name }: { name: string }) => {
    const lab = searchLab({ name });

    if (!(lab)) return;
    if (!(lab._run)) return;

    lab._progress += 1;

    if (lab._progress >= lab.data.time) {
        endLab({ name: lab.data.name });
        return;
    }
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
        }
        else if (unlock.type === 'stat') {
            if (unlock.name === LAB_DATA_ADMIN_GEM_MAX) {
                admin._gemMax += unlock.amount;
            }
        }
    }

    emit({ data: `${name} complete !`, target: 'render', type: RenderEvents.INFO });
};
//#endregion
