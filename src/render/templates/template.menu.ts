import { Gems, Items, State } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { gemHasItems, getGem, getGemStat, getGemType } from '@/engine/systems/gem';
import { getCraftData, isItemMech } from '@/engine/systems/item';
import { getProjectVersion } from '@/engine/systems/save';
import { getSpritePath } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';
import {
    checkElement,
    createButton,
    createElement,
    displayAdminUI,
    displayGemView,
    getElement,
    searchElementsByClassName,
} from '@/render/templates';

//#region CONSTANTS
//#endregion

//#region TEMPLATES
export const createMenus = () => {
    createBoot();
    createLaunch();
    createSettings();
};

export const displayMenus = ({ display }: { display: boolean }) => {
    const menusEl = getElement({ elId: 'Menus' });

    menusEl.style.display = (display)
        ? 'flex'
        : 'none';

    setState({ key: 'gamePause', value: display });
};

//#region BOOT
export const createBoot = () => {
    createElement({
        css: 'menu boot',
        id: 'Boot',
        parent: 'Menus',
    });

    createElement({
        css: 'title',
        id: 'BootTitle',
        parent: 'Boot',
        text: 'TERRAGEM',
    });

    createButton({
        click: () => onClickBoot(),
        css: 'opt',
        id: 'BootLaunch',
        parent: 'Boot',
        text: 'Boot',
    });

    createElement({
        css: 'version',
        id: 'BootVersion',
        parent: 'Boot',
        text: `v${getProjectVersion()}`,
    });
};

