import crafts from '@/assets/data/crafts.json';
import mechs from '@/assets/data/mechs.json';
import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region TYPES
export type CraftData = {
    components: { amount: number, name: Items }[],
    image: string,
    name: Items,
    text: string,
};

export type MechData = {
    name: string,
    stats: { [stat: string]: number },
}
//#endregion

//#region DATA
export const getCraftData = ({ itemName }: { itemName: string }) => {
    const craftz = crafts.filter((data) => !(data['@']));

    const craftData = craftz.find((data) => data.name === itemName) ?? error({
        message: `CraftData for ${itemName} not found`,
        where: getCraftData.name,
    });

    return craftData as CraftData;
};

export const getMechData = ({ mechName }: { mechName: string }) => {
    const mechz = mechs.filter((mech) => !(mech['@']));

    const mechData = mechz.find((mech) => mech.name === mechName) ?? error({
        message: `MechData for ${mechName} not found`,
        where: getMechData.name,
    });

    return mechData as unknown as MechData;
};
//#endregion
