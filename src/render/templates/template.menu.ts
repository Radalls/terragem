import { Gems, Items, State } from '@/engine/components';
import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { setState } from '@/engine/services/state';
import { isBuildUnlocked } from '@/engine/systems/build';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { gemHasItems, getGem, getGemStat, getGemType, getGemTypeCount, isGemUnlocked } from '@/engine/systems/gem';
import { getCraftData, getItemCount, isItemGem, isItemMech, itemToGem } from '@/engine/systems/item';
import { getLabData } from '@/engine/systems/lab';
import { exportSaveFile, getProjectVersion, importSaveFile } from '@/engine/systems/save';
import { getSpritePath } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';
import {
    checkElement,
    createButton,
    createElement,
    createProgress,
    destroyElement,
    displayAdminUI,
    displayGemView,
    getElement,
    searchElementsByClassName,
    updateProgress,
} from '@/render/templates';

//#region CONSTANTS
//#endregion

//#region TEMPLATES
export const createMenus = () => {
    createBoot();
    createLaunch();
    createSettings();
    createLoading();
};

export const displayMenus = ({ display }: { display: boolean }) => {
    const menusEl = getElement({ elId: 'Menus' });

    menusEl.style.display = (display)
        ? 'flex'
        : 'none';

    setState({ key: 'gamePause', value: display });
};

//#region LOADING
const createLoading = () => {
    createElement({
        css: 'loading hidden full align',
        id: 'Loading',
        parent: 'Menus',
    });

    createElement({
        absolute: false,
        css: 'loader w-10 h-10',
        id: 'Loader',
        parent: 'Loading',
    });
};

export const displayLoading = ({ display }: { display: boolean }) => {
    displayMenus({ display: true });

    const loading = getElement({ elId: 'Loading' });

    loading.style.display = (display)
        ? 'flex'
        : 'none';
};
//#endregion

