import { Gems, State } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { gemHasItems, getGem, getGemStat, getGemType } from '@/engine/systems/gem';
import { getCraftData } from '@/engine/systems/item';
import { RenderEvents } from '@/render/events';
import {
    checkElement,
    createButton,
    createElement,
    displayGemUI,
    getElement,
    searchElementsByClassName,
} from '@/render/templates';

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
        click: () => {
            emit({
                data: 'Settings is WIP',
                target: 'render',
                type: RenderEvents.INFO_ALERT,
            });
        },
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

const ADMIN_TAB_BORDER = 'solid 5px rgb(255, 255, 255)';
const ADMIN_TAB_BORDER_SELECT = 'solid 5px rgb(255, 231, 94)';
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

    createStorage();
    createGems();
    createWorkshop();
    createLabs();
};

export const displayAdminMenu = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const adminEl = getElement({ elId: 'Admin' });

    adminEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        selectAdminTab({ tab: AdminTabs.STORAGE });
    }
    else {
        selectAdminTab({});
    }
};

const selectAdminTab = ({ tab }: { tab?: string }) => {
    const adminTabsEls = searchElementsByClassName({ className: 'tab', parent: 'Admin' });

    adminTabsEls.forEach((adminTabEl) => adminTabEl.style.border = ADMIN_TAB_BORDER);

    if (tab) {
        const tabEl = getElement({ elId: tab });
        tabEl.style.border = ADMIN_TAB_BORDER_SELECT;

        updateAdminContent({ tab });
    }
};

const updateAdminContent = ({ tab, page }: {
    page?: number,
    tab: string,
}) => {
    displayStorage({ display: false });
    displayGems({ display: false });
    displayWorkshop({ display: false });
    displayLabs({ display: false });

    if (tab === AdminTabs.STORAGE) {
        updateStorage();
        displayStorage({ display: true });
    }
    else if (tab === AdminTabs.GEMS) {
        updateGems();
        displayGems({ display: true, page });
    }
    else if (tab === AdminTabs.WORKSHOP) {
        updateWorkshop();
        displayWorkshop({ display: true, page });
    }
    else if (tab === AdminTabs.LAB) {
        updateLabs();
        displayLabs({ display: true, page });
    }
};

//#region STORAGE
const createStorage = () => {
    createElement({
        absolute: false,
        css: 'storage',
        id: 'ContentStorage',
        parent: 'AdminContent',
    });
};

export const updateStorage = () => {
    const admin = getAdmin();

    for (const item of admin.items) {
        const itemEl = checkElement({ id: `Item${item._name}` });

        if (itemEl) {
            const itemAmountEl = getElement({ elId: `ItemAmount${item._name}` });

            itemAmountEl.innerText = `x${item._amount}`;
        }
        else {
            createStorageItem({ itemAmount: item._amount, itemName: item._name });
        }
    }
};

const createStorageItem = ({ itemName, itemAmount }: {
    itemAmount: number;
    itemName: string;
}) => {
    createElement({
        absolute: false,
        css: 'item',
        id: `Item${itemName}`,
        parent: 'ContentStorage',
    });

    createElement({
        absolute: false,
        css: 'label',
        id: `ItemLabel${itemName}`,
        parent: `Item${itemName}`,
        text: itemName,
    });

    createElement({
        css: 'amount',
        id: `ItemAmount${itemName}`,
        parent: `Item${itemName}`,
        text: `x${itemAmount}`,
    });
};

export const displayStorage = ({ display }: { display: boolean }) => {
    const storageEl = getElement({ elId: 'ContentStorage' });

    storageEl.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion

//#region GEMS
//#region CONSTANTS
let GEMS_PAGE_INDEX = 0;
const GEMS_AMOUNT_PER_PAGE = 4;
//#endregion

const createGems = () => {
    createElement({
        absolute: false,
        css: 'gems',
        id: 'ContentGems',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'page',
        id: 'GemsPage',
        parent: 'ContentGems',
    });

    createGemsActions();
};

//#region CREATE
const createGemsActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'GemsActions',
        parent: 'ContentGems',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'previous' }),
        css: 'action',
        id: 'GemsPagePrevious',
        parent: 'GemsActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'next' }),
        css: 'action',
        id: 'GemsPageNext',
        parent: 'GemsActions',
        text: '>',
    });
};

const createGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    createElement({
        absolute: false,
        css: 'gem',
        id: `Gem${gemId}`,
        parent: 'GemsPage',
    });

    createElement({
        absolute: false,
        css: 'sprite',
        id: `GemSprite${gemId}`,
        image: gemSprite._image,
        parent: `Gem${gemId}`,
    });

    createGemData({ gemAction: gemState._action, gemId, gemType });

    if (gemType === Gems.MINE) {
        createGemMine({ gemId });
    }
    else if (gemType === Gems.CARRY) {
        createGemCarry({ gemId });
    }
    else if (gemType === Gems.TUNNEL) {
        createGemTunnel({ gemId });
    }
    else if (gemType === Gems.LIFT) {
        createGemLift({ gemId });
    }
    else throw error({
        message: `Gem ${gemId} has no type`,
        where: createGem.name,
    });

    createGemActions({ gemId });
};

const createGemData = ({ gemId, gemType, gemAction }: {
    gemAction: State['_action'],
    gemId: string,
    gemType: Gems,
}) => {
    const gem = getGem({ gemId });

    createElement({
        absolute: false,
        css: 'data',
        id: `GemData${gemId}`,
        parent: `Gem${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'infos',
        id: `GemInfo${gemId}`,
        parent: `GemData${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'stats',
        id: `GemStats${gemId}`,
        parent: `GemData${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `GemLabel${gemId}`,
        parent: `GemInfo${gemId}`,
        text: gemId,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `GemType${gemId}`,
        parent: `GemInfo${gemId}`,
        text: `Type: ${gemType}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `GemState${gemId}`,
        parent: `GemInfo${gemId}`,
        text: `State: ${gemAction}`,
    });

    if (gemHasItems(gem)) {
        createElement({
            absolute: false,
            css: 'stat',
            id: `ItemCapacity${gemId}`,
            parent: `GemStats${gemId}`,
            text: `Item Capacity: ${getGemStat({ gemId, gemType, stat: '_itemCapacity' })}`,
        });
    }

    createElement({
        absolute: false,
        css: 'stat',
        id: `MoveSpeed${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Move Speed: ${getGemStat({ gemId, gemType, stat: '_moveSpeed' })}`,
    });
};

const createGemMine = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `MineSpeed${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Mine Speed: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `MineStrength${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Mine Strength: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `MineAmount${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Mine Amount: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digAmount' })}`,
    });
};

const createGemCarry = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemSpeed${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemAmount${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Item Amount: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemRange${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Item Range: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemRange' })}`,
    });
};

const createGemTunnel = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelSpeed${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Tunnel Speed: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelStrength${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Tunnel Strength: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelRange${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Tunnel Range: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digRange' })}`,
    });
};

const createGemLift = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemSpeed${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemAmount${gemId}`,
        parent: `GemStats${gemId}`,
        text: `Item Amount: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemAmount' })}`,
    });
};

const createGemActions = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'actions',
        id: `GemActions${gemId}`,
        parent: `Gem${gemId}`,
    });

    createButton({
        absolute: false,
        click: () => onClickGemView({ gemId }),
        css: 'view',
        id: `GemView${gemId}`,
        parent: `GemActions${gemId}`,
        text: 'View',
    });

    createButton({
        absolute: false,
        click: () => onClickGemDeploy({ gemId }),
        css: 'deploy',
        id: `GemDeploy${gemId}`,
        parent: `GemActions${gemId}`,
        text: 'Deploy',
    });
};

const onClickGemView = ({ gemId }: { gemId: string }) => {
    displayAdminMenu({ display: false });
    displayMenus({ display: false });

    displayGemUI({ display: true, gemId });
};

