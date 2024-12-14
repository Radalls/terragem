import { createMenus, createUI, displayLaunch } from '@/render/templates';

export const main = () => {
    launch();
};

const launch = () => {
    createMenus();
    createUI();

    displayLaunch({ display: true });
};

export const run = () => {
    displayLaunch({ display: false });
};
