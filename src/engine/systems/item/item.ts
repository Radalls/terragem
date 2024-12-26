import { Items } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { createEntityGem } from '@/engine/services/entity';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';
import { isGemAtCapacity, getGem, gemHasItems } from '@/engine/systems/gem';
import { getCraftData, isItemGem, itemToGem } from '@/engine/systems/item';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
//#region ADMIN
export const addAdminItem = ({ name, amount }: {
    amount: number,
    name: Items,
}) => {
    const admin = getAdmin();

    const item = admin.items.find((item) => item._name === name);
    if (item) {
        item._amount += amount;
    }
    else {
        admin.items.push({ _amount: amount, _name: name });
    }
};

export const removeAdminItem = ({ name, amount }: {
    amount: number,
    name: Items,
}) => {
    const admin = getAdmin();

    const item = admin.items.find((item) => item._name === name);

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

export const craftAdminItem = ({ itemName }: { itemName: Items }) => {
    const admin = getAdmin();

    if (admin.crafts.includes(itemName)) {
        if (isItemGem({ itemName })) {
            if (admin.gems.length >= admin.stats._gemMax) {
                emit({
                    data: 'Already at max gem capacity',
                    target: 'render',
                    type: RenderEvents.INFO_ALERT,
                });

                return false;
            }
        }

        const craftData = getCraftData({ itemName });

        for (const compItem of craftData.components) {
            const adminItem = admin.items.find((it) => it._name === compItem.name);

            if (!(adminItem)) {
                emit({
                    data: `Could not craft ${itemName}`,
                    target: 'render',
                    type: RenderEvents.INFO_ALERT,
                });

                return false;
            }
            else if (adminItem._amount < compItem.amount) {
                emit({
                    data: `Could not craft ${itemName}`,
                    target: 'render',
                    type: RenderEvents.INFO_ALERT,
                });

                return false;
            }
            else {
                const remove = removeAdminItem({ amount: compItem.amount, name: adminItem._name });

                if (!(remove)) {
                    emit({
                        data: `Could not craft ${itemName}`,
                        target: 'render',
                        type: RenderEvents.INFO_ALERT,
                    });

                    return false;
                }
                else {
                    continue;
                }
            }
        }

        if (isItemGem({ itemName })) {
            createEntityGem({ type: itemToGem({ itemName }) });
        }
        else {
            addAdminItem({ amount: 1, name: craftData.name });
        }

        emit({
            data: `Crafted ${1} ${itemName} !`,
            target: 'render',
            type: RenderEvents.INFO,
        });

        return true;
    }
    else {
        emit({
            data: `Could not craft ${itemName}`,
            target: 'render',
            type: RenderEvents.INFO_ALERT,
        });

        return false;
    }
};
//#endregion

//#region GEM
export const addGemItem = ({ gemId, name, amount }: {
    amount: number,
    gemId: string,
    name: Items,
}) => {
    const gem = getGem({ gemId });

    if (!(gemHasItems(gem))) throw error({
        message: `${gemId} cannot use items`,
        where: addGemItem.name,
    });

    if (isGemAtCapacity({ gemId })) throw error({
        message: `${gemId} is at capacity`,
        where: addGemItem.name,
    });

    const item = gem.items.find((item) => item._name === name);
    if (item) {
        item._amount += amount;
    }
    else {
        gem.items.push({ _amount: amount, _name: name });
    }

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_UPDATE });
};

export const removeGemItem = ({ gemId, amount }: {
    amount: number,
    gemId: string,
}) => {
    const gem = getGem({ gemId });

    if (!(gemHasItems(gem))) throw error({
        message: `${gemId} cannot use items`,
        where: addGemItem.name,
    });

    if (!(gem.items.length)) {
        return;
    }

    const item = gem.items.pop();
    if (!(item)) {
        return;
    }

    const removeItem = {
        amount: 0,
        name: item._name,
    };

    if (amount > item._amount) {
        removeItem.amount = item._amount;
    }
    else if (amount === item._amount) {
        removeItem.amount = amount;
    }
    else if (amount < item._amount) {
        gem.items.push({
            _amount: item._amount - amount,
            _name: item._name,
        });

        removeItem.amount = amount;
    }

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_UPDATE });

    return removeItem;
};
//#endregion
//#endregion