const onClickGemDeploy = ({ gemId }: { gemId: string }) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    emit({
        entityId: gemId, target: 'all', type: (gemState._store)
            ? GameEvents.GEM_STORE_DEPLOY
            : GameEvents.GEM_STORE,
    });

    updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });
};
//#endregion

//#region UPDATE
export const updateGems = () => {
    const admin = getAdmin();

    for (const gem of admin.gems) {
        const gemEl = checkElement({ id: `Gem${gem}` });

        if (gemEl) {
            updateGem({ gemId: gem });
        }
        else {
            createGem({ gemId: gem });
        }
    }
};

const updateGemsPage = () => {
    const admin = getAdmin();
    const gemsPageEl = getElement({ elId: 'GemsPage' });

    for (let i = 0; i < gemsPageEl.children.length; i++) {
        const gemEl = gemsPageEl.children[i] as HTMLElement;
        gemEl.style.display = 'none';
    }

    const gemStartIndex = GEMS_PAGE_INDEX * GEMS_AMOUNT_PER_PAGE;
    const gemEndIndex = gemStartIndex + GEMS_AMOUNT_PER_PAGE;
    for (let j = gemStartIndex; j < gemEndIndex; j++) {
        if (j >= admin.gems.length) break;

        const craftEl = gemsPageEl.children[j] as HTMLElement;

        craftEl.style.display = 'flex';
    }
};

const updateGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    updateGemData({ gemAction: gemState._action, gemId, gemType });

    if (gemType === Gems.MINE) {
        updateGemMine({ gemId });
    }
    else if (gemType === Gems.CARRY) {
        updateGemCarry({ gemId });
    }
    else if (gemType === Gems.TUNNEL) {
        updateGemTunnel({ gemId });
    }
    else if (gemType === Gems.LIFT) {
        updateGemLift({ gemId });
    }
    else throw error({
        message: `Gem ${gemId} has no type`,
        where: createGem.name,
    });

    updateGemActions({ gemId, gemStore: gemState._store });
};

const updateGemData = ({ gemId, gemType, gemAction }: {
    gemAction: State['_action'],
    gemId: string,
    gemType: Gems,
}) => {
    const gem = getGem({ gemId });

    const gemStateEl = getElement({ elId: `GemState${gemId}` });
    gemStateEl.innerText = `State: ${gemAction}`;

    if (gemHasItems(gem)) {
        const gemItemCapacityEl = getElement({ elId: `ItemCapacity${gemId}` });
        gemItemCapacityEl.innerText
            = `Item Capacity: ${getGemStat({ gemId, gemType, stat: '_itemCapacity' })}`;
    }

    const gemMoveSpeedEl = getElement({ elId: `MoveSpeed${gemId}` });
    gemMoveSpeedEl.innerText
        = `Move Speed: ${getGemStat({ gemId, gemType, stat: '_moveSpeed' })}`;
};

const updateGemMine = ({ gemId }: { gemId: string }) => {
    const gemMineSpeedEl = getElement({ elId: `MineSpeed${gemId}` });
    gemMineSpeedEl.innerText
        = `Mine Speed: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digSpeed' })}`;

    const gemMineStrengthEl = getElement({ elId: `MineStrength${gemId}` });
    gemMineStrengthEl.innerText
        = `Mine Strength: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digStrength' })}`;

    const gemMineAmountEl = getElement({ elId: `MineAmount${gemId}` });
    gemMineAmountEl.innerText
        = `Mine Amount: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digAmount' })}`;
};

const updateGemCarry = ({ gemId }: { gemId: string }) => {
    const gemItemSpeedEl = getElement({ elId: `ItemSpeed${gemId}` });
    gemItemSpeedEl.innerText
        = `Item Speed: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemSpeed' })}`;

    const gemItemAmountEl = getElement({ elId: `ItemAmount${gemId}` });
    gemItemAmountEl.innerText
        = `Item Amount: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' })}`;

    const gemItemRangeEl = getElement({ elId: `ItemRange${gemId}` });
    gemItemRangeEl.innerText
        = `Item Range: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemRange' })}`;
};

