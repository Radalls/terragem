import { Items } from '@/engine/components';
import { getAdmin } from '@/engine/systems/entity';

//#region CONSTANTS
//#endregion

//#region UTILS
export const isBuild = ({ buildName }: { buildName: Items }) => buildName.includes('FORGE');

export const isBuildUnlocked = ({ buildName }: { buildName: Items }) => {
    const admin = getAdmin();

    return admin.crafts.includes(buildName);
};
//#endregion
