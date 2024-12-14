import {
    endActivity,
    endActivityBug,
    endActivityCraft,
    endActivityFish,
    endPlayActivityCraft,
    endSelectActivityCraft,
    loseActivity,
    startActivity,
    startActivityBug,
    startActivityCraft,
    startActivityFish,
    startPlayActivityCraft,
    startSelectActivityCraft,
    updateActivityBug,
    updateActivityFish,
    updatePlayActivityCraft,
    updateSelectActivityCraft,
    winActivity,
} from '@/render/templates';

//#region MAIN ACTIVITY
export const onActivityStart = () => startActivity();

export const onActivityWin = () => winActivity();

export const onActivityLose = () => loseActivity();

export const onActivityEnd = () => endActivity();
//#endregion

//#region EVENTS
//#region ACTIVITY BUG
export const onActivityBugStart = () => startActivityBug();

export const onActivityBugUpdate = () => updateActivityBug();

export const onActivityBugEnd = () => endActivityBug();
//#endregion

//#region ACTIVITY FISH
export const onActivityFishStart = () => startActivityFish();

export const onActivityFishUpdate = () => updateActivityFish();

export const onActivityFishEnd = () => endActivityFish();
//#endregion

//#region ACTIVITY CRAFT
export const onActivityCraftStart = () => startActivityCraft();

export const onActivityCraftSelectStart = () => startSelectActivityCraft();

export const onActivityCraftSelectUpdate = () => updateSelectActivityCraft();

export const onActivityCraftSelectEnd = () => endSelectActivityCraft();

export const onActivityCraftPlayStart = () => startPlayActivityCraft();

export const onActivityCraftPlayUpdate = () => updatePlayActivityCraft();

export const onActivityCraftPlayEnd = () => endPlayActivityCraft();

export const onActivityCraftEnd = () => endActivityCraft();
//#endregion
//#endregion