//#region BOOT
export const createBoot = () => {
    createElement({
        css: 'boot full hidden',
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
        css: 'center w-15 p-box t-24',
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
        css: 'launch col full align hidden g-32',
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
        css: 'align w-15 p-box t-24',
        id: 'LaunchStart',
        parent: 'Launch',
        text: 'Start',
    });

    createSaveFileInput();
    createButton({
        absolute: false,
        click: () => onClickLoadGame(),
        css: 'align w-15 p-box t-24',
        id: 'LaunchLoad',
        parent: 'Launch',
        text: 'Load',
    });

    createButton({
        absolute: false,
        click: () => onClickSettings(),
        css: 'align w-15 p-box t-24',
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

const createSaveFileInput = () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.id = 'SaveFileInput';
    input.accept = '.json';
    input.style.display = 'none';

    input.addEventListener('change', async (event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            try {
                await importSaveFile({ saveFile: file });
            } catch (err) {
                throw error({
                    message: `Failed to import save file: ${(err as Error).message}`,
                    where: createSaveFileInput.name,
                });
            }
        }

        input.value = '';
    });

    document.body.appendChild(input);

    return input;
};

const onClickStart = () => {
    emit({ target: 'all', type: GameEvents.GAME_RUN });
};

const onClickLoadGame = () => {
    const fileInput = document.getElementById('SaveFileInput') as HTMLInputElement;

    if (fileInput) {
        fileInput.click();
    }

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
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
        emit({ data: { audioName: 'bgm_menu', list: true }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
};
//#endregion

//#region SETTINGS
export const createSettings = () => {
    createElement({
        css: 'settings',
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
    // eslint-disable-next-line typescript-sort-keys/string-enum
    STORAGE = 'AdminTabStorage',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    GEMS = 'AdminTabGems',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    WORKSHOP = 'AdminTabWorkshop',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    LAB = 'AdminTabLabs',
}
//#endregion

//#region CREATE
export const createAdminMenu = () => {
    createElement({
        css: 'admin row full center hidden g-32 p-32',
        id: 'Admin',
        parent: 'Menus',
    });

    createElement({
        absolute: false,
        css: 'tabs frame col align w-15 g-12 p-8',
        id: 'AdminTabs',
        parent: 'Admin',
    });

    createElement({
        absolute: false,
        css: 'frame col full p-32',
        id: 'AdminContent',
        parent: 'Admin',
    });

    createButton({
        click: () => displayAdminMenu({ display: false }),
        css: 'close p-24',
        id: 'AdminClose',
        image: getSpritePath({ spriteName: 'menu_close' }),
        parent: 'Admin',
        title: 'Back',
    });

    createButton({
        click: () => onClickHome(),
        css: 'home p-24',
        id: 'AdminHome',
        image: getSpritePath({ spriteName: 'menu_home' }),
        parent: 'AdminTabs',
        title: 'Home',
    });

    createButton({
        click: () => onClickSaveGame(),
        css: 'save p-24',
        id: 'AdminSave',
        image: getSpritePath({ spriteName: 'menu_save' }),
        parent: 'AdminTabs',
        title: 'Save',
    });

    for (const tab of Object.values(AdminTabs)) {
        createButton({
            absolute: false,
            click: () => selectAdminTab({ tab }),
            css: 'tab full-w h-20',
            id: tab,
            image: getSpritePath({ spriteName: `menu_${tab.replace('AdminTab', '').toLowerCase()}` }),
            parent: 'AdminTabs',
            title: tab.replace('AdminTab', ''),
        });
    }

    createStorage();
    createGems();
    createWorkshop();
    createLabs();
};
//#endregion

//#region UPDATE
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
//#endregion

//#region ACTIONS
const selectAdminTab = ({ tab }: { tab?: AdminTabs }) => {
    const adminTabsEls = searchElementsByClassName({ className: 'tab', parent: 'AdminTabs' });

    adminTabsEls.forEach((adminTabEl) => adminTabEl.classList.remove('select'));

    if (tab) {
        const tabEl = getElement({ elId: tab });
        tabEl.classList.add('select');

        updateAdminContent({ tab });

        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
};

const onClickSaveGame = () => {
    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });

    exportSaveFile();
};

const onClickHome = () => {
    createElement({
        css: 'home-confirm frame col w-25 p-box g-32',
        id: 'HomeConfirm',
        parent: 'app',
    });

    createElement({
        absolute: false,
        css: 'mt-32',
        id: 'HomeConfirmText',
        parent: 'HomeConfirm',
        text: 'Leave to menu ?',
    });

    createElement({
        absolute: false,
        css: 'row between full-w p-box',
        id: 'HomeConfirmActions',
        parent: 'HomeConfirm',
    });

    createButton({
        absolute: false,
        click: () => onClickHomeConfirm({ home: false }),
        id: 'HomeConfirmNo',
        parent: 'HomeConfirmActions',
        text: 'No',
    });

    createButton({
        absolute: false,
        click: () => onClickHomeConfirm({ home: true }),
        id: 'HomeConfirmYes',
        parent: 'HomeConfirmActions',
        text: 'Yes',
    });

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickHomeConfirm = ({ home }: { home: boolean }) => {
    if (home) {
        emit({ data: { audioName: 'main_start' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });

        window.location.reload();
    }
    else {
        destroyElement({ elId: 'HomeConfirm' });

        emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }
};
//#endregion

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

//#region STORAGE
const createStorage = () => {
    createElement({
        absolute: false,
        css: 'storage row wrap g-12',
        id: 'AdminStorage',
        parent: 'AdminContent',
    });
};

const createStorageItem = ({ itemName, itemAmount }: {
    itemAmount: number;
    itemName: Items;
}) => {
    createElement({
        absolute: false,
        css: 'item btn col align',
        id: `Item${itemName}`,
        parent: 'AdminStorage',
    });

    createElement({
        absolute: false,
        css: 'row align right full-w pr-8',
        id: `ItemAmount${itemName}`,
        parent: `Item${itemName}`,
        text: `x${itemAmount}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `ItemIcon${itemName}`,
        image: getSpritePath({ spriteName: `resource_${itemName.toLowerCase()}` }),
        parent: `Item${itemName}`,
    });

    createElement({
        absolute: false,
        css: 'row align full-w t-12',
        id: `ItemLabel${itemName}`,
        parent: `Item${itemName}`,
        text: itemName.replace('_', ' '),
    });
};

export const updateStorage = () => {
    const admin = getAdmin();

    for (const item of admin.items) {
        const itemEl = checkElement({ elId: `Item${item._name}` });

        if (itemEl) {
            const itemAmountEl = getElement({ elId: `ItemAmount${item._name}` });

            itemAmountEl.innerText = `x${item._amount}`;
        }
        else {
            createStorageItem({ itemAmount: item._amount, itemName: item._name });
        }
    }
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
enum GemsTabs {
    // eslint-disable-next-line typescript-sort-keys/string-enum
    MINE = 'gem_mine',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    CARRY = 'gem_carry',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    TUNNEL = 'gem_tunnel',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    LIFT = 'gem_lift',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    FLOOR = 'gem_floor',
    // eslint-disable-next-line typescript-sort-keys/string-enum
    SHAFT = 'gem_shaft',
}

const tabsToGems = {
    [GemsTabs.MINE]: Gems.MINE,
    [GemsTabs.CARRY]: Gems.CARRY,
    [GemsTabs.TUNNEL]: Gems.TUNNEL,
    [GemsTabs.LIFT]: Gems.LIFT,
    [GemsTabs.FLOOR]: Gems.FLOOR,
    [GemsTabs.SHAFT]: Gems.SHAFT,
};

let GEMS_PAGE_INDEX = 0;
const GEMS_AMOUNT_PER_PAGE = 4;
let GEMS_TAB_INDEX = 0;
let DISPLAY_ALL_GEMS = true;
let DISPLAY_STORE_GEMS = true;
//#endregion

//#region CREATE
const createGems = () => {
    createElement({
        absolute: false,
        css: 'gems col full g-8',
        id: 'AdminGems',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'col full g-8',
        id: 'AdminGemsPage',
        parent: 'AdminGems',
    });

    createGemsActions();
};

const createGemsActions = () => {
    createButton({
        click: () => onClickGemsAll(),
        css: 'all p-4',
        id: 'AdminGemsAll',
        image: getSpritePath({ spriteName: 'ui_gem_placeholder' }),
        parent: 'AdminGems',
        title: 'Filter All',
    });

    createButton({
        click: () => onClickGemsStore(),
        css: 'deploy p-4',
        id: 'AdminGemsStore',
        image: getSpritePath({ spriteName: 'ui_admin_placeholder' }),
        parent: 'AdminGems',
        title: 'Filter Store',
    });

    createButton({
        click: () => onClickGemsType(),
        css: 'type p-4',
        id: 'AdminGemsType',
        image: getSpritePath({ spriteName: Object.values(GemsTabs)[GEMS_TAB_INDEX] }),
        parent: 'AdminGems',
        title: 'Filter Type',
    });

    createElement({
        absolute: false,
        css: 'row align g-12',
        id: 'AdminGemsActions',
        parent: 'AdminGems',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'previous' }),
        id: 'AdminGemsPagePrevious',
        parent: 'AdminGemsActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickGemsPage({ action: 'next' }),
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
        css: 'btn row align h-25 p-box',
        id: `AdminGem${gemId}`,
        parent: 'AdminGemsPage',
    });

    createElement({
        absolute: false,
        css: 'sprite mr-32',
        id: `AdminGemSprite${gemId}`,
        image: gemSprite._image,
        parent: `AdminGem${gemId}`,
    });

    createButton({
        click: () => onClickGemDestroy({ gemId }),
        css: 'destroy',
        id: `AdminGemDestroy${gemId}`,
        image: getSpritePath({ spriteName: 'menu_destroy' }),
        parent: `AdminGem${gemId}`,
        title: 'Destroy',
    });

    createGemData({ gemAction: gemState._action, gemId, gemType });

    if (gemType === Gems.CARRY) {
        createGemCarry({ gemId });
    }
    else if (gemType === Gems.FLOOR) {
        createGemFloor({ gemId });
    }
    else if (gemType === Gems.LIFT) {
        createGemLift({ gemId });
    }
    else if (gemType === Gems.MINE) {
        createGemMine({ gemId });
    }
    else if (gemType === Gems.SHAFT) {
        createGemShaft({ gemId });
    }
    else if (gemType === Gems.TUNNEL) {
        createGemTunnel({ gemId });
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
        css: 'col align full g-4',
        id: `AdminGemData${gemId}`,
        parent: `AdminGem${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'row between full',
        id: `AdminGemInfo${gemId}`,
        parent: `AdminGemData${gemId}`,
    });

    createElement({
        absolute: false,
        css: 'row wrap full g-4',
        id: `AdminGemStats${gemId}`,
        parent: `AdminGemData${gemId}`,
    });

    createElement({
        absolute: false,
        id: `AdminGemLabel${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: gem._name,
    });

    createElement({
        absolute: false,
        id: `AdminGemType${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `Type: ${gemType}`,
    });

    createElement({
        absolute: false,
        id: `AdminGemState${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `State: ${gemAction}`,
    });

    createElement({
        absolute: false,
        id: `AdminGemLvl${gemId}`,
        parent: `AdminGemInfo${gemId}`,
        text: `Lvl: ${gem._xpLvl}`,
    });

    if (gemHasItems(gem)) {
        createElement({
            absolute: false,
            css: 'w-20 t-10 t-l',
            id: `ItemCapacity${gemId}`,
            parent: `AdminGemStats${gemId}`,
            text: `Item Capacity: ${getGemStat({ gemId, gemType, stat: '_itemCapacity' })}`,
        });
    }

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `MoveSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Move Speed: ${getGemStat({ gemId, gemType, stat: '_moveSpeed' })}`,
    });
};

const createGemCarry = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ItemSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ItemAmount${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Amount: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemAmount' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ItemRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Range: ${getGemStat({ gemId, gemType: Gems.CARRY, stat: '_itemRange' })}`,
    });
};

const createGemFloor = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `FloorSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Floor Speed: ${getGemStat({ gemId, gemType: Gems.FLOOR, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `FloorStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Floor Strength: ${getGemStat({ gemId, gemType: Gems.FLOOR, stat: '_digStrength' })}`,
    });
};

const createGemLift = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ItemSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Speed: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ItemRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Item Range: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemRange' })}`,
    });
};

const createGemMine = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `MineSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Speed: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `MineStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Strength: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `MineAmount${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Mine Amount: ${getGemStat({ gemId, gemType: Gems.MINE, stat: '_digAmount' })}`,
    });
};

const createGemShaft = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ShaftSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Shaft Speed: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ShaftStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Shaft Strength: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `ShaftRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Shaft Range: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digRange' })}`,
    });
};

