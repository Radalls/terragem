import { Gems, Items } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getBuildData } from '@/engine/systems/build';
import { getAdmin, getComponent } from '@/engine/systems/entity';
import { getGemType } from '@/engine/systems/gem';
import { getSpritePath } from '@/engine/systems/sprite';
import {
    checkElement,
    createButton,
    createElement,
    destroyElement,
    displayAdminMenu,
    displayGemView,
    getElement,
    searchElementsByClassName,
} from '@/render/templates';

//#region CONSTANTS
export const TILE_SIZE = 32;
//#endregion

//#region TEMPLATES
//#region TILEMAP
//#region CONSTANTS
export const TILEMAP_GROUND_LEVEL = 5;

let tileMapElId: string;
//#endregion

export const createTileMap = ({ tileMapId }: { tileMapId: string }) => {
    tileMapElId = tileMapId;

    createElement({
        css: 'tilemap enable',
        entityId: tileMapId,
        sprite: true,
    });

    createAdmin();
    setScroll();
};

export const destroyTileMap = ({ tileMapId }: { tileMapId: string }) => {
    destroyElement({ elId: tileMapId });
    clearScroll();
};
//#endregion

//#region TILE
export const createTile = ({ tileId }: { tileId: string }) => {
    const tileElExist = checkElement({ elId: tileId });

    if (tileElExist) {
        setTileMode({ mode: 'base', tileId });
        return;
    }
    else {
        const tileEl = createButton({
            click: () => selectTile({ tileId }),
            css: 'tile enable',
            entityId: tileId,
            parent: tileMapElId,
            sprite: true,
        });

        const tilePosition = getComponent({ componentId: 'Position', entityId: tileId });

        tileEl.style.top = `${tilePosition._y * TILE_SIZE + TILEMAP_GROUND_LEVEL * TILE_SIZE}px`;
        tileEl.style.left = `${tilePosition._x * TILE_SIZE}px`;
    }
};

export const setTileMode = ({ tileId, mode, remove }: {
    mode: 'base' | 'request' | 'destroy' | 'ground' | 'path',
    remove?: boolean,
    tileId?: string,
}) => {
    if (remove) {
        if (!(tileId)) return;

        const tileEl = getElement({ elId: tileId });
        tileEl.classList.remove(mode);
        return;
    }

    if (mode === 'base') {
        if (tileId) {
            const tileEl = getElement({ elId: tileId });
            tileEl.classList.remove('request');
            tileEl.classList.remove('destroy');
        }
        else {
            const tileEls = searchElementsByClassName({ className: 'tile', parent: tileMapElId });
            tileEls.forEach((tileEl) => {
                if (!(tileEl.classList.contains('destroy'))) {
                    tileEl.classList.remove('request');
                }
            });

            if (
                getState({ key: 'requestGemMove' })
                || getState({ key: 'requestGemCarryStart' })
                || getState({ key: 'requestGemCarryTarget' })
            ) {
                const gemId = getStore({ key: 'requestId' });

                setAllGemsMode({ gemId, mode: 'disable', remove: true });
            }
        }
    }
    else if (mode === 'request') {
        const tileEls = searchElementsByClassName({ className: 'tile', parent: tileMapElId });

        tileEls.forEach((tileEl) => {
            if (!(tileEl.classList.contains('destroy'))) {
                tileEl.classList.add('request');
            }
        });

        if (
            getState({ key: 'requestGemMove' })
            || getState({ key: 'requestGemCarryStart' })
            || getState({ key: 'requestGemCarryTarget' })
        ) {
            const gemId = getStore({ key: 'requestId' });
            setAllGemsMode({ gemId, mode: 'disable' });
        }
    }
    else {
        if (!(tileId)) return;

        const tileEl = getElement({ elId: tileId });

        tileEl.classList.add(mode);
    }
};

const selectTile = ({ tileId }: { tileId: string }) => {
    if (getState({ key: 'requestTile' })) {
        emit({ entityId: tileId, target: 'engine', type: EngineEvents.TILE_SELECT });
    }
};
//#endregion

