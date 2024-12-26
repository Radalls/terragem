import { Admin } from '@/engine/components';
import { getAdmin } from '@/engine/systems/entity';

//#region CONSTANTS
//#endregion

//#region UTILS
export const searchLab = ({ name }: { name: string }) => {
    const admin = getAdmin();

    const lab = admin.labs.find((lab) =>
        lab.data.name === name
        && lab._done === false
    );

    return lab;
};

export const getLabDataStat = ({ name }: { name: string }) => {
    const statName = '_' + name.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    return statName as keyof Admin['stats'];
};
//#endregion
