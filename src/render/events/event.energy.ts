import { createEnergy, displayEnergy, updateEnergy } from '@/render/templates';

//#region EVENTS
export const onEnergyCreate = () => createEnergy();

export const onEnergyDisplay = () => displayEnergy();

export const onEnergyUpdate = () => updateEnergy();
//#endregion