//#region SCROLL
//#region CONSTANTS
const SCROLL_SPEED = 5;
const SCROLL_EDGE_TRIGGER = 64;
let scrollMaxX = 0;
let scrollMaxY = 0;
let scrollViewportX = 0;
let scrollViewportY = 0;

type ScrollButton = { elId: string, isHovered: boolean, isPressed: boolean };
const scrollButtons: Record<'left' | 'right' | 'top' | 'bottom', ScrollButton> = {
    bottom: { elId: 'ScrollBottom', isHovered: false, isPressed: false },
    left: { elId: 'ScrollLeft', isHovered: false, isPressed: false },
    right: { elId: 'ScrollRight', isHovered: false, isPressed: false },
    top: { elId: 'ScrollTop', isHovered: false, isPressed: false },
} as const;
//#endregion

export const initScroll = () => {
    for (const [direction, button] of Object.entries(scrollButtons)) {
        const scrollButtonEl = createElement({
            css: `scroll-${direction} btn enable`,
            id: button.elId,
            image: getSpritePath({ spriteName: `ui_scroll_${direction}` }),
            parent: 'UI',
            title: `Hold to scroll ${direction}`,
        });

        scrollButtonEl.addEventListener('mouseenter', () => {
            updateScrollButton(direction as keyof typeof scrollButtons, { isHovered: true });
        });

        scrollButtonEl.addEventListener('mouseleave', () => {
            updateScrollButton(direction as keyof typeof scrollButtons, { isHovered: false, isPressed: false });
        });

        scrollButtonEl.addEventListener('mousedown', () => {
            updateScrollButton(direction as keyof typeof scrollButtons, { isPressed: true });
        });

        scrollButtonEl.addEventListener('mouseup', () => {
            updateScrollButton(direction as keyof typeof scrollButtons, { isPressed: false });
        });
    }

    window.addEventListener('mousemove', (e: MouseEvent) => {
        const { clientX: x, clientY: y } = e;
        const { innerWidth: w, innerHeight: h } = window;

        const scrollButtonLeftEl = getElement({ elId: scrollButtons.left.elId });
        scrollButtonLeftEl.style.display = (x < SCROLL_EDGE_TRIGGER)
            ? 'block'
            : 'none';

        const scrollButtonRightEl = getElement({ elId: scrollButtons.right.elId });
        scrollButtonRightEl.style.display = (x > w - SCROLL_EDGE_TRIGGER)
            ? 'block'
            : 'none';

        const scrollButtonTopEl = getElement({ elId: scrollButtons.top.elId });
        scrollButtonTopEl.style.display = (y < SCROLL_EDGE_TRIGGER)
            ? 'block'
            : 'none';

        const scrollButtonBottomEl = getElement({ elId: scrollButtons.bottom.elId });
        scrollButtonBottomEl.style.display = (y > h - SCROLL_EDGE_TRIGGER)
            ? 'block'
            : 'none';
    });
};

export const updateScroll = () => {
    const tileMapEl = getElement({ elId: tileMapElId });

    let newScrollX = scrollViewportX;
    let newScrollY = scrollViewportY;

    if (scrollButtons.right.isPressed) {
        newScrollX = Math.min(newScrollX + SCROLL_SPEED, scrollMaxX);
    }
    if (scrollButtons.left.isPressed) {
        newScrollX = Math.max(newScrollX - SCROLL_SPEED, 0);
    }
    if (scrollButtons.bottom.isPressed) {
        newScrollY = Math.min(newScrollY + SCROLL_SPEED, scrollMaxY);
    }
    if (scrollButtons.top.isPressed) {
        newScrollY = Math.max(newScrollY - SCROLL_SPEED, 0);
    }

    scrollViewportX = newScrollX;
    scrollViewportY = newScrollY;

    tileMapEl.style.transform = `translate3d(${-scrollViewportX}px, ${-scrollViewportY}px, 0)`;
};

