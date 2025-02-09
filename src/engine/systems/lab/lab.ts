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
        _name: labData.name,
        _progress: 0,
        _run: false,
    };

    admin.labs.push(lab);
};

export const runLab = ({ name }: { name: string }) => {
    const admin = getAdmin();

    const lab = searchLab({ name });

    if (!(lab)) return;
    if (lab._run) return;

    const labData = getLabData({ name: lab._name });

    if (admin.stats._labPoints >= labData.cost) {
        admin.stats._labPoints -= labData.cost;

        lab._run = true;

        emit({
            data: { text: `Starting ${name}`, type: 'confirm' },
            target: 'render',
            type: RenderEvents.INFO,
        });
        emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
    }
    else {
        emit({
            data: { alert: true, text: `Not enough Lab Points to run ${name}`, type: 'warning' },
            target: 'render',
            type: RenderEvents.INFO,
        });
    }
};

export const progressLab = ({ name }: { name: string }) => {
    const lab = searchLab({ name });

    if (!(lab)) return;
    if (!(lab._run)) return;

    const labData = getLabData({ name: lab._name });

    lab._progress += 1;

    if (lab._progress >= labData.time) {
        endLab({ name: labData.name });

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

    const labData = getLabData({ name: lab._name });

    lab._run = false;
    lab._done = true;

    for (const unlock of labData.unlock) {
        if (unlock.type === 'craft') {
            admin.crafts.push(unlock.name);

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_WORKSHOP });
        }
        else if (unlock.type === 'stat') {
            const statName = getLabDataStat({ name: unlock.name });

            admin.stats[statName] = Math.round((admin.stats[statName] + unlock.amount) * 10) / 10;

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_GEMS });
        }
    }

    emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
    emit({ data: { text: `${labData.text} complete !`, type: 'success' }, target: 'render', type: RenderEvents.INFO });
};
//#endregion
