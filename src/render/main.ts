import {
    createDayTime,
    createError,
    createFrame,
    createLaunchMenu,
    createLoading,
    createQuestMenu,
    createSettingsMenu,
} from './templates';

import { initAudios } from '@/engine/services/audio';
import { onKeyDown, onKeyUp } from '@/engine/services/input';

//#region CONSTANTS
export const app = document.getElementById('app')!;
//#endregion

export const main = () => {
    launch();
};

export const run = () => {
    initGameMenus();
};

const launch = () => {
    createFrame();
    createLoading();
    createError();

    initEvents();
    initMenus();
    initAudios();
};

const initEvents = () => {
    document.addEventListener('keydown', (event) => onKeyDown(event.key));
    document.addEventListener('keyup', (event) => onKeyUp(event.key));
};

const initMenus = () => {
    createLaunchMenu();
    createSettingsMenu();
};

const initGameMenus = () => {
    createQuestMenu();
    createDayTime();
};

