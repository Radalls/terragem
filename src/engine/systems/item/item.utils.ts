import { Gems, Items } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region CONSTANTS
//#endregion

//#region UTILS
export const isItemGem = ({ itemName }: { itemName: Items }) => itemName.includes('GEM');

export const itemToGem = ({ itemName }: { itemName: Items }) => {
    if (!(isItemGem({ itemName }))) error({
        message: `${itemName} is not a gem`,
        where: itemToGem.name,
    });

    const gemType = itemName.split('_')[1];
    return gemType.charAt(0).toUpperCase() + gemType.slice(1).toLowerCase() as Gems;
};
//#endregion