const onClickBoot = () => {
    emit({ target: 'all', type: GameEvents.GAME_LAUNCH });
    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

export const displayBoot = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const bootEl = getElement({ elId: 'Boot' });

    bootEl.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion

//#region LAUNCH
export const createLaunch = () => {
    createElement({
        css: 'menu launch',
        id: 'Launch',
        parent: 'Menus',
    });

    createElement({
        css: 'title',
        id: 'LaunchTitle',
        parent: 'Launch',
        text: 'TERRAGEM',
    });

    createButton({
        absolute: false,
        click: () => onClickStart(),
        css: 'opt',
        id: 'LaunchStart',
        parent: 'Launch',
        text: 'Start',
    });

    createButton({
        absolute: false,
        click: () => onClickSettings(),
        css: 'opt',
        id: 'LaunchSettings',
        parent: 'Launch',
        text: 'Settings',
    });

    createElement({
        css: 'version',
        id: 'LaunchVersion',
        parent: 'Launch',
        text: `v${getProjectVersion()}`,
    });
};

const onClickStart = () => {
    emit({ target: 'all', type: GameEvents.GAME_RUN });
    emit({ data: { audioName: 'main_start' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    emit({ data: { audioName: 'bgm_menu1' }, target: 'engine', type: EngineEvents.AUDIO_STOP });
    emit({ data: { audioName: 'bgm_game1', loop: true }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickSettings = () => {
    emit({
        data: { text: 'Settings is WIP', type: 'warning' },
        target: 'render',
        type: RenderEvents.INFO,
    });
};

export const displayLaunch = ({ display }: { display: boolean }) => {
    displayMenus({ display });

    const launchEl = getElement({ elId: 'Launch' });

    launchEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        emit({ data: { audioName: 'bgm_menu1', loop: true }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
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
    STORAGE = 'AdminTabStorage',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    GEMS = 'AdminTabGems',
    WORKSHOP = 'AdminTabWorkshop',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    LAB = 'AdminTabLab',
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
            text: tab.replace('AdminTab', ''),
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
        displayAdminUI({ display: false });
    }
    else {
        selectAdminTab({});
        displayAdminUI({ display: true });
    }
};

const selectAdminTab = ({ tab }: { tab?: AdminTabs }) => {
    const adminTabsEls = searchElementsByClassName({ className: 'tab', parent: 'AdminTabs' });

    adminTabsEls.forEach((adminTabEl) => adminTabEl.style.border = ADMIN_TAB_BORDER);

    if (tab) {
        const tabEl = getElement({ elId: tab });
        tabEl.style.border = ADMIN_TAB_BORDER_SELECT;

        updateAdminContent({ tab });

        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
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
        updateAdminGems();
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
        id: 'AdminStorage',
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
    itemName: Items;
}) => {
    createElement({
        absolute: false,
        css: 'item',
        id: `Item${itemName}`,
        parent: 'AdminStorage',
    });

    createElement({
        css: 'icon',
        id: `ItemIcon${itemName}`,
        image: (isItemMech({ itemName }))
            ? getSpritePath({ spriteName: `mech_${itemName.toLowerCase()}` })
            : getSpritePath({ spriteName: `resource_${itemName.toLowerCase()}` }),
        parent: `Item${itemName}`,
    });

    createElement({
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
    const storageEl = getElement({ elId: 'AdminStorage' });

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

//#region CREATE
const createGems = () => {
    createElement({
        absolute: false,
        css: 'gems',
        id: 'AdminGems',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'page',
        id: 'AdminGemsPage',
        parent: 'AdminGems',
    });

    createGemsActions();
};

const createGemsActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'AdminGemsActions',
        parent: 'AdminGems',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'previous' }),
        css: 'action',
        id: 'AdminGemsPagePrevious',
        parent: 'AdminGemsActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'next' }),
        css: 'action',
        id: 'AdminGemsPageNext',
        parent: 'AdminGemsActions',
        text: '>',
    });

    createElement({
        css: 'index',
        id: 'AdminGemsPageIndex',
        parent: 'AdminGemsActions',
        text: '0/0',
    });
};

const createGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    createElement({
        absolute: false,
        css: 'gem',
        id: `AdminGem${gemId}`,
        parent: 'AdminGemsPage',
    });

    createElement({
        absolute: false,
        css: 'sprite',
        id: `AdminGemSprite${gemId}`,
        image: gemSprite._image.replace('_error', ''),
        parent: `AdminGem${gemId}`,
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
        id: `AdminGemData${gemId}`,
        parent: `AdminGem${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'infos',
        id: `AdminGemInfo${gemId}`,
        parent: `AdminGemData${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'stats',
        id: `AdminGemStats${gemId}`,
        parent: `AdminGemData${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `AdminGemLabel${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: gemId,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `AdminGemType${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `Type: ${gemType}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `AdminGemState${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `State: ${gemAction}`,
    });

    createElement({
        absolute: false,
        css: 'info',
        id: `AdminGemLvl${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `Lvl: ${gem._xpLvl}`,
    });

    if (gemHasItems(gem)) {
        createElement({
            absolute: false,
            css: 'stat',
            id: `ItemCapacity${gemId}`,
            parent: `AdminGemStats${gemId}`,
            text: `Item Capacity: ${getGemStat({ gemId, gemType, stat: '_itemCapacity' })}`,
        });
    }

    createElement({
        absolute: false,
        css: 'stat',
        id: `MoveSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Move Speed: ${getGemStat({ gemId, gemType, stat: '_moveSpeed' })}`,
    });
};

const createGemMine = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `MineSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Speed: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `MineStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Strength: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `MineAmount${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Amount: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digAmount' })}`,
    });
};

const createGemCarry = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemAmount${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Amount: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Range: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemRange' })}`,
    });
};

const createGemTunnel = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Speed: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Strength: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `TunnelRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Range: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digRange' })}`,
    });
};

const createGemLift = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: `ItemAmount${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Amount: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemAmount' })}`,
    });
};

const createGemActions = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'actions',
        id: `AdminGemActions${gemId}`,
        parent: `AdminGem${gemId}`,
    });

    createButton({
        absolute: false,
        click: () => onClickGemEquip({ gemId }),
        css: 'equip',
        id: `AdminGemEquip${gemId}`,
        parent: `AdminGemActions${gemId}`,
        text: 'Equip',
    });

    createButton({
        absolute: false,
        click: () => onClickGemView({ gemId }),
        css: 'view',
        id: `AdminGemView${gemId}`,
        parent: `AdminGemActions${gemId}`,
        text: 'View',
    });

    createButton({
        absolute: false,
        click: () => onClickGemDeploy({ gemId }),
        css: 'deploy',
        id: `AdminGemDeploy${gemId}`,
        parent: `AdminGemActions${gemId}`,
        text: 'Deploy',
    });
};
//#endregion

//#region UPDATE
export const updateAdminGems = () => {
    const admin = getAdmin();

    for (const gem of admin.gems) {
        const gemEl = checkElement({ id: `AdminGem${gem}` });

        if (gemEl) {
            updateGem({ gemId: gem });
        }
        else {
            createGem({ gemId: gem });
        }
    }
};

