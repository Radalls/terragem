import { Gems, Items } from '@/engine/components';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';

//#region CONSTANTS
//#endregion

//#region UTILS
export const isItemGem = ({ itemName }: { itemName: Items }) => itemName.includes('GEM');

//TODO: future proof build types
export const isItemBuild = ({ itemName }: { itemName: Items }) => itemName.includes('FORGE');

export const isItemMech = ({ itemName }: { itemName: Items }) => itemName.includes('MK');

export const itemToGem = ({ itemName }: { itemName: Items }) => {
    if (!(isItemGem({ itemName }))) error({
        message: `${itemName} is not a gem`,
        where: itemToGem.name,
    });

    const gemType = itemName.split('_')[1];
    return gemType.charAt(0).toUpperCase() + gemType.slice(1).toLowerCase() as Gems;
};

export const getItemCount = ({ itemName }: { itemName: Items }) => {
    const admin = getAdmin();

    const item = admin.items.find((item) => item._name === itemName);

    return item?._amount;
};
//#endregion