const updateScrollButton = (direction: keyof typeof scrollButtons, newState: Partial<ScrollButton>) => {
    scrollButtons[direction] = { ...scrollButtons[direction], ...newState };
};

const setScroll = () => {
    const tileMap = getComponent({ componentId: 'TileMap', entityId: tileMapElId });
    const { innerWidth, innerHeight } = window;

    scrollMaxX = Math.max(0, (tileMap._width * TILE_SIZE) - innerWidth);
    scrollMaxY = Math.max(0, ((tileMap._height * TILE_SIZE) + ((TILEMAP_GROUND_LEVEL + 1) * TILE_SIZE)) - innerHeight);
};

const clearScroll = () => {
    scrollMaxX = 0;
    scrollMaxY = 0;
    scrollViewportX = 0;
    scrollViewportY = 0;
};
//#endregion

//#region ENTITY
const placeTileEntity = ({ elId, width, height, x, y, z = 1 }: {
    elId: string,
    height: number,
    width: number
    x: number,
    y: number,
    z?: number
}) => {
    const el = getElement({ elId });

    el.style.width = `${width * TILE_SIZE}px`;
    el.style.height = `${height * TILE_SIZE}px`;
    el.style.left = `${x * TILE_SIZE}px`;
    el.style.top = `${((y + ((TILEMAP_GROUND_LEVEL + 1) - height)) * TILE_SIZE)}px`;
    el.style.zIndex = `${z}`;
};

export const updateTileEntity = ({ elId }: { elId: string }) => {
    const el = getElement({ elId });

    const elPosition = getComponent({ componentId: 'Position', entityId: elId });
    const elSprite = getComponent({ componentId: 'Sprite', entityId: elId });

    el.style.left = `${elPosition._x * TILE_SIZE}px`;
    el.style.top = `${((elPosition._y + ((TILEMAP_GROUND_LEVEL + 1) - elSprite._height)) * TILE_SIZE)}px`;
};

//#region BUILD
//#region CONSTANTS
const ADMIN_TOAST_TIMEOUT = 3000;
//#endregion

export const createBuild = ({ buildName }: { buildName: Items }) => {
    const admin = getAdmin();

    const buildData = getBuildData({ buildName });
    if (buildData.type === 'forge') {
        const forgeCount = (buildName === Items.BUILD_FORGE_VULKAN)
            ? admin.builds.forges.vulkan
            : admin.builds.forges.oryon;

        createButton({
            click: () => onClickBuild({ buildName }),
            css: 'build',
            id: `Build${buildName}-${forgeCount}`,
            image: getSpritePath({ spriteName: `build_${buildName.toLowerCase()}` }),
            parent: tileMapElId,
        });

        placeTileEntity({
            elId: `Build${buildName}-${forgeCount}`,
            height: buildData.height,
            width: buildData.width,
            x: buildData.x,
            y: 0 - (forgeCount - 1),
            z: 0,
        });
    }
};

