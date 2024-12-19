import { emit, GameEvents } from '@/engine/services/emit';
import { EngineEvents } from '@/engine/services/event';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { getCraftData } from '@/engine/systems/item';
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
        click: () => emit({ target: 'all', type: GameEvents.GAME_RUN }),
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
    clearAdminContent();

    if (tab === AdminTabs.STORAGE) {
        createContentStorage();
    }
    else if (tab === AdminTabs.GEMS) {
        createContentGems();
    }
    else if (tab === AdminTabs.WORKSHOP) {
        createContentWorkshop();
    }
    else if (tab === AdminTabs.LAB) {
        createContentLab();
    }
};

const clearAdminContent = () => {
    const adminContentEl = getElement({ elId: 'AdminContent' });
    adminContentEl.innerHTML = '';
};

const createContentStorage = () => {
    const admin = getAdmin();
    const adminContentEl = getElement({ elId: 'AdminContent' });

    adminContentEl.style.flexDirection = 'row';

    for (const item of admin.items) {
        createElement({
            absolute: false,
            css: 'item',
            id: `Item${item._name}`,
            parent: 'AdminContent',
        });

        createElement({
            absolute: false,
            css: 'label',
            id: `ItemLabel${item._name}`,
            parent: `Item${item._name}`,
            text: item._name,
        });

        createElement({
            css: 'amount',
            id: `ItemAmount${item._name}`,
            parent: `Item${item._name}`,
            text: `x${item._amount}`,
        });
    }
};

const createContentGems = () => {
    const admin = getAdmin();
    const adminContentEl = getElement({ elId: 'AdminContent' });

    adminContentEl.style.flexDirection = 'column';

    for (const gem of admin.gems) {
        createElement({
            absolute: false,
            css: 'gem',
            id: `Gem${gem}`,
            parent: 'AdminContent',
            text: gem,
        });

        const gemState = getComponent({ componentId: 'State', entityId: gem });

        if (gemState._store) {
            createButton({
                absolute: false,
                click: () => {
                    emit({ entityId: gem, target: 'all', type: GameEvents.GEM_STORE_DEPLOY });

                    updateAdminContent({ tab: AdminTabs.GEMS });
                },
                css: 'deploy',
                id: `GemDeploy${gem}`,
                parent: `Gem${gem}`,
                text: 'Deploy',
            });
        }
        else {
            createElement({
                absolute: false,
                css: 'state',
                id: `GemState${gem}`,
                parent: `Gem${gem}`,
                text: `State: ${gemState._action}`,
            });
        }
    }
};

const createContentWorkshop = () => {
    const admin = getAdmin();
    const adminContentEl = getElement({ elId: 'AdminContent' });

    adminContentEl.style.flexDirection = 'column';

    for (const craft of admin.crafts) {
        const craftData = getCraftData({ itemName: craft });

        createElement({
            absolute: false,
            css: 'recipe',
            id: `Recipe${craft}`,
            parent: 'AdminContent',
            text: craft,
        });

        createElement({
            absolute: false,
            css: 'items',
            id: `RecipeItems${craft}`,
            parent: `Recipe${craft}`,
        });

        for (const compItem of craftData.components) {
            createElement({
                absolute: false,
                css: 'item',
                id: `RecipeItem${craft}${compItem.name}`,
                parent: `RecipeItems${craft}`,
                text: `${compItem.name} x${compItem.amount}`,
            });
        }

        createButton({
            absolute: false,
            click: () => {
                emit({ data: craft, target: 'engine', type: EngineEvents.CRAFT_REQUEST });

                updateAdminContent({ tab: AdminTabs.WORKSHOP });
            },
            css: 'craft',
            id: `RecipeCraft${craft}`,
            parent: `Recipe${craft}`,
            text: 'Craft',
        });
    }
};

const createContentLab = () => {
    const admin = getAdmin();

    const adminContentEl = getElement({ elId: 'AdminContent' });

    adminContentEl.style.flexDirection = 'column';

    createElement({
        absolute: false,
        id: 'LabPoints',
        parent: 'AdminContent',
        text: `Lab Points: ${admin._labPoints}`,
    });

    createElement({
        absolute: false,
        id: 'GemMax',
        parent: 'AdminContent',
        text: `MAX Gem: ${admin._gemMax}`,
    });

    for (const lab of admin.labs) {
        if (!(lab._done)) {
            createElement({
                absolute: false,
                css: 'lab',
                id: `Lab${lab.data.name}`,
                parent: 'AdminContent',
                text: `${lab.data.text}: ${lab._progress}/${lab.data.time} (Cost: ${lab.data.cost})`,
            });

            if (!(lab._run)) {
                createButton({
                    absolute: false,
                    click: () => {
                        emit({ data: lab.data.name, target: 'engine', type: EngineEvents.LAB_RUN });

                        updateAdminContent({ tab: AdminTabs.LAB });
                    },
                    css: 'run',
                    id: `LabRun${lab.data.name}`,
                    parent: `Lab${lab.data.name}`,
                    text: 'Run',
                });
            }
        }
    }
};
//#endregion
//#endregion
