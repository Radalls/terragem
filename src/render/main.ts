import { createMenus, createUI, displayBoot, displayLaunch, initScroll } from '@/render/templates';

export const main = () => {
    createMenus();

    displayBoot({ display: true });
};

export const launch = () => {
    displayBoot({ display: false });
    displayLaunch({ display: true });

    createUI();
};

export const run = () => {
    displayLaunch({ display: false });

    initScroll();
};
