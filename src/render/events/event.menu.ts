import {
    displayLaunchMenu,
    displaySettingsMenu,
    displaySettingsMenuEdit,
    updateLaunchMenu,
    updateSettingsMenu,
} from '@/render/templates';

//#region EVENTS
//#region LAUNCH MENU
export const onLaunchMenuDisplay = () => displayLaunchMenu();

export const onLaunchMenuUpdate = () => updateLaunchMenu();
//#endregion

//#region SETTINGS MENU
export const onSettingsMenuDisplay = () => displaySettingsMenu();

export const onSettingsMenuUpdate = () => updateSettingsMenu();

export const onSettingsMenuDisplayEdit = () => displaySettingsMenuEdit();
//#endregion
//#endregion