const onClickBuild = ({ buildName }: { buildName: Items }) => {
    const admin = getAdmin();

    const buildData = getBuildData({ buildName });

    const buildInfoElExist = checkElement({ elId: 'BuildInfo' });
    if (buildInfoElExist) return;

    if (buildData.type === 'forge') {
        const forgeEl = getElement({ elId: `Build${buildName}-${1}` });

        const buildInfoEl = createElement({
            css: 'build frame row align g-8 p-box',
            id: 'BuildInfo',
            parent: 'UI',
        });
        buildInfoEl.style.left = `${forgeEl.offsetLeft + TILE_SIZE}px`;
        buildInfoEl.style.top = `${forgeEl.offsetTop - TILE_SIZE}px`;

        for (const input of buildData.forge.inputs) {
            createElement({
                absolute: false,
                css: 'row align g-4',
                id: `BuildInfoInput${input.name}`,
                parent: 'BuildInfo',
            });

            createElement({
                absolute: false,
                css: 'icon',
                id: `BuildInfoInputIcon${input.name}`,
                image: getSpritePath({ spriteName: `resource_${input.name.toLowerCase()}` }),
                parent: `BuildInfoInput${input.name}`,
            });

            createElement({
                absolute: false,
                css: 't-10',
                id: `BuildInfoInputAmount${input.name}`,
                parent: `BuildInfoInput${input.name}`,
                text: `x${input.amount}`,
            });
        }

        createElement({
            absolute: false,
            css: 'row align g-4',
            id: 'BuildInfoSpeed',
            parent: 'BuildInfo',
        });

        createElement({
            absolute: false,
            css: 'icon',
            id: 'BuildInfoSpeedIcon',
            image: getSpritePath({ spriteName: 'lab_run' }),
            parent: 'BuildInfoSpeed',
        });

        createElement({
            absolute: false,
            css: 't-10',
            id: 'BuildInfoSpeedAmount',
            parent: 'BuildInfoSpeed',
            text: (buildName === Items.BUILD_FORGE_VULKAN)
                ? `${admin.stats._forgeVulkanSpeed * 100}s`
                : `${admin.stats._forgeOryonSpeed * 100}s`,
        });

        for (const output of buildData.forge.outputs) {
            createElement({
                absolute: false,
                css: 'row align g-4',
                id: `BuildInfoOutput${output.name}`,
                parent: 'BuildInfo',
            });

            createElement({
                absolute: false,
                css: 'icon',
                id: `BuildInfoOutputIcon${output.name}`,
                image: getSpritePath({ spriteName: `resource_${output.name.toLowerCase()}` }),
                parent: `BuildInfoOutput${output.name}`,
            });

            createElement({
                absolute: false,
                css: 't-10',
                id: `BuildInfoOutputAmount${output.name}`,
                parent: `BuildInfoOutput${output.name}`,
                text: `x${output.amount}`,
            });
        }

        createButton({
            click: () => destroyElement({ elId: 'BuildInfo' }),
            css: 'close enable',
            id: 'BuildInfoClose',
            image: getSpritePath({ spriteName: 'ui_close' }),
            parent: 'BuildInfo',
        });
    }
};

//#region ADMIN
const createAdmin = () => {
    const adminBuildData = getBuildData({ buildName: 'ADMIN' });

    createButton({
        click: () => displayAdminMenu({ display: true }),
        css: 'admin',
        id: 'AdminEntity',
        image: getSpritePath({ spriteName: 'build_admin' }),
        parent: tileMapElId,
        title: 'Admin',
    });

    placeTileEntity({
        elId: 'AdminEntity',
        height: adminBuildData.height,
        width: adminBuildData.width,
        x: adminBuildData.x,
        y: 0,
        z: 0,
    });
};

