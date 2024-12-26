import { emit } from '@/engine/services/emit';
import { EngineEvents } from '@/engine/services/event';
import { getState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { getComponent } from '@/engine/systems/entity';
import {
    createButton,
    createElement,
    destroyElement,
    displayAdminMenu,
    displayGemUI,
    getElement,
    searchElementsByClassName,
} from '@/render/templates';

//#region CONSTANTS
export const TILE_SIZE = 32;
export const TILEMAP_GROUND_LEVEL = 5;

let tileMapElId: string;
//#endregion

//#region TEMPLATES
//#region TILEMAP
export const createTileMap = ({ tileMapId }: { tileMapId: string }) => {
    tileMapElId = tileMapId;

    createElement({
        css: 'tilemap',
        entityId: tileMapId,
        sprite: true,
    });

    createAdmin();
};

export const destroyTileMap = ({ tileMapId }: { tileMapId: string }) => {
    destroyElement({ elId: tileMapId });
};
//#endregion

//#region TILE
export const createTile = ({ tileId }: { tileId: string }) => {
    const tileEl = createButton({
        click: () => selectTile({ tileId }),
        entityId: tileId,
        parent: tileMapElId,
        sprite: true,
    });

    const tilePosition = getComponent({ componentId: 'Position', entityId: tileId });

    tileEl.style.top = `${tilePosition._y * TILE_SIZE + TILEMAP_GROUND_LEVEL * TILE_SIZE}px`;
    tileEl.style.left = `${tilePosition._x * TILE_SIZE}px`;
};

export const setTileMode = ({ tileId, mode }: {
    mode: 'base' | 'request' | 'destroy' | 'ground',
    tileId?: string,
}) => {
    const tileEls = searchElementsByClassName({ className: 'tile', parent: tileMapElId });

    if (mode === 'base') {
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
    else if (mode === 'request') {
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
    else if (mode === 'destroy') {
        if (!(tileId)) return;

        const tileEl = getElement({ elId: tileId });

        tileEl.classList.add('destroy');
    }
    else if (mode === 'ground') {
        if (!(tileId)) return;

        const tileEl = getElement({ elId: tileId });

        tileEl.classList.add('ground');
    }
};

const selectTile = ({ tileId }: { tileId: string }) => {
    if (getState({ key: 'requestTile' })) {
        emit({ entityId: tileId, target: 'engine', type: EngineEvents.TILE_SELECT });
    }
};
//#endregion

//#region ENTITY
const placeTileEntity = ({ elId, width, height, top, left }: {
    elId: string,
    height: number,
    left: number,
    top?: number,
    width: number
}) => {
    const el = getElement({ elId });

    el.style.width = `${width * TILE_SIZE}px`;
    el.style.height = `${height * TILE_SIZE}px`;
    el.style.top = `${(TILEMAP_GROUND_LEVEL + 1) * TILE_SIZE - ((top ?? height) * TILE_SIZE)}px`;
    el.style.left = `${left * TILE_SIZE}px`;
    el.style.zIndex = '1';
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
    createButton({
        click: () => displayAdminMenu({ display: true }),
        css: 'admin',
        id: 'AdminEntity',
        parent: tileMapElId,
    });

    placeTileEntity({ elId: 'AdminEntity', height: 2, left: 1, width: 3 });
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

//#region GEM
export const createGem = ({ gemId }: { gemId: string }) => {
    const gemSprite = getComponent({ componentId: 'Sprite', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    createButton({
        click: () => {
            setGemMode({ gemId, mode: 'request' });
            displayGemUI({ display: true, gemId });
        },
        entityId: gemId,
        parent: tileMapElId,
        sprite: true,
    });

    placeTileEntity({
        elId: gemId,
        height: gemSprite._height,
        left: gemPosition._x,
        width: gemSprite._width,
    });
};

export const destroyGem = ({ gemId }: { gemId: string }) => {
    destroyElement({ elId: gemId });
};

export const setGemMode = ({ gemId, mode, remove }: {
    gemId: string,
    mode: 'base' | 'request' | 'disable' | 'mine' | 'carry'
    remove?: boolean,
}) => {
    const gemEl = getElement({ elId: gemId });

    if (remove) {
        gemEl.classList.remove(mode);
        return;
    }

    if (mode === 'base') {
        gemEl.classList.remove('request');
        gemEl.classList.remove('disable');
        gemEl.classList.remove('mine');
        gemEl.classList.remove('carry');
    }
    else {
        gemEl.classList.add(mode);
    }
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
