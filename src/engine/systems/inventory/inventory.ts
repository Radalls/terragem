import { findItemRule, itemIsTool } from './inventory.data';
import {
    addInventorySlot,
    addToolToInventory,
    closePlayerInventory,
    closePlayerInventorySlotOption,
    confirmPlayerInventorySlot,
    confirmPlayerInventorySlotOption,
    createTool,
    findInventorySlotsWithItem,
    findInventoryTool,
    invalidItemAmount,
    invalidItemName,
    invalidItemSprite,
    removeInventorySlots,
    selectPlayerInventorySlot,
    selectPlayerInventorySlotOption,
    slotAvailable,
} from './inventory.utils';

import { Item } from '@/engine/components/inventory';
import { ResourceTypes } from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { consumeFirstKeyPress } from '@/engine/services/input';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getKeyMoveDirection, getKeyMoveOffset } from '@/engine/systems/manager';
import { event } from '@/render/events';

//#region SYSTEMS
export const onInventoryInput = ({ inputKey, managerEntityId, playerEntityId }: {
    inputKey: string,
    managerEntityId?: string | null,
    playerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onInventoryInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: onInventoryInput.name });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (inputKey === manager.settings.keys.action._inventory) {
        if (getState('isPlayerInventorySlotSelected')) {
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });
            return;
        }

        closePlayerInventory({});
        return;
    }
    else if (inputKey === manager.settings.keys.action._back) {
        if (getState('isPlayerInventorySlotSelected')) {
            closePlayerInventorySlotOption();
            return;
        }
        else {
            closePlayerInventory({});
            return;
        }
    }
    else if (inputKey === manager.settings.keys.action._tool) {
        if (getState('isPlayerInventorySlotSelected')) {
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });
            return;
        }

        activateInventoryTool({ entityId: playerEntityId });
        return;
    }
    else if (inputKey === manager.settings.keys.action._act) {
        if (!(getState('isPlayerInventorySlotSelected'))) {
            confirmPlayerInventorySlot({});
            return;
        }
        else {
            confirmPlayerInventorySlotOption({});
            return;
        }
    }
    else {
        if (!(getState('isPlayerInventorySlotSelected'))) {
            const inputDirection = getKeyMoveDirection({ inputKey, managerEntityId });
            if (!(inputDirection)) return;

            selectPlayerInventorySlot({ input: inputDirection, playerEntityId });
        }
        else {
            const inputOffset = getKeyMoveOffset({ inputKey, managerEntityId });
            if (!(inputOffset)) return;

            selectPlayerInventorySlotOption({ offset: inputOffset, playerEntityId });
        }
    }
};

export const addItemToInventory = ({ entityId, item, itemAmount }: {
    entityId?: string | null,
    item: Item,
    itemAmount: number,
}): {
    amountRemaining?: number,
    success: boolean
} => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: addItemToInventory.name });

    if (invalidItemName(item.info._name) || invalidItemAmount(itemAmount) || invalidItemSprite(item.sprite._image)) {
        error({ message: `Item ${item.info._name} is invalid`, where: addItemToInventory.name });
    }

    const inventory = getComponent({ componentId: 'Inventory', entityId });

    const itemRule = findItemRule({ itemName: item.info._name })
        ?? error({ message: `Item ${item.info._name} does not exist`, where: addItemToInventory.name });

    if (itemRule.tool) {
        return addToolToInventory({
            entityId,
            tool: createTool({
                activity: itemRule.tool as ResourceTypes,
                item,
            }),
        });
    }

    const slotsWithItem = findInventorySlotsWithItem({ inventory, itemName: item.info._name });
    if (slotsWithItem.length > 0) {
        for (const slot of slotsWithItem) {
            if (slot._amount < slot._maxAmount) {
                if (slot._amount + itemAmount <= slot._maxAmount) {
                    slot._amount += itemAmount;

                    event({ type: EventTypes.INVENTORY_UPDATE });

                    return { success: true };
                }

                const itemAmountRemaining = slot._amount + itemAmount - slot._maxAmount;
                slot._amount = slot._maxAmount;

                return addItemToInventory({
                    entityId,
                    item,
                    itemAmount: itemAmountRemaining,
                });
            }
        }
    }

    if (slotAvailable(inventory)) {
        if (itemAmount <= itemRule.maxAmount) {
            addInventorySlot({
                inventory,
                item,
                itemAmount,
                itemMaxAmount: itemRule.maxAmount,
            });

            event({ type: EventTypes.INVENTORY_UPDATE });

            return { success: true };
        }

        const itemAmountRemaining = itemAmount - itemRule.maxAmount;
        addInventorySlot({
            inventory,
            item,
            itemAmount: itemRule.maxAmount,
            itemMaxAmount: itemRule.maxAmount,
        });

        return addItemToInventory({
            entityId,
            item,
            itemAmount: itemAmountRemaining,
        });
    }

    event({ type: EventTypes.INVENTORY_UPDATE });

    return { amountRemaining: itemAmount, success: false };
};

