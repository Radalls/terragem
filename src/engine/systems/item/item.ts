import { ItemTypes } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { createEntityGem } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entities';
import { gemAtCapacity, getGem } from '@/engine/systems/gem';
import { getItemRecipeData, isGem, toGem } from '@/engine/systems/item';
import { RenderEventTypes } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
//#region ADMIN
export const addAdminItem = ({ type, amount }: {
    amount: number,
    type: ItemTypes,
}) => {
    const admin = getAdmin();

    const item = admin.items.find((item) => item._type === type);
    if (item) {
        item._amount += amount;
    }
    else {
        admin.items.push({ _amount: amount, _type: type });
    }
};

export const removeAdminItem = ({ type, amount }: {
    amount: number,
    type: ItemTypes,
}) => {
    const admin = getAdmin();

    const item = admin.items.find((item) => item._type === type);

    if (!(item)) {
        return false;
    }
    else if (item._amount < amount) {
        return false;
    }
    else {
        item._amount -= amount;

        return true;
    }
};

export const craftAdminItem = ({ type }: { type: ItemTypes }) => {
    const admin = getAdmin();

    if (admin.recipes.includes(type)) {
        const itemRecipeData = getItemRecipeData({ recipe: type });

        for (const recipeItem of itemRecipeData.items) {
            const adminItem = admin.items.find((it) => it._type === recipeItem.type);

            if (!(adminItem)) {
                emit({
                    data: `Could not craft ${type}`,
                    target: 'render',
                    type: RenderEventTypes.INFO_ALERT,
                });

                return false;
            }
            else if (adminItem._amount < recipeItem.amount) {
                emit({
                    data: `Could not craft ${type}`,
                    target: 'render',
                    type: RenderEventTypes.INFO_ALERT,
                });

                return false;
            }
            else {
                const remove = removeAdminItem({ amount: recipeItem.amount, type: adminItem._type });

                if (!(remove)) {
                    emit({
                        data: `Could not craft ${type}`,
                        target: 'render',
                        type: RenderEventTypes.INFO_ALERT,
                    });

                    return false;
                }
                else {
                    continue;
                }
            }
        }

        if (isGem({ type })) {
            createEntityGem({ type: toGem({ type }) });
        }
        else {
            addAdminItem({ amount: 1, type: itemRecipeData.type });
        }

        emit({
            data: `Crafted ${1} ${type} !`,
            target: 'render',
            type: RenderEventTypes.INFO,
        });

        return true;
    }
    else {
        emit({
            data: `Could not craft ${type}`,
            target: 'render',
            type: RenderEventTypes.INFO_ALERT,
        });

        return false;
    }
};
//#endregion

//#region GEM
export const addGemItem = ({ gemId, type, amount }: {
    amount: number,
    gemId: string,
    type: ItemTypes,
}) => {
    const gem = getGem({ gemId });

    if (gemAtCapacity({ gemId })) throw error({
        message: `${gemId} is at capacity`,
        where: addGemItem.name,
    });

    const item = gem.items.find((item) => item._type === type);
    if (item) {
        item._amount += amount;
    }
    else {
        gem.items.push({ _amount: amount, _type: type });
    }
};

export const removeGemItem = ({ gemId, amount }: {
    amount: number,
    gemId: string,
}) => {
    const gem = getGem({ gemId });

    if (!(gem.items.length)) {
        return;
    }

    const item = gem.items[0];
    if (amount > item._amount) {
        gem.items.splice(0, 1);

        return {
            amount: item._amount,
            type: item._type,
        };
    }
    else if (amount === item._amount) {
        gem.items.splice(0, 1);

        return {
            amount: amount,
            type: item._type,
        };
    }
    else if (amount < item._amount) {
        item._amount -= amount;

        return {
            amount: amount,
            type: item._type,
        };
    }
};
//#endregion
//#endregion
