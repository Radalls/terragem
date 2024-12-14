import { emit, GameEventTypes } from '@/engine/services/emit';
import { getAdmin, getComponent } from '@/engine/systems/entities';
import { createButton, createElement, getElement, searchElementsByClassName } from '@/render/templates';

//#region CONSTANTS
//#endregion

//#region TEMPLATES
export const createMenus = () => {
    createLaunch();
    createSettings();
};

export const displayMenus = ({ display }: { display: boolean }) => {
    const menusEl = getElement({ elId: 'Menus' });

    menusEl.style.display = (display)
        ? 'flex'
        : 'none';
};

//#region LAUNCH
export const createLaunch = () => {
    createElement({
        css: 'menu launch',
        id: 'Launch',
        parent: 'Menus',
    });

    createButton({
        absolute: false,
        click: () => emit({ target: 'all', type: GameEventTypes.GAME_RUN }),
        css: 'opt',
        id: 'LaunchStart',
        parent: 'Launch',
        text: 'Start',
    });

    createButton({
        absolute: false,
        click: () => { },
        css: 'opt',
        id: 'LaunchSettings',
        parent: 'Launch',
        text: 'Settings',
    });
};

export const displayLaunch = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const launchEl = getElement({ elId: 'Launch' });

    launchEl.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion

//#region SETTINGS
export const createSettings = () => {
    createElement({
        css: 'menu settings',
        id: 'Settings',
        parent: 'Menus',
    });
};

export const displaySettings = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const settingsEl = getElement({ elId: 'Settings' });

    settingsEl.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion

//#region ADMIN
//#region CONSTANTS
enum AdminTabs {
    STORAGE = 'Storage',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    GEMS = 'Gems',
    WORKSHOP = 'Workshop',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    LAB = 'Lab',
}

const adminTabBorder = 'solid 5px rgb(255, 255, 255)';
const adminTabBorderSelect = 'solid 5px rgb(255, 231, 94)';
//#endregion

export const createAdminMenu = () => {
    createElement({
        css: 'menu admin',
        id: 'Admin',
        parent: 'Menus',
    });

    createElement({
        absolute: false,
        css: 'tabs',
        id: 'AdminTabs',
        parent: 'Admin',
    });

    createElement({
        absolute: false,
        css: 'content',
        id: 'AdminContent',
        parent: 'Admin',
    });

    createButton({
        absolute: false,
        click: () => displayAdminMenu({ display: false }),
        css: 'tab',
        id: 'AdminBack',
        parent: 'AdminTabs',
        text: 'Back',
    });

    for (const tab of Object.values(AdminTabs)) {
        createButton({
            absolute: false,
            click: () => selectAdminTab({ tab }),
            css: 'tab',
            id: tab,
            parent: 'AdminTabs',
            text: tab,
        });
    }
};

export const displayAdminMenu = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const adminEl = getElement({ elId: 'Admin' });

    adminEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) selectAdminTab({ tab: AdminTabs.STORAGE });
    else selectAdminTab({});
};

const selectAdminTab = ({ tab }: { tab?: string }) => {
    const adminTabsEls = searchElementsByClassName({ className: 'tab', parent: 'Admin' });

    adminTabsEls.forEach((adminTabEl) => adminTabEl.style.border = adminTabBorder);

    if (tab) {
        const tabEl = getElement({ elId: tab });

        tabEl.style.border = adminTabBorderSelect;

        updateAdminContent({ tab });
    }
};

const updateAdminContent = ({ tab }: { tab: string }) => {
    const admin = getAdmin();

    const adminContentEl = getElement({ elId: 'AdminContent' });
    adminContentEl.innerHTML = '';

    if (tab === AdminTabs.STORAGE) {
        adminContentEl.style.flexDirection = 'row';

        for (const item of admin.items) {
            createElement({
                absolute: false,
                css: 'item',
                id: `AdminContentItem${item._type}`,
                parent: 'AdminContent',
            });

            createElement({
                absolute: false,
                css: 'label',
                id: `AdminContentItemLabel${item._type}`,
                parent: `AdminContentItem${item._type}`,
                text: item._type,
            });

            createElement({
                css: 'amount',
                id: `AdminContentItemAmount${item._type}`,
                parent: `AdminContentItem${item._type}`,
                text: `x${item._amount}`,
            });
        }
    }
    else if (tab === AdminTabs.GEMS) {
        adminContentEl.style.flexDirection = 'column';

        for (const gem of admin.gems) {
            createElement({
                absolute: false,
                css: 'gem',
                id: `AdminContentGem${gem}`,
                parent: 'AdminContent',
                text: gem,
            });

            const gemState = getComponent({ componentId: 'State', entityId: gem });

            if (gemState._store) {
                createButton({
                    absolute: false,
                    click: () => {
                        emit({ entityId: gem, target: 'all', type: GameEventTypes.GEM_STORE_DEPLOY });

                        updateAdminContent({ tab });
                    },
                    css: 'deploy',
                    id: `AdminContentGemDeploy${gem}`,
                    parent: `AdminContentGem${gem}`,
                    text: 'Deploy',
                });
            }
            else {
                createElement({
                    absolute: false,
                    css: 'state',
                    id: `AdminContentGemState${gem}`,
                    parent: `AdminContentGem${gem}`,
                    text: `State: ${gemState._action}`,
                });
            }
        }
    }
    else if (tab === AdminTabs.WORKSHOP) {
        adminContentEl.style.flexDirection = 'column';

        adminContentEl.innerHTML = '(WIP)';
    }
    else if (tab === AdminTabs.LAB) {
        adminContentEl.style.flexDirection = 'column';

        adminContentEl.innerHTML = '(WIP)';
    }
};
//#endregion
//#endregion
