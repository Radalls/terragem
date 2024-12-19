import crafts from '@/assets/items/crafts.json';
import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region TYPES
export type CraftData = {
    components: { amount: number, name: Items }[],
    name: Items,
}
//#endregion

//#region DATA
export const getCraftData = ({ itemName }: { itemName: string }) => {
    const craftData = crafts.find((data) => data.name === itemName) ?? error({
        message: `CraftData for ${itemName} not found`,
        where: getCraftData.name,
    });

    return craftData as CraftData;
};
//#endregion
