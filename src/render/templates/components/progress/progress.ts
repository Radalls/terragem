import { createElement, getElement } from '@/render/templates';

type ElementProgressData = {
    color: string;
    elementId: string;
    height: number;
    left: number;
    parent: HTMLElement;
    top: number;
    value: number;
    width: number;
}

export const createProgress = ({ elementId, top, left, width, height, parent, value, color }: ElementProgressData) => {
    const progressContainer = createElement({
        elementClass: 'progress-container',
        elementId: `${elementId}-ProgressContainer`,
        elementParent: parent,
    });
    progressContainer.style.top = `${top}px`;
    progressContainer.style.left = `${left}px`;
    progressContainer.style.width = `${width}px`;
    progressContainer.style.height = `${height}px`;

    const progress = createElement({
        elementAbsolute: false,
        elementClass: 'progress',
        elementId: `${elementId}-Progress`,
        elementParent: progressContainer,
    });
    progress.style.backgroundColor = color;

    const axis = height - width;
    if (axis < 0) {
        progress.style.height = `${height}px`;
    }
    else {
        progress.style.width = `${width}px`;
    }

    updateProgress({ elementId, value });
};

export const updateProgress = ({ elementId, value }: {
    elementId: string;
    value: number;
}) => {
    const progressContainer = getElement({ elementId: `${elementId}-ProgressContainer` });
    const progress = getElement({ elementId: `${elementId}-Progress` });

    const axis = progressContainer.getBoundingClientRect().height - progressContainer.getBoundingClientRect().width;
    if (axis < 0) {
        progress.style.width = `${value}%`;
    }
    else {
        progress.style.height = `${value}%`;
    }
};
