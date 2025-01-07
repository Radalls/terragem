import { createMenus, createUI, displayBoot, displayLaunch, initScroll } from '@/render/templates';

export const main = () => {
    createMenus();
    createUI();

    displayBoot({ display: true });
};

export const launch = () => {
    displayBoot({ display: false });
    displayLaunch({ display: true });
};

export const run = () => {
    displayLaunch({ display: false });
    initScroll();
};
