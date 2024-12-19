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
//#endregion
