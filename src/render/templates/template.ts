import { error } from '@/engine/services/error';
import { getRawEntityId } from '@/engine/systems/entity';
import { getComponent } from '@/engine/systems/entity';
import { getElement, TILE_SIZE } from '@/render/templates';

//#region CONSTANTS
const gameEl: HTMLElement = document.getElementById('Game')!;

type ElementData =
    | {
        absolute?: boolean;
        css?: string;
        entityId?: never;
        id: string;
        image?: string;
        parent?: string;
        sprite?: boolean;
        text?: string;
    }
    | {
        absolute?: boolean;
        css?: string;
        entityId: string;
        id?: never;
        image?: never;
        parent?: string;
        sprite?: boolean;
        text?: string;
    };

type ButtonData = ElementData & {
    click: () => void;
}
//#endregion

//#region TEMPLATES
export const createElement = ({
    absolute = true,
    entityId,
    parent,
    css,
    id,
    image,
    sprite = false,
    text,
}: ElementData) => {
    const el = document.createElement('div');

    const elId = (id || entityId) ?? error({
        message: 'Element id must be provided',
        where: createElement.name,
    });

    el.setAttribute('id', elId);

    const elCss = getRawEntityId({ entityId: elId })
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();

    el.setAttribute('class', `${css || elCss || ''}`.trim());

    el.style.position = (absolute)
        ? 'absolute'
        : 'relative';

    const parentEl = (parent)
        ? getElement({ elId: parent })
        : gameEl;

    parentEl.appendChild(el);

    if (text) {
        el.innerText = text;
    }

    if (image) {
        el.style.backgroundImage = `url(${image})`;
    }
    else if (sprite) {
        createSprite({ elId });
    }

    return el;
};

export const createButton = ({
    click,
    ...el
}: ButtonData) => {
    const btn = createElement({ ...el });

    btn.classList.add('btn');
    btn.addEventListener('click', click);

    return btn;
};

export const destroyElement = ({ elId }: { elId: string }) => {
    const element = getElement({ elId });

    while (element.firstChild) element.removeChild(element.firstChild);

    element.remove();
};

export const createSprite = ({ elId }: { elId: string }) => {
    const sprite = getComponent({ componentId: 'Sprite', entityId: elId });

    const el = getElement({ elId });

    el.style.width = `${sprite._width * TILE_SIZE}px`;
    el.style.height = `${sprite._height * TILE_SIZE}px`;
    el.style.backgroundImage = `url(${sprite._image})`;
};
//#endregion