const updateAdminGemsPage = () => {
    const admin = getAdmin();
    const gemsPagesCount = Math.ceil(admin.gems.length / GEMS_AMOUNT_PER_PAGE);

    const gemsPageEl = getElement({ elId: 'AdminGemsPage' });
    const gemsPageIndexEl = getElement({ elId: 'AdminGemsPageIndex' });
    gemsPageIndexEl.innerText = `${GEMS_PAGE_INDEX + 1}/${gemsPagesCount || 1}`;

    if (!(admin.gems.length)) return;

    for (let i = 0; i < gemsPageEl.children.length; i++) {
        const gemEl = gemsPageEl.children[i] as HTMLElement;
        gemEl.style.display = 'none';
    }

    const gemStartIndex = GEMS_PAGE_INDEX * GEMS_AMOUNT_PER_PAGE;
    const gemEndIndex = gemStartIndex + GEMS_AMOUNT_PER_PAGE;
    for (let j = gemStartIndex; j < gemEndIndex; j++) {
        if (j >= admin.gems.length) break;

        const gemEl = gemsPageEl.children[j] as HTMLElement;

        gemEl.style.display = 'flex';
    }
};

const updateGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    const gemSpriteEl = getElement({ elId: `AdminGemSprite${gemId}` });
    gemSpriteEl.style.backgroundImage = `url("${gemSprite._image.replace('_error', '')}")`;

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

    const gemStateEl = getElement({ elId: `AdminGemState${gemId}` });
    gemStateEl.innerText = `State: ${gemAction}`;

    const gemLvlEl = getElement({ elId: `AdminGemLvl${gemId}` });
    gemLvlEl.innerText = `Lvl: ${gem._xpLvl}`;

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
    const admin = getAdmin();
    const gem = getGem({ gemId });

    const gemEquipEl = getElement({ elId: `AdminGemEquip${gemId}` });
    gemEquipEl.innerText = (gem._mech)
        ? 'Unequip'
        : 'Equip';

    gemEquipEl.style.display = (gemStore)
        ? 'none'
        : (admin.mechs.length)
            ? 'block'
            : 'none';

    const gemViewEl = getElement({ elId: `AdminGemView${gemId}` });
    gemViewEl.style.display = (gemStore)
        ? 'none'
        : 'block';

    const gemStoreEl = getElement({ elId: `AdminGemDeploy${gemId}` });
    gemStoreEl.innerText = (gemStore)
        ? 'Deploy'
        : 'Store';
};
//#endregion

//#region ACTIONS
const onClickGemView = ({ gemId }: { gemId: string }) => {
    displayAdminMenu({ display: false });
    displayMenus({ display: false });

    displayGemView({ display: true, gemId });
};

const onClickGemDeploy = ({ gemId }: { gemId: string }) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    emit({
        entityId: gemId, target: 'all', type: (gemState._store)
            ? GameEvents.GEM_STORE_DEPLOY
            : GameEvents.GEM_STORE,
    });

    updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });

    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemEquip = ({ gemId }: { gemId: string }) => {
    emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_EQUIP });

    updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });

    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemsPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const gemsPagesCount = Math.ceil(admin.gems.length / GEMS_AMOUNT_PER_PAGE);

    if (!(admin.gems.length)) return;

    if (action === 'previous') {
        GEMS_PAGE_INDEX = Math.max(0, GEMS_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        GEMS_PAGE_INDEX = Math.min(GEMS_PAGE_INDEX + 1, gemsPagesCount - 1);
    }

    updateAdminGemsPage();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion

export const displayGems = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const gemsEl = getElement({ elId: 'AdminGems' });

    gemsEl.style.display = (display)
        ? 'flex'
        : 'none';

    if (display) {
        GEMS_PAGE_INDEX = page ?? 0;

        updateAdminGemsPage();
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
        id: 'AdminWorkshop',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'page',
        id: 'WorkshopPage',
        parent: 'AdminWorkshop',
    });

    createWorkshopActions();
};