const updateGemTunnel = ({ gemId }: { gemId: string }) => {
    const gemTunnelSpeedEl = getElement({ elId: `TunnelSpeed${gemId}` });
    gemTunnelSpeedEl.innerText
        = `Tunnel Speed: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digSpeed' })}`;

    const gemTunnelStrengthEl = getElement({ elId: `TunnelStrength${gemId}` });
    gemTunnelStrengthEl.innerText
        = `Tunnel Strength: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digStrength' })}`;

    const gemTunnelRangeEl = getElement({ elId: `TunnelRange${gemId}` });
    gemTunnelRangeEl.innerText
        = `Tunnel Range: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digRange' })}`;
};

const updateGemLift = ({ gemId }: { gemId: string }) => {
    const gemItemSpeedEl = getElement({ elId: `ItemSpeed${gemId}` });
    gemItemSpeedEl.innerText
        = `Item Speed: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemSpeed' })}`;

    const gemItemAmountEl = getElement({ elId: `ItemAmount${gemId}` });
    gemItemAmountEl.innerText
        = `Item Amount: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemAmount' })}`;
};

const updateGemActions = ({ gemId, gemStore }: {
    gemId: string,
    gemStore: State['_store'],
}) => {
    const gemViewEl = getElement({ elId: `GemView${gemId}` });
    gemViewEl.style.display = (gemStore)
        ? 'none'
        : 'block';

    const gemStoreEl = getElement({ elId: `GemDeploy${gemId}` });
    gemStoreEl.innerText = (gemStore)
        ? 'Deploy'
        : 'Store';
};
//#endregion

const onClickGemsPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const gemsPagesCount = Math.ceil(admin.gems.length / GEMS_AMOUNT_PER_PAGE);

    if (action === 'previous') {
        GEMS_PAGE_INDEX = Math.max(0, GEMS_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        GEMS_PAGE_INDEX = Math.min(GEMS_PAGE_INDEX + 1, gemsPagesCount - 1);
    }

    updateGemsPage();
};

export const displayGems = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const gemsEl = getElement({ elId: 'ContentGems' });

    gemsEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        GEMS_PAGE_INDEX = page ?? 0;

        updateGemsPage();
    }
};
//#endregion

//#region WORKSHOP
//#region CONSTANTS
let WORKSHOP_PAGE_INDEX = 0;
const WORKSHOP_AMOUNT_PER_PAGE = 4;
//#endregion

//#region CREATE
const createWorkshop = () => {
    createElement({
        absolute: false,
        css: 'workshop',
        id: 'ContentWorkshop',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'page',
        id: 'WorkshopPage',
        parent: 'ContentWorkshop',
    });

    createWorkshopActions();
};

const createWorkshopActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'WorkshopActions',
        parent: 'ContentWorkshop',
    });

    createButton({
        absolute: false,
        click: () => onClickWorkshopPage({ action: 'previous' }),
        css: 'action',
        id: 'WorkshopPagePrevious',
        parent: 'WorkshopActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickWorkshopPage({ action: 'next' }),
        css: 'action',
        id: 'WorkshopPageNext',
        parent: 'WorkshopActions',
        text: '>',
    });
};