const createGemTunnel = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `TunnelSpeed${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Speed: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digSpeed' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `TunnelStrength${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Strength: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digStrength' })}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 t-10 t-l',
        id: `TunnelRange${gemId}`,
        parent: `AdminGemStats${gemId}`,
        text: `Tunnel Range: ${getGemStat({ gemId, gemType: Gems.TUNNEL, stat: '_digRange' })}`,
    });
};

const createGemActions = ({ gemId }: { gemId: string }) => {
    createElement({
        absolute: false,
        css: 'col align w-15 g-4 ml-32',
        id: `AdminGemActions${gemId}`,
        parent: `AdminGem${gemId}`,
    });

    createButton({
        absolute: false,
        click: () => onClickGemEquip({ gemId }),
        css: 'hidden w-75 t-12',
        id: `AdminGemEquip${gemId}`,
        parent: `AdminGemActions${gemId}`,
        text: 'Equip',
    });

    createButton({
        absolute: false,
        click: () => onClickGemView({ gemId }),
        css: 'hidden w-75 t-12',
        id: `AdminGemView${gemId}`,
        parent: `AdminGemActions${gemId}`,
        text: 'View',
    });

    createButton({
        absolute: false,
        click: () => onClickGemDeploy({ gemId }),
        css: 'w-75 t-12',
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
        const gemEl = checkElement({ elId: `AdminGem${gem}` });

        if (gemEl) {
            updateGem({ gemId: gem });
        }
        else {
            createGem({ gemId: gem });
        }
    }

    updateAdminGemsPage();
};

const updateAdminGemsPage = () => {
    const gemsPagesCount = getGemsPagesCount();

    const gemsPageIndexEl = getElement({ elId: 'AdminGemsPageIndex' });
    gemsPageIndexEl.innerText = `${GEMS_PAGE_INDEX + 1}/${gemsPagesCount || 1}`;
};

const updateGem = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    const gemSpriteEl = getElement({ elId: `AdminGemSprite${gemId}` });
    gemSpriteEl.style.backgroundImage = `url("${gemSprite._image}")`;

    const gemDestroyEl = getElement({ elId: `AdminGemDestroy${gemId}` });
    gemDestroyEl.style.display = (gemState._store)
        ? 'flex'
        : 'none';

    updateGemData({ gemAction: gemState._action, gemId, gemType });

    if (gemType === Gems.CARRY) {
        updateGemCarry({ gemId });
    }
    else if (gemType === Gems.FLOOR) {
        updateGemFloor({ gemId });
    }
    else if (gemType === Gems.LIFT) {
        updateGemLift({ gemId });
    }
    else if (gemType === Gems.MINE) {
        updateGemMine({ gemId });
    }
    else if (gemType === Gems.SHAFT) {
        updateGemShaft({ gemId });
    }
    else if (gemType === Gems.TUNNEL) {
        updateGemTunnel({ gemId });
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

const updateGemFloor = ({ gemId }: { gemId: string }) => {
    const gemFloorSpeedEl = getElement({ elId: `FloorSpeed${gemId}` });
    gemFloorSpeedEl.innerText
        = `Floor Speed: ${getGemStat({ gemId, gemType: Gems.FLOOR, stat: '_digSpeed' })}`;

    const gemFloorStrengthEl = getElement({ elId: `FloorStrength${gemId}` });
    gemFloorStrengthEl.innerText
        = `Floor Strength: ${getGemStat({ gemId, gemType: Gems.FLOOR, stat: '_digStrength' })}`;
};

const updateGemLift = ({ gemId }: { gemId: string }) => {
    const gemItemSpeedEl = getElement({ elId: `ItemSpeed${gemId}` });
    gemItemSpeedEl.innerText
        = `Item Speed: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemSpeed' })}`;

    const gemItemRangeEl = getElement({ elId: `ItemRange${gemId}` });
    gemItemRangeEl.innerText
        = `Item Range: ${getGemStat({ gemId, gemType: Gems.LIFT, stat: '_itemRange' })}`;
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

const updateGemShaft = ({ gemId }: { gemId: string }) => {
    const gemShaftSpeedEl = getElement({ elId: `ShaftSpeed${gemId}` });
    gemShaftSpeedEl.innerText
        = `Shaft Speed: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digSpeed' })}`;

    const gemShaftStrengthEl = getElement({ elId: `ShaftStrength${gemId}` });
    gemShaftStrengthEl.innerText
        = `Shaft Strength: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digStrength' })}`;

    const gemShaftRangeEl = getElement({ elId: `ShaftRange${gemId}` });
    gemShaftRangeEl.innerText
        = `Shaft Range: ${getGemStat({ gemId, gemType: Gems.SHAFT, stat: '_digRange' })}`;
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

    gemEquipEl.style.display = (gem._mech)
        ? 'block'
        : (gemStore)
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
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    emit({
        entityId: gemId, target: 'all', type: (gemState._store)
            ? GameEvents.GEM_STORE_DEPLOY
            : GameEvents.GEM_STORE,
    });

    if (gemState._store) {
        if (gemType === Gems.CARRY) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_CARRY_CANCEL });
        }
        else if (gemType === Gems.FLOOR) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_FLOOR_CANCEL });
        }
        else if (gemType === Gems.LIFT) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_LIFT_CANCEL });
        }
        else if (gemType === Gems.MINE) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_MINE_CANCEL });
        }
        else if (gemType === Gems.SHAFT) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_SHAFT_CANCEL });
        }
        else if (gemType === Gems.TUNNEL) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_TUNNEL_CANCEL });
        }
    }

    updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });

    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemEquip = ({ gemId }: { gemId: string }) => {
    emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_EQUIP });

    updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });

    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemDestroy = ({ gemId }: { gemId: string }) => {
    createElement({
        css: 'destroy-confirm frame col w-33 p-box g-32',
        id: 'DestroyConfirm',
        parent: 'app',
    });

    createElement({
        absolute: false,
        css: 'mt-32',
        id: 'DestroyConfirmText',
        parent: 'DestroyConfirm',
        text: 'Destroy this gem ?\n You will get back resources used to craft it.',
    });

    createElement({
        absolute: false,
        css: 'row between full-w p-box',
        id: 'DestroyConfirmActions',
        parent: 'DestroyConfirm',
    });

    createButton({
        absolute: false,
        click: () => onClickGemDestroyConfirm({ destroy: false, gemId }),
        id: 'DestroyConfirmNo',
        parent: 'DestroyConfirmActions',
        text: 'No',
    });

    createButton({
        absolute: false,
        click: () => onClickGemDestroyConfirm({ destroy: true, gemId }),
        id: 'DestroyConfirmYes',
        parent: 'DestroyConfirmActions',
        text: 'Yes',
    });

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemDestroyConfirm = ({ gemId, destroy }: {
    destroy: boolean,
    gemId: string,
}) => {
    if (destroy) {
        emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_DESTROY });

        destroyElement({ elId: `AdminGem${gemId}` });

        updateAdminContent({ page: GEMS_PAGE_INDEX, tab: AdminTabs.GEMS });

        emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
    }

    destroyElement({ elId: 'DestroyConfirm' });

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemsPage = ({ action }: { action: 'previous' | 'next' }) => {
    const admin = getAdmin();
    const gemsPagesCount = getGemsPagesCount();

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

const getGemsPagesCount = () => {
    const gemsPageEl = getElement({ elId: 'AdminGemsPage' });
    const gemsEls = Array.from(gemsPageEl.children) as HTMLElement[];

    const displayableGems = (DISPLAY_ALL_GEMS)
        ? gemsEls
        : (DISPLAY_STORE_GEMS)
            ? gemsEls.filter(el => {
                const gemId = el.id.replace('AdminGem', '');
                const gemState = getComponent({ componentId: 'State', entityId: gemId });

                return gemState._store;
            })
            : gemsEls.filter(el => {
                const gemId = el.id.replace('AdminGem', '');
                const tabGemType = Object.values(GemsTabs)[GEMS_TAB_INDEX];

                return getGemType({ gemId }) === tabsToGems[tabGemType];
            });

    gemsEls.forEach(el => el.style.display = 'none');

    const startIndex = GEMS_PAGE_INDEX * GEMS_AMOUNT_PER_PAGE;
    const endIndex = startIndex + GEMS_AMOUNT_PER_PAGE;

    displayableGems
        .slice(startIndex, endIndex)
        .forEach(el => el.style.display = 'flex');

    const totalPages = Math.ceil(displayableGems.length / GEMS_AMOUNT_PER_PAGE);

    return totalPages;
};

const onClickGemsAll = () => {
    DISPLAY_ALL_GEMS = true;
    DISPLAY_STORE_GEMS = false;
    GEMS_PAGE_INDEX = 0;

    updateAdminGems();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemsType = () => {
    const gemsTabsCount = Object.values(GemsTabs).length;

    DISPLAY_ALL_GEMS = false;
    DISPLAY_STORE_GEMS = false;
    GEMS_PAGE_INDEX = 0;

    GEMS_TAB_INDEX = (GEMS_TAB_INDEX + 1) % gemsTabsCount;

    const gemType = tabsToGems[Object.values(GemsTabs)[GEMS_TAB_INDEX]];
    if (!(isGemUnlocked({ gemType }))) {
        GEMS_TAB_INDEX = 0;
    }

    const gemsTypeEl = getElement({ elId: 'AdminGemsType' });
    gemsTypeEl.style.backgroundImage =
        `url("${getSpritePath({ spriteName: Object.values(GemsTabs)[GEMS_TAB_INDEX] })}")`;

    updateAdminGems();

    emit({ data: { audioName: 'main_select' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};

const onClickGemsStore = () => {
    DISPLAY_ALL_GEMS = false;
    DISPLAY_STORE_GEMS = true;
    GEMS_PAGE_INDEX = 0;

    updateAdminGems();

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
    const admin = getAdmin();

    createElement({
        absolute: false,
        css: 'workshop col full g-8',
        id: 'AdminWorkshop',
        parent: 'AdminContent',
    });

    createElement({
        absolute: false,
        css: 'col full g-8',
        id: 'WorkshopPage',
        parent: 'AdminWorkshop',
    });

    createElement({
        css: 'count btn row align p-4 g-4',
        id: 'WorkshopGemCount',
        parent: 'AdminWorkshop',
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: 'WorkshopGemCountIcon',
        image: getSpritePath({ spriteName: 'lab_gem_count' }),
        parent: 'WorkshopGemCount',
    });

    createElement({
        absolute: false,
        id: 'WorkshopGemCountValue',
        parent: 'WorkshopGemCount',
        text: `${admin.gems.length}/${admin.stats._gemMax}`,
    });

    createWorkshopActions();
};

const createWorkshopActions = () => {
    createElement({
        absolute: false,
        css: 'row align g-12',
        id: 'WorkshopActions',
        parent: 'AdminWorkshop',
    });

    createButton({
        absolute: false,
        click: () => onClickWorkshopPage({ action: 'previous' }),
        id: 'WorkshopPagePrevious',
        parent: 'WorkshopActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickWorkshopPage({ action: 'next' }),
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
        css: 'craft btn row align h-25 p-box',
        id: `Craft${craft}`,
        parent: 'WorkshopPage',
    });

    createElement({
        absolute: false,
        css: 'sprite mr-16',
        id: `CraftSprite${craft}`,
        image: getSpritePath({ spriteName: craftData.image }),
        parent: `Craft${craft}`,
    });

    createElement({
        absolute: false,
        css: 'w-20 mr-16 t-20',
        id: `CraftName${craft}`,
        parent: `Craft${craft}`,
        text: craftData.name.split('_').join(' '),
    });

    createElement({
        absolute: false,
        css: 'col between full g-12',
        id: `CraftData${craft}`,
        parent: `Craft${craft}`,
    });

    createElement({
        absolute: false,
        css: 't-10',
        id: `CraftText${craft}`,
        parent: `CraftData${craft}`,
        text: craftData.text,
    });

    createElement({
        absolute: false,
        css: 'row g-16',
        id: `CraftComponents${craft}`,
        parent: `CraftData${craft}`,
    });

    for (const comp of craftData.components) {
        const adminItem = admin.items.find((item) => item._name === comp.name);

        createElement({
            absolute: false,
            css: 'row align',
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
            id: `CraftCompAmount${craft}${comp.name}`,
            parent: `CraftComp${craft}${comp.name}`,
            text: `x${comp.amount}` + ((adminItem) ? ` (${adminItem._amount})` : ''),
        });
    }

    createButton({
        absolute: false,
        click: () => onClickWorkshopCraft({ craft }),
        css: 'w-10 p-4 ml-32',
        id: `CraftRun${craft}`,
        parent: `Craft${craft}`,
        text: 'Craft',
    });

    createElement({
        css: 'count btn row align p-4 g-4',
        id: `CraftCount${craft}`,
        parent: `Craft${craft}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `CraftCountIcon${craft}`,
        image: (isItemGem({ itemName: craft as Items }))
            ? getSpritePath({ spriteName: `gem_${craft.toLowerCase().replace('gem_', '')}` })
            : (isItemMech({ itemName: craft as Items }))
                ? getSpritePath({ spriteName: `mech_${craft.toLowerCase()}` })
                : getSpritePath({ spriteName: `build_${craft.toLowerCase()}` }),
        parent: `CraftCount${craft}`,
    });

    createElement({
        absolute: false,
        id: `CraftCountValue${craft}`,
        parent: `CraftCount${craft}`,
        text: (isItemGem({ itemName: craft as Items }))
            ? `${getGemTypeCount({ gemType: itemToGem({ itemName: craft as Items }) }) ?? 0}`
            : `${getItemCount({ itemName: craft as Items }) ?? 0}`,
    });
};
//#endregion

//#region UPDATE
export const updateWorkshop = () => {
    const admin = getAdmin();

    const gemCountEl = getElement({ elId: 'WorkshopGemCountValue' });
    gemCountEl.innerText = `${admin.gems.length}/${admin.stats._gemMax}`;

    for (const craft of admin.crafts) {
        const craftEl = checkElement({ elId: `Craft${craft}` });

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

    const count = checkElement({ elId: `CraftCount${craft}` });
    if (count) {
        const countEl = getElement({ elId: `CraftCountValue${craft}` });
        countEl.innerText = (isItemGem({ itemName: craft as Items }))
            ? `${getGemTypeCount({ gemType: itemToGem({ itemName: craft as Items }) }) ?? 0}`
            : `${getItemCount({ itemName: craft as Items }) ?? 0}`;
    }

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

//#region ACTIONS
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
    emit({ data: craft, target: 'engine', type: EngineEvents.CRAFT_REQUEST });

    updateAdminContent({ page: WORKSHOP_PAGE_INDEX, tab: AdminTabs.WORKSHOP });

    emit({ data: { audioName: 'main_action' }, target: 'engine', type: EngineEvents.AUDIO_PLAY });
};
//#endregion

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
        css: 'labs col full g-8',
        id: 'AdminLabs',
        parent: 'AdminContent',
    });

    createLabStats();

    createElement({
        absolute: false,
        css: 'col full g-8',
        id: 'LabPage',
        parent: 'AdminLabs',
    });

    createLabActions();
};

const createLabStats = () => {
    const admin = getAdmin();

    createElement({
        absolute: false,
        css: 'row g-32 mb-32 t-20',
        id: 'LabStats',
        parent: 'AdminLabs',
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: 'LabPoints',
        parent: 'LabStats',
        title: 'Lab Points',
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: 'LabPointsIcon',
        image: getSpritePath({ spriteName: 'lab_points' }),
        parent: 'LabPoints',
    });

    createElement({
        absolute: false,
        id: 'LabPointsValue',
        parent: 'LabPoints',
        text: `x${admin.stats._labPoints}`,
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: 'GemMax',
        parent: 'LabStats',
        title: 'Max Gem',
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: 'GemMaxIcon',
        image: getSpritePath({ spriteName: 'lab_gem_count' }),
        parent: 'GemMax',
    });

    createElement({
        absolute: false,
        id: 'GemMaxValue',
        parent: 'GemMax',
        text: `${admin.gems.length}/${admin.stats._gemMax}`,
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: 'VulkanSpeed',
        parent: 'LabStats',
        title: 'Forge Vulkan Speed',
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: 'VulkanSpeedIcon',
        image: getSpritePath({ spriteName: 'lab_forge_vulkan_speed' }),
        parent: 'VulkanSpeed',
    });

    createElement({
        absolute: false,
        id: 'VulkanSpeedValue',
        parent: 'VulkanSpeed',
        text: `${admin.stats._forgeVulkanSpeed * 60}/min`,
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: 'OryonSpeed',
        parent: 'LabStats',
        title: 'Forge Oryon Speed',
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: 'OryonSpeedIcon',
        image: getSpritePath({ spriteName: 'lab_forge_oryon_speed' }),
        parent: 'OryonSpeed',
    });

    createElement({
        absolute: false,
        id: 'OryonSpeedValue',
        parent: 'OryonSpeed',
        text: `${admin.stats._forgeOryonSpeed * 60}/min`,
    });
};

const createLabActions = () => {
    createElement({
        absolute: false,
        css: 'row align g-12',
        id: 'LabActions',
        parent: 'AdminLabs',
    });

    createButton({
        click: () => onClickLabDisplayDone(),
        css: 'done t-10 p-box',
        id: 'LabDisplayDone',
        parent: 'LabActions',
        text: (LAB_DISPLAY_DONE)
            ? 'Hide Done'
            : 'Show All',
    });

    createButton({
        absolute: false,
        click: () => onClickLabPage({ action: 'previous' }),
        id: 'LabPagePrevious',
        parent: 'LabActions',
        text: '<',
    });

    createButton({
        absolute: false,
        click: () => onClickLabPage({ action: 'next' }),
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
        css: 'lab btn row between h-20 p-box',
        id: `Lab${labName}`,
        parent: 'LabPage',
    });

    createProgress({
        css: 'lab-progress',
        id: `Lab${labName}`,
        parent: `Lab${labName}`,
        value: (labProgress / labTime) * 100,
    });

    createElement({
        absolute: false,
        css: 'sprite',
        id: `LabSprite${labName}`,
        image: getSpritePath({ spriteName: labImage }),
        parent: `Lab${labName}`,
    });

    createElement({
        absolute: false,
        css: 't-18',
        id: `LabText${labName}`,
        parent: `Lab${labName}`,
        text: labText,
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: `LabCost${labName}`,
        parent: `Lab${labName}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `LabCostIcon${labName}`,
        image: getSpritePath({ spriteName: 'lab_points' }),
        parent: `LabCost${labName}`,
    });

    createElement({
        absolute: false,
        id: `LabCostValue${labName}`,
        parent: `LabCost${labName}`,
        text: `x${labCost}`,
    });

    createElement({
        absolute: false,
        css: 'row align g-4',
        id: `LabRun${labName}`,
        parent: `Lab${labName}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `LabRunIcon${labName}`,
        image: getSpritePath({ spriteName: 'lab_run' }),
        parent: `LabRun${labName}`,
    });

    createElement({
        absolute: false,
        id: `LabRunValue${labName}`,
        parent: `LabRun${labName}`,
        text: `${labProgress}/${labTime}`,
    });

    createElement({
        absolute: false,
        css: 't-16 hidden',
        id: `LabDone${labName}`,
        parent: `Lab${labName}`,
        text: 'Done !',
    });

    createButton({
        absolute: false,
        click: () => onClickLabStart({ labName }),
        id: `LabStart${labName}`,
        parent: `Lab${labName}`,
        text: 'Start',
    });
};
//#endregion

//#region UPDATE
export const updateLabs = () => {
    const admin = getAdmin();

    updateLabStats();

    for (const lab of admin.labs) {
        const labEl = checkElement({ elId: `Lab${lab._name}` });

        if (labEl) {
            updateLab({ labName: lab._name });
        }
        else {
            const labData = getLabData({ name: lab._name });

            createLab({
                labCost: labData.cost,
                labImage: labData.image,
                labName: lab._name,
                labProgress: lab._progress,
                labText: labData.text,
                labTime: labData.time,
            });

            updateLab({ labName: lab._name });
        }
    }
};

const updateLabStats = () => {
    const admin = getAdmin();

    const labPointsEl = getElement({ elId: 'LabPointsValue' });
    labPointsEl.innerText = `x${admin.stats._labPoints}`;

    const gemMaxEl = getElement({ elId: 'GemMaxValue' });
    gemMaxEl.innerText = `${admin.gems.length}/${admin.stats._gemMax}`;

    const vulkanSpeedEl = getElement({ elId: 'VulkanSpeed' });
    if (isBuildUnlocked({ buildName: Items.BUILD_FORGE_VULKAN })) {
        vulkanSpeedEl.style.display = 'flex';

        const vulkanSpeedValueEl = getElement({ elId: 'VulkanSpeedValue' });
        vulkanSpeedValueEl.innerText = `${admin.stats._forgeVulkanSpeed * 60}/min`;
    }
    else {
        vulkanSpeedEl.style.display = 'none';
    }

    const oryonSpeedEl = getElement({ elId: 'OryonSpeed' });
    if (isBuildUnlocked({ buildName: Items.BUILD_FORGE_ORYON })) {
        oryonSpeedEl.style.display = 'flex';

        const oryonSpeedValueEl = getElement({ elId: 'OryonSpeedValue' });
        oryonSpeedValueEl.innerText = `${admin.stats._forgeOryonSpeed * 60}/min`;
    }
    else {
        oryonSpeedEl.style.display = 'none';
    }
};

const updateLabPage = () => {
    const labPagesCount = getLabPagesCount();

    const labPageIndexEl = getElement({ elId: 'LabPageIndex' });
    labPageIndexEl.innerText = `${LAB_PAGE_INDEX + 1}/${labPagesCount || 1}`;
};

const updateLab = ({ labName }: { labName: string }) => {
    const admin = getAdmin();
    const lab = admin.labs.find(lab => lab._name === labName) ?? error({
        message: `Lab ${labName} not found`,
        where: updateLab.name,
    });

    const labData = getLabData({ name: lab._name });

    if (lab._done) {
        const labEl = getElement({ elId: `Lab${lab._name}` });
        labEl.classList.add('done');

        const labDoneEl = getElement({ elId: `LabDone${lab._name}` });
        labDoneEl.style.display = 'block';

        const labCostEl = getElement({ elId: `LabCost${lab._name}` });
        labCostEl.style.display = 'none';

        const labRunEl = getElement({ elId: `LabRun${lab._name}` });
        labRunEl.style.display = 'none';

        const labStartEl = getElement({ elId: `LabStart${lab._name}` });
        labStartEl.style.display = 'none';

        updateProgress({ elId: `Lab${labName}`, value: (lab._progress / labData.time) * 100 });
    }
    else if (lab._run) {
        const labDoneEl = getElement({ elId: `LabDone${lab._name}` });
        labDoneEl.style.display = 'none';

        const labCostEl = getElement({ elId: `LabCost${lab._name}` });
        labCostEl.style.display = 'none';

        const labRunEl = getElement({ elId: `LabRunValue${lab._name}` });
        labRunEl.innerText = `${lab._progress}/${labData.time}`;

        const labStartEl = getElement({ elId: `LabStart${lab._name}` });
        labStartEl.style.display = 'none';

        updateProgress({ elId: `Lab${labName}`, value: (lab._progress / labData.time) * 100 });
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
        : 'Show All';

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

    const labPageEl = getElement({ elId: 'LabPage' });
    const labEls = Array.from(labPageEl.children) as HTMLElement[];

    const labMapping = labEls.map(labEl => {
        const adminLab = admin.labs.find(lab => {
            const labId = `Lab${lab._name}`;
            return labEl.id === labId;
        });

        return { data: adminLab, element: labEl };
    }).filter(mapping => mapping.data);

    const displayableLabs = LAB_DISPLAY_DONE
        ? labMapping
        : labMapping.filter(mapping => !(mapping.data?._done));

    labEls.forEach(el => el.style.display = 'none');

    const startIndex = LAB_PAGE_INDEX * LAB_AMOUNT_PER_PAGE;
    const endIndex = startIndex + LAB_AMOUNT_PER_PAGE;

    displayableLabs
        .slice(startIndex, endIndex)
        .forEach(mapping => mapping.element.style.display = 'flex');

    const totalPages = Math.ceil(displayableLabs.length / LAB_AMOUNT_PER_PAGE);

    return totalPages;
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
