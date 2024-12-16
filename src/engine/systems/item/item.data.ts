import item_recipes from '@/assets/items/item_recipes.json';
import { ItemTypes } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region TYPES
export type ItemRecipeData = {
    items: { amount: number, type: ItemTypes }[],
    type: ItemTypes,
}
//#endregion

//#region DATA
export const getItemRecipeData = ({ recipe }: { recipe: string }) => {
    const ItemRecipeData = item_recipes.find((craftData) => craftData.type === recipe)
        ?? error({
            message: `CraftData for ${recipe} not found`,
            where: getItemRecipeData.name,
        });

    return ItemRecipeData as ItemRecipeData;
};
//#endregion
