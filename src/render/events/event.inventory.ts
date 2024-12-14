import {
    activateInventoryTool,
    createInventory,
    displayInventory,
    displayInventoryOption,
    displayInventoryToolActive,
    selectInventorySlot,
    updateInventory,
    updateInventoryOption,
    updateInventoryTools,
} from '@/render/templates';

//#region EVENTS
export const onInventoryCreate = () => createInventory();

export const onInventoryDisplay = () => displayInventory();

export const onInventoryUpdate = () => updateInventory();

export const onInventoryOptionDisplay = () => displayInventoryOption();

export const onInventoryOptionUpdate = () => updateInventoryOption();

export const onInventorySelectSlot = () => selectInventorySlot();

export const onInventoryToolActivate = () => activateInventoryTool();

export const onInventoryToolActiveDisplay = () => displayInventoryToolActive();

export const onInventoryToolsUpdate = () => updateInventoryTools();
//#endregion
