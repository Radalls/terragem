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
    mode: 'base' | 'request' | 'destroy' | 'ground' | 'move',
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

                setAllOtherGemsMode({ gemId, mode: 'disable', remove: true });
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
            setAllOtherGemsMode({ gemId, mode: 'disable' });
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
const SCROLL_EDGE_TRIGGER = 10;
let cursorX = 0;
let cursorY = 0;
let scrollMaxX = 0;
let scrollMaxY = 0;
let scrollViewportX = 0;
let scrollViewportY = 0;
//#endregion

export const initScroll = () => {
    window.addEventListener('mousemove', (e: MouseEvent) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });
};

export const updateScroll = () => {
    const { innerWidth, innerHeight } = window;
    const tileMapEl = getElement({ elId: tileMapElId });

    let newScrollX = scrollViewportX;
    let newScrollY = scrollViewportY;

    if (cursorX > innerWidth - SCROLL_EDGE_TRIGGER) {
        newScrollX = Math.min(newScrollX + SCROLL_SPEED, scrollMaxX);
    }
    if (cursorX < SCROLL_EDGE_TRIGGER) {
        newScrollX = Math.max(newScrollX - SCROLL_SPEED, 0);
    }

    if (cursorY > innerHeight - SCROLL_EDGE_TRIGGER) {
        newScrollY = Math.min(newScrollY + SCROLL_SPEED, scrollMaxY);
    }
    if (cursorY < SCROLL_EDGE_TRIGGER) {
        newScrollY = Math.max(newScrollY - SCROLL_SPEED, 0);
    }

    scrollViewportX = newScrollX;
    scrollViewportY = newScrollY;

    tileMapEl.style.transform = `translate3d(${-scrollViewportX}px, ${-scrollViewportY}px, 0)`;
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

//#region ADMIN
const createAdmin = () => {
    const adminBuildData = getBuildData({ buildName: 'ADMIN' });

    createButton({
        click: () => displayAdminMenu({ display: true }),
        css: 'admin',
        id: 'AdminEntity',
        image: getSpritePath({ spriteName: 'build_admin' }),
        parent: tileMapElId,
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

//#region BUILD
//#region CONSTANTS
//#endregion

export const createBuild = ({ buildName }: { buildName: Items }) => {
    const admin = getAdmin();

    const buildData = getBuildData({ buildName });
    const buildCount = (buildName === Items.BUILD_FORGE_VULKAN)
        ? admin.builds.forges.vulkan
        : admin.builds.forges.oryon;

    createElement({
        css: 'build',
        id: `Build${buildName}-${buildCount}`,
        image: getSpritePath({ spriteName: `build_${buildName.toLowerCase()}` }),
        parent: tileMapElId,
    });

    placeTileEntity({
        elId: `Build${buildName}-${buildCount}`,
        height: buildData.height,
        width: buildData.width,
        x: buildData.x,
        y: buildCount - 1,
        z: 0,
    });
};

//#region GEM
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
    mode: 'base' | 'request' | 'hover' | 'disable' | 'work' | 'mine' | 'carry',
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

const onClickGem = ({ gemId }: { gemId: string }) => {
    setGemMode({ gemId, mode: 'request' });
    displayGemView({ display: true, gemId });
};

export const setAllOtherGemsMode = ({ gemId, mode, remove }: {
    gemId: string,
    mode: 'base' | 'request' | 'disable'
    remove?: boolean,
}) => {
    const gemEls = searchElementsByClassName({ className: 'gem', parent: tileMapElId })
        .filter((gemEl) => gemEl.id !== gemId);

    gemEls.forEach((gemEl) => setGemMode({ gemId: gemEl.id, mode, remove }));
};
//#endregion
//#endregion
//#endregion
