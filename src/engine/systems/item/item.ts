import { ItemTypes } from '@/engine/components';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entities';
import { gemAtCapacity, getGem } from '@/engine/systems/gem';

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
