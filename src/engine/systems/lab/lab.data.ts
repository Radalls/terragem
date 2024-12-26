import labs from '@/assets/labs/labs.json';
import { error } from '@/engine/services/error';

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
    const labz = labs.filter((data) => !(data['@']));

    const questData = labz.find((data) => data.name === name) ?? error({
        message: `LabData for ${name} not found`,
        where: getLabData.name,
    });

    return questData as LabData;
};
//#endregion
