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
        title?: string;
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
        title?: string;
    };

type ButtonData = ElementData & {
    click: () => void;
}

type ProgressData = ElementData & {
    value: number;
}
//#endregion

//#region TEMPLATES
export const createElement = ({
    absolute = true,
    id,
    entityId,
    css,
    parent,
    sprite = false,
    image,
    text,
    title,
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

    if (absolute) {
        el.classList.add('abs');
    }
    else {
        el.classList.add('rel');
    }

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

    if (title) {
        el.addEventListener('mouseover', () => {
            el.title = title;
        });
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

export const createProgress = ({
    value,
    ...el
}: ProgressData) => {
    if (!(el.id)) throw error({
        message: 'Element id must be provided',
        where: createProgress.name,
    });

    const progressContainer = createElement({
        ...el,
        id: `${el.id}-ProgressContainer`,
        text: undefined,
    });
    progressContainer.classList.add('progress-container');

    createElement({
        css: 'progress',
        id: `${el.id}-Progress`,
        parent: `${el.id}-ProgressContainer`,
    });

    if (el.text) {
        createElement({
            css: 'progress-text',
            id: `${el.id}-ProgressText`,
            parent: `${el.id}-ProgressContainer`,
            text: el.text,
        });
    }

    updateProgress({ elId: el.id, value });
};

export const updateProgress = ({ elId, value, text }: {
    elId: string;
    text?: string;
    value: number;
}) => {
    const progress = getElement({ elId: `${elId}-Progress` });
    progress.style.width = `${value}%`;

    if (text) {
        const progressText = getElement({ elId: `${elId}-ProgressText` });
        progressText.innerText = text;
    }
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