export const removeItemFromInventory = ({ entityId, itemName, itemAmount, slotIndex }: {
    entityId?: string | null,
    itemAmount: number,
    itemName: string,
    slotIndex?: number,
}): boolean => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: removeItemFromInventory.name });

    if (invalidItemName(itemName) || invalidItemAmount(itemAmount)) {
        error({ message: `Item ${itemName} is invalid`, where: removeItemFromInventory.name });
    }

    const inventory = getComponent({ componentId: 'Inventory', entityId });

    if (slotIndex) {
        const slot = inventory.slots[slotIndex];
        if (slot._amount <= itemAmount) {
            removeInventorySlots({ inventory, slotsToRemove: [slotIndex] });
        }
        else {
            slot._amount -= itemAmount;
        }
    }
    else {
        const slotsWithItem = findInventorySlotsWithItem({ inventory, itemName });
        if (slotsWithItem.length === 0) {
            return false;
        }

        const itemAmountInInventory = slotsWithItem.reduce((acc, slot) => acc + slot._amount, 0);
        if (itemAmountInInventory < itemAmount) {
            return false;
        }

        const slotsToRemove: number[] = [];
        for (const slot of slotsWithItem) {
            if (itemAmount === 0) {
                break;
            }
            if (slot._amount <= itemAmount) {
                itemAmount -= slot._amount;
                slotsToRemove.push(inventory.slots.indexOf(slot));
            } else {
                slot._amount -= itemAmount;
                itemAmount = 0;
            }
        }

        if (itemAmount !== 0) {
            return false;
        }

        removeInventorySlots({ inventory, slotsToRemove });
    }

    event({ type: EventTypes.INVENTORY_UPDATE });

    return true;
};

export const activateInventoryTool = ({ entityId }: {
    entityId?: string | null,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: activateInventoryTool.name });

    const inventory = getComponent({ componentId: 'Inventory', entityId });

    if (!(inventory.tools.length)) {
        event({ data: { message: 'Je n\'ai pas d\'outils' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'inventory_tool_empty' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: 'No tools in inventory',
            where: activateInventoryTool.name,
        });
    }

    const activeTool = inventory.tools.find((tool) => tool._active);
    if (activeTool) {
        const inactiveTool = (inventory.tools.indexOf(activeTool) !== inventory.tools.length - 1)
            ? inventory.tools.find((tool) => tool._active === false)
            : null;

        if (inactiveTool) {
            inactiveTool._active = true;
            activeTool._active = false;

            event({ data: { audioName: 'inventory_tool_active' }, type: EventTypes.AUDIO_PLAY });
        }
        else {
            activeTool._active = false;

            event({ data: { audioName: 'inventory_tool_empty' }, type: EventTypes.AUDIO_PLAY });
        }
    }
    else {
        inventory.tools[0]._active = true;

        event({ data: { audioName: 'inventory_tool_active' }, type: EventTypes.AUDIO_PLAY });
    }

    event({ type: EventTypes.INVENTORY_TOOL_ACTIVATE });
};

export const checkInventory = ({ entityId, items }: {
    entityId?: string | null,
    items: { amount: number, name: string }[],
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: activateInventoryTool.name });

    const inventory = getComponent({ componentId: 'Inventory', entityId });

    for (const item of items) {
        if (itemIsTool({ itemName: item.name })) {
            const inventoryTool = findInventoryTool({ inventory, toolName: item.name });

            return !!(inventoryTool);
        }

        const slotsWithItem = findInventorySlotsWithItem({ inventory, itemName: item.name });
        if (slotsWithItem.length === 0) {
            return false;
        }
        else {
            const itemAmountInInventory = slotsWithItem.reduce((acc, slot) => acc + slot._amount, 0);
            if (itemAmountInInventory < item.amount) {
                return false;
            }
        }
    }

    return true;
};
//#endregion