const createWorkshopActions = () => {
    createElement({
        absolute: false,
        css: 'actions',
        id: 'WorkshopActions',
        parent: 'AdminWorkshop',
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

    createElement({
        css: 'index',
        id: 'WorkshopPageIndex',
        parent: 'WorkshopActions',
        text: '0/0',
    });
};

const createWorkshopCraft = ({ craft }: { craft: string }) => {
    const admin = getAdmin();
    const craftData = getCraftData({ itemName: craft });

    createElement({
        absolute: false,
        css: 'craft',
        id: `Craft${craft}`,
        parent: 'WorkshopPage',
    });

    createElement({
        absolute: false,
        css: 'image',
        id: `CraftImage${craft}`,
        image: getSpritePath({ spriteName: craftData.image }),
        parent: `Craft${craft}`,
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
        text: craftData.name.split('_').join(' '),
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
        const adminItem = admin.items.find((item) => item._name === comp.name);

        createElement({
            absolute: false,
            css: 'comp',
            id: `CraftComp${craft}${comp.name}`,
            parent: `CraftComponents${craft}`,
        });

        createElement({
            absolute: false,
            css: 'icon',
            id: `CraftCompIcon${craft}${comp.name}`,
            image: getSpritePath({ spriteName: `resource_${comp.name.toLowerCase()}` }),
            parent: `CraftComp${craft}${comp.name}`,
        });

        createElement({
            absolute: false,
            css: 'amount',
            id: `CraftCompAmount${craft}${comp.name}`,
            parent: `CraftComp${craft}${comp.name}`,
            text: `x${comp.amount}` + ((adminItem) ? ` (${adminItem._amount})` : ''),
        });
    }

    createButton({
        absolute: false,
        click: () => onClickWorkshopCraft({ craft }),
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
        else {
            updateWorkshopCraft({ craft });
        }
    }
};

const updateWorkshopCraft = ({ craft }: { craft: string }) => {
    const admin = getAdmin();
    const craftData = getCraftData({ itemName: craft });

    for (const comp of craftData.components) {
        const adminItem = admin.items.find((item) => item._name === comp.name);
        const craftCompAmountEl = getElement({ elId: `CraftCompAmount${craft}${comp.name}` });

        craftCompAmountEl.innerText = `x${comp.amount}` + ((adminItem) ? ` (${adminItem._amount})` : '');
    }
};

const updateWorkshopPage = () => {
    const admin = getAdmin();
    const workshopPagesCount = Math.ceil(admin.crafts.length / WORKSHOP_AMOUNT_PER_PAGE);

    const workshopPageEl = getElement({ elId: 'WorkshopPage' });
    const workshopPageIndexEl = getElement({ elId: 'WorkshopPageIndex' });
    workshopPageIndexEl.innerText = `${WORKSHOP_PAGE_INDEX + 1}/${workshopPagesCount || 1}`;

    if (!(admin.crafts.length)) return;

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

    if (!(admin.crafts.length)) return;

    if (action === 'previous') {
        WORKSHOP_PAGE_INDEX = Math.max(0, WORKSHOP_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        WORKSHOP_PAGE_INDEX = Math.min(WORKSHOP_PAGE_INDEX + 1, workshopPagesCount - 1);
    }

    updateWorkshopPage();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickWorkshopCraft = ({ craft }: { craft: string }) => {
    updateAdminContent({ page: WORKSHOP_PAGE_INDEX, tab: AdminTabs.WORKSHOP });

    emit({ data: craft, target: 'engine', type: EngineEvents.CRAFT_REQUEST });
    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

export const displayWorkshop = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const workshopEl = getElement({ elId: 'AdminWorkshop' });

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
let LAB_DISPLAY_DONE = true;
const LAB_AMOUNT_PER_PAGE = 5;
//#endregion

//#region CREATE
const createLabs = () => {
    createElement({
        absolute: false,
        css: 'labs',
        id: 'AdminLabs',
        parent: 'AdminContent',
    });

    createLabStats();

    createElement({
        absolute: false,
        css: 'page',
        id: 'LabPage',
        parent: 'AdminLabs',
    });

    createLabActions();
};

const createLabStats = () => {
    const admin = getAdmin();

    createElement({
        absolute: false,
        css: 'stats',
        id: 'LabStats',
        parent: 'AdminLabs',
    });

    createElement({
        absolute: false,
        css: 'stat',
        id: 'LabPoints',
        parent: 'LabStats',
        text: `Lab Points: ${admin.stats._labPoints}`,
    });

    createElement({
        absolute: false,
        css: 'stat',
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
        parent: 'AdminLabs',
    });

    createButton({
        click: () => onClickLabDisplayDone(),
        css: 'done',
        id: 'LabDisplayDone',
        parent: 'LabActions',
        text: (LAB_DISPLAY_DONE)
            ? 'Hide Done'
            : 'Show Done',
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

    createElement({
        css: 'index',
        id: 'LabPageIndex',
        parent: 'LabActions',
        text: '0/0',
    });
};

const createLab = ({ labName, labText, labImage, labCost, labProgress, labTime }: {
    labCost: number,
    labImage: string,
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
        css: 'image',
        id: `LabImage${labName}`,
        image: getSpritePath({ spriteName: labImage }),
        parent: `Lab${labName}`,
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
        click: () => onClickLabStart({ labName }),
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

                const labStartEl = getElement({ elId: `LabStart${lab.data.name}` });
                labStartEl.style.display = 'none';
            }
            else if (lab._run) {
                const labDoneEl = getElement({ elId: `LabDone${lab.data.name}` });
                labDoneEl.style.display = 'none';

                const labCostEl = getElement({ elId: `LabCost${lab.data.name}` });
                labCostEl.style.display = 'none';

                const labRunEl = getElement({ elId: `LabRun${lab.data.name}` });
                labRunEl.innerText = `Running: ${lab._progress}/${lab.data.time}`;

                const labStartEl = getElement({ elId: `LabStart${lab.data.name}` });
                labStartEl.style.display = 'none';
            }
        }
        else {
            createLab({
                labCost: lab.data.cost,
                labImage: lab.data.image,
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
    const labPagesCount = getLabPagesCount();

    const labPageEl = getElement({ elId: 'LabPage' });
    const labPageIndexEl = getElement({ elId: 'LabPageIndex' });
    labPageIndexEl.innerText = `${LAB_PAGE_INDEX + 1}/${labPagesCount || 1}`;

    if (!(admin.labs.length)) return;

    const labEls = Array.from(labPageEl.children) as HTMLElement[];

    for (let i = 0; i < labPageEl.children.length; i++) {
        const labEl = labEls[i];
        labEl.style.display = 'none';
    }

    const labElsToDisplay = (LAB_DISPLAY_DONE)
        ? labEls
        : labEls.filter((labEl) => {
            const adminLab = admin.labs.find((lab) => labEl.id.includes(lab.data.name));
            if (!(adminLab)) return false;

            return !(adminLab._done);
        });

    const labStartIndex = LAB_PAGE_INDEX * LAB_AMOUNT_PER_PAGE;
    const labEndIndex = labStartIndex + LAB_AMOUNT_PER_PAGE;
    for (let j = labStartIndex; j < labEndIndex; j++) {
        if (j >= labElsToDisplay.length) break;

        const labEl = labElsToDisplay[j] as HTMLElement;

        labEl.style.display = 'flex';
    }
};
//#endregion

//#region ACTIONS
const onClickLabPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const labPagesCount = getLabPagesCount();

    if (!(admin.labs.length)) return;

    if (action === 'previous') {
        LAB_PAGE_INDEX = Math.max(0, LAB_PAGE_INDEX - 1);
    }
    else if (action === 'next') {
        LAB_PAGE_INDEX = Math.min(LAB_PAGE_INDEX + 1, labPagesCount - 1);
    }

    updateLabPage();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickLabDisplayDone = () => {
    const labDisplayDoneEl = getElement({ elId: 'LabDisplayDone' });

    LAB_DISPLAY_DONE = !(LAB_DISPLAY_DONE);
    LAB_PAGE_INDEX = 0;

    labDisplayDoneEl.innerText = (LAB_DISPLAY_DONE)
        ? 'Hide Done'
        : 'Show Done';

    updateLabPage();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickLabStart = ({ labName }: { labName: string }) => {
    updateAdminContent({ page: LAB_PAGE_INDEX, tab: AdminTabs.LAB });

    emit({ data: labName, target: 'engine', type: EngineEvents.LAB_RUN });
    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const getLabPagesCount = () => {
    const admin = getAdmin();
    const adminLabsCount = (LAB_DISPLAY_DONE)
        ? admin.labs.length
        : admin.labs.filter((lab) => !(lab._done)).length;

    const labPagesCount = Math.ceil(adminLabsCount / LAB_AMOUNT_PER_PAGE);

    return labPagesCount;
};
//#endregion

export const displayLabs = ({ display, page }: {
    display: boolean,
    page?: number,
}) => {
    const labEl = getElement({ elId: 'AdminLabs' });

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
