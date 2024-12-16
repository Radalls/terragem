import { GemTypes, ItemTypes } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region CONSTANTS
//#endregion

//#region UTILS
export const isGem = ({ type }: { type: ItemTypes }) => type.includes('GEM');

export const toGem = ({ type }: { type: ItemTypes }) => {
    if (!(isGem({ type }))) error({
        message: `${type} is not a gem`,
        where: toGem.name,
    });

    const gemType = type.split('_')[1];
    return gemType.charAt(0).toUpperCase() + gemType.slice(1).toLowerCase() as GemTypes;
};
//#endregion