export const createAdminToast = ({ name, amount }: {
    amount: number,
    name: string,
}) => {
    const adminBuildData = getBuildData({ buildName: 'ADMIN' });

    const timestamp = Date.now();
    const adminToastEl = createElement({
        css: 'toast row align',
        id: `AdminToast${name}${amount}${timestamp}`,
        parent: tileMapElId,
    });
    adminToastEl.style.left = `${(adminBuildData.x * TILE_SIZE) + adminBuildData.width}px`;
    adminToastEl.style.top = `${(
        (0 + ((TILEMAP_GROUND_LEVEL + 1) - adminBuildData.height)
        ) * TILE_SIZE) - (TILE_SIZE / 2)}px`;

    createElement({
        absolute: false,
        css: 't-8',
        id: `AdminToastAmount${name}${amount}${timestamp}`,
        parent: `AdminToast${name}${amount}${timestamp}`,
        text: `${amount}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `AdminToastIcon${name}${amount}${timestamp}`,
        image: getSpritePath({ spriteName: `resource_${name.toLowerCase()}` }),
        parent: `AdminToast${name}${amount}${timestamp}`,
    });

    setTimeout(() => destroyElement({ elId: `AdminToast${name}${amount}${timestamp}` }), ADMIN_TOAST_TIMEOUT);
};

export const setAdminMode = ({ mode }: { mode: 'base' | 'disable' }) => {
    const adminEl = getElement({ elId: 'AdminEntity' });

    if (mode === 'base') {
        adminEl.classList.remove('disable');
    }
    else if (mode === 'disable') {
        adminEl.classList.add('disable');
    }
};
//#endregion
//#endregion

//#region GEM
//#region CONSTANTS
const GEM_TOAST_TIMEOUT = 3000;

type GemMode = 'base' | 'request' | 'hover' | 'disable' | 'work' | 'mine' | 'carry';
//#endregion

export const createGem = ({ gemId }: { gemId: string }) => {
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    createButton({
        click: () => onClickGem({ gemId }),
        css: 'gem',
        entityId: gemId,
        parent: tileMapElId,
        sprite: true,
    });

    placeTileEntity({
        elId: gemId,
        height: gemSprite._height,
        width: gemSprite._width,
        x: gemPosition._x,
        y: gemPosition._y,
    });
};

export const destroyGem = ({ gemId }: { gemId: string }) => {
    destroyElement({ elId: gemId });
};

export const setGemMode = ({ gemId, mode, remove }: {
    gemId: string,
    mode: GemMode,
    remove?: boolean,
}) => {
    const gemType = getGemType({ gemId });
    const gemEl = getElement({ elId: gemId });

    if (mode === 'work') {
        if (gemType === Gems.CARRY || gemType === Gems.FLOOR || gemType === Gems.LIFT) {
            mode = 'carry';
        }
        else if (gemType === Gems.MINE || gemType === Gems.SHAFT || gemType === Gems.TUNNEL) {
            mode = 'mine';
        }
    }

    if (remove) {
        gemEl.classList.remove(mode);
        return;
    }

    if (mode === 'base') {
        gemEl.classList.remove('request');
        gemEl.classList.remove('hover');
        gemEl.classList.remove('disable');
        gemEl.classList.remove('mine');
        gemEl.classList.remove('carry');
    }
    else {
        gemEl.classList.add(mode);
    }
};

export const setAllGemsMode = ({ gemId, mode, remove }: {
    gemId: string,
    mode: GemMode,
    remove?: boolean,
}) => {
    const gemEls = searchElementsByClassName({ className: 'gem', parent: tileMapElId })
        .filter((gemEl) => gemEl.id !== gemId);

    gemEls.forEach((gemEl) => setGemMode({ gemId: gemEl.id, mode, remove }));
};

export const createGemToast = ({ gemId, name, amount }: {
    amount: number,
    gemId: string,
    name: string,
}) => {
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });

    const timestamp = Date.now();
    const gemToastEl = createElement({
        css: 'toast row align',
        id: `GemToast${gemId}${name}${amount}${timestamp}`,
        parent: tileMapElId,
    });
    gemToastEl.style.left = `${gemPosition._x * TILE_SIZE}px`;
    gemToastEl.style.top = `${(
        (gemPosition._y + ((TILEMAP_GROUND_LEVEL + 1) - gemSprite._height)
        ) * TILE_SIZE) - (TILE_SIZE / 2)}px`;

    createElement({
        absolute: false,
        css: 't-8',
        id: `GemToastAmount${gemId}${name}${amount}${timestamp}`,
        parent: `GemToast${gemId}${name}${amount}${timestamp}`,
        text: `${amount}`,
    });

    createElement({
        absolute: false,
        css: 'icon',
        id: `GemToastIcon${gemId}${name}${amount}${timestamp}`,
        image: getSpritePath({ spriteName: `resource_${name.toLowerCase()}` }),
        parent: `GemToast${gemId}${name}${amount}${timestamp}`,
    });

    setTimeout(() => destroyElement({ elId: `GemToast${gemId}${name}${amount}${timestamp}` }), GEM_TOAST_TIMEOUT);
};

const onClickGem = ({ gemId }: { gemId: string }) => {
    setGemMode({ gemId, mode: 'request' });
    displayGemView({ display: true, gemId });
};
//#endregion
//#endregion
//#endregion
