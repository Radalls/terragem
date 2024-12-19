import labs from '@/assets/labs/labs.json';
import { error } from '@/engine/services/error';

//#region CONSTANTS
export const LAB_DATA_ADMIN_GEM_MAX = 'GEM_MAX';
//#endregion

//#region TYPES
export type LabData = {
    cost: number
    name: string
    text: string
    time: number
    unlock: ({ name: string, type: 'craft' } | { amount: number, name: string, type: 'stat' })[]
}
//#endregion

//#region DATA
export const getLabData = ({ name }: { name: string }) => {
    const questData = labs.find((data) => data.name === name) ?? error({
        message: `LabData for ${name} not found`,
        where: getLabData.name,
    });

    return questData as LabData;
};
//#endregion