const createWorkshopCraft = ({ craft }: { craft: string }) => {
    const craftData = getCraftData({ itemName: craft });

    createElement({
        absolute: false,
        css: 'craft',
        id: `Craft${craft}`,
        parent: 'WorkshopPage',
    });

    createElement({
        absolute: false,
        css: 'data',
        id: `CraftData${craft}`,
        parent: `Craft${craft}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `CraftInfo${craft}`,
        parent: `CraftData${craft}`,
    });

    createElement({
        absolute: false,
        css: 'name',
        id: `CraftName${craft}`,
        parent: `CraftInfo${craft}`,
        text: craftData.name,
    });

    createElement({
        absolute: false,
        css: 'text',
        id: `CraftText${craft}`,
        parent: `CraftInfo${craft}`,
        text: craftData.text,
    });

    createElement({
        absolute: false,
        css: 'components',
        id: `CraftComponents${craft}`,
        parent: `CraftData${craft}`,
    });

    for (const comp of craftData.components) {
        createElement({
            absolute: false,
            css: 'comp',
            id: `CraftComp${craft}${comp.name}`,
            parent: `CraftComponents${craft}`,
            text: `${comp.name} x${comp.amount}`,
        });
    }

    createButton({
        absolute: false,
        click: () => {
            emit({ data: craft, target: 'engine', type: EngineEvents.CRAFT_REQUEST });

            updateAdminContent({ page: WORKSHOP_PAGE_INDEX, tab: AdminTabs.WORKSHOP });
        },
        css: 'run',
        id: `CraftRun${craft}`,
        parent: `Craft${craft}`,
        text: 'Craft',
    });
};
//#endregion

//#region UPDATE
export const updateWorkshop = () => {
    const admin = getAdmin();

    for (const craft of admin.crafts) {
        const craftEl = checkElement({ id: `Craft${craft}` });

        if (!(craftEl)) {
            createWorkshopCraft({ craft });
        }
    }
};

const updateWorkshopPage = () => {
    const admin = getAdmin();
    const workshopPageEl = getElement({ elId: 'WorkshopPage' });

    for (let i = 0; i < workshopPageEl.children.length; i++) {
        const craftEl = workshopPageEl.children[i] as HTMLElement;
        craftEl.style.display = 'none';
    }

    const craftStartIndex = WORKSHOP_PAGE_INDEX * WORKSHOP_AMOUNT_PER_PAGE;
    const craftEndIndex = craftStartIndex + WORKSHOP_AMOUNT_PER_PAGE;
    for (let j = craftStartIndex; j < craftEndIndex; j++) {
        if (j >= admin.crafts.length) break;

        const craftEl = workshopPageEl.children[j] as HTMLElement;

        craftEl.style.display = 'flex';
    }
};
//#endregion

const onClickWorkshopPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const workshopPagesCount = Math.ceil(admin.crafts.length / WORKSHOP_AMOUNT_PER_PAGE);

    if (action === 'previous') {
        WORKSHOP_PAGE_INDEX = Math.max(0, WORKSHOP_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        WORKSHOP_PAGE_INDEX = Math.min(WORKSHOP_PAGE_INDEX + 1, workshopPagesCount - 1);
    }

    updateWorkshopPage();
};

export const displayWorkshop = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const workshopEl = getElement({ elId: 'ContentWorkshop' });

    workshopEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        WORKSHOP_PAGE_INDEX = page ?? 0;

        updateWorkshopPage();
    }
};
//#endregion

//#region LAB
//#region CONSTANTS
let LAB_PAGE_INDEX = 0;
const LAB_AMOUNT_PER_PAGE = 5;
//#endregion

//#region CREATE
const createLabs = () => {
    createElement({
        absolute: false,
        css: 'labs',
        id: 'ContentLabs',
        parent: 'AdminContent',
    });

    createLabStats();

    createElement({
        absolute: false,
        css: 'page',
        id: 'LabPage',
        parent: 'ContentLabs',
    });

    createLabActions();
};

const createLabStats = () => {
    const admin = getAdmin();

    createElement({
        absolute: false,
        css: 'stats',
        id: 'LabStats',
        parent: 'ContentLabs',
    });

    createElement({
        absolute: false,
        id: 'LabPoints',
        parent: 'LabStats',
        text: `Lab Points: ${admin.stats._labPoints}`,
    });

    createElement({
        absolute: false,
        id: 'GemMax',
        parent: 'LabStats',
        text: `Max Gem: ${admin.stats._gemMax}`,
    });
};

const createLabActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'LabActions',
        parent: 'ContentLabs',
    });

    createButton({
        absolute: false,
        click: () => onClickLabPage({ action: 'previous' }),
        css: 'action',
        id: 'LabPagePrevious',
        parent: 'LabActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickLabPage({ action: 'next' }),
        css: 'action',
        id: 'LabPageNext',
        parent: 'LabActions',
        text: '>',
    });
};

const createLab = ({ labName, labText, labCost, labProgress, labTime }: {
    labCost: number,
    labName: string,
    labProgress: number,
    labText: string,
    labTime: number
}) => {
    createElement({
        absolute: false,
        css: 'lab',
        id: `Lab${labName}`,
        parent: 'LabPage',
    });

    createElement({
        absolute: false,
        css: 'text',
        id: `LabText${labName}`,
        parent: `Lab${labName}`,
        text: labText,
    });

    createElement({
        absolute: false,
        css: 'cost',
        id: `LabCost${labName}`,
        parent: `Lab${labName}`,
        text: `Cost: ${labCost}`,
    });

    createElement({
        absolute: false,
        css: 'run',
        id: `LabRun${labName}`,
        parent: `Lab${labName}`,
        text: `Running: ${labProgress}/${labTime}`,
    });

    createElement({
        absolute: false,
        css: 'done',
        id: `LabDone${labName}`,
        parent: `Lab${labName}`,
        text: 'Done !',
    });

    createButton({
        absolute: false,
        click: () => {
            emit({ data: labName, target: 'engine', type: EngineEvents.LAB_RUN });

            updateAdminContent({ page: LAB_PAGE_INDEX, tab: AdminTabs.LAB });
        },
        css: 'start',
        id: `LabStart${labName}`,
        parent: `Lab${labName}`,
        text: 'Start',
    });
};
//#endregion

//#region UPDATE
export const updateLabs = () => {
    const admin = getAdmin();

    const labPointsEl = getElement({ elId: 'LabPoints' });
    labPointsEl.innerText = `Lab Points: ${admin.stats._labPoints}`;

    const gemMaxEl = getElement({ elId: 'GemMax' });
    gemMaxEl.innerText = `Max Gem: ${admin.stats._gemMax}`;

    for (const lab of admin.labs) {
        const labEl = checkElement({ id: `Lab${lab.data.name}` });

        if (labEl) {
            if (lab._done) {
                const labDoneEl = getElement({ elId: `LabDone${lab.data.name}` });
                labDoneEl.style.display = 'block';

                const labCostEl = getElement({ elId: `LabCost${lab.data.name}` });
                labCostEl.style.display = 'none';

                const labRunEl = getElement({ elId: `LabRun${lab.data.name}` });
                labRunEl.style.display = 'none';
            }

            if (lab._run) {
                const labRunEl = getElement({ elId: `LabRun${lab.data.name}` });
                labRunEl.innerText = `Running: ${lab._progress}/${lab.data.time}`;
            }
        }
        else {
            createLab({
                labCost: lab.data.cost,
                labName: lab.data.name,
                labProgress: lab._progress,
                labText: lab.data.text,
                labTime: lab.data.time,
            });
        }
    }
};

const updateLabPage = () => {
    const admin = getAdmin();
    const labPageEl = getElement({ elId: 'LabPage' });

    for (let i = 0; i < labPageEl.children.length; i++) {
        const labEl = labPageEl.children[i] as HTMLElement;
        labEl.style.display = 'none';
    }

    const labStartIndex = LAB_PAGE_INDEX * LAB_AMOUNT_PER_PAGE;
    const labEndIndex = labStartIndex + LAB_AMOUNT_PER_PAGE;
    for (let j = labStartIndex; j < labEndIndex; j++) {
        if (j >= admin.labs.length) break;

        const labEl = labPageEl.children[j] as HTMLElement;

        labEl.style.display = 'flex';
    }
};
//#endregion

const onClickLabPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const labTabsCount = Math.ceil(admin.labs.length / LAB_AMOUNT_PER_PAGE);

    if (action === 'previous') {
        LAB_PAGE_INDEX = Math.max(0, LAB_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        LAB_PAGE_INDEX = Math.min(LAB_PAGE_INDEX + 1, labTabsCount - 1);
    }

    updateLabPage();
};

export const displayLabs = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const labEl = getElement({ elId: 'ContentLabs' });

    labEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        LAB_PAGE_INDEX = page ?? 0;

        updateLabPage();
    }
};
//#endregion
//#endregion
//#endregion
