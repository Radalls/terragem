import { createElement, destroyElement } from './template';
import { getElement } from './template.utils';

import { getComponent } from '@/engine/entities';

//#region TEMPLATES
export const startDialog = ({ entityId }: { entityId: string }) => {
    const dialogElement = createElement({
        elementClass: 'dialog',
        elementId: `${entityId}-dialog`,
        entityId,
    });

    createElement({
        elementAbsolute: false,
        elementClass: 'dialog-text',
        elementId: `${entityId}-dialog-text`,
        elementParent: dialogElement,
        entityId,
    });

    createElement({
        elementClass: 'dialog-text-options',
        elementId: `${entityId}-dialog-text-options`,
        entityId,
    });

    updateDialog({ entityId });
};

export const updateDialog = ({ entityId }: { entityId: string }) => {
    const dialog = getComponent({ componentId: 'Dialog', entityId });

    const dialogElement = getElement({ elementId: `${entityId}-dialog` });

    const dialogText = getElement({ elementId: `${entityId}-dialog-text` });
    dialogText.innerText = dialog._currentValue ?? 'DIALOG TEXT ERROR';

    destroyDialogOptions({ entityId });

    const dialogTextOptions = getElement({ elementId: `${entityId}-dialog-text-options` });
    dialogTextOptions.style.visibility = (dialog._currentOptionIndex !== undefined) ? 'visible' : 'hidden';
    if (dialogTextOptions.style.visibility === 'visible') {
        dialogTextOptions.style.bottom
            = `${parseFloat(getComputedStyle(dialogElement).bottom) + dialogElement.getBoundingClientRect().height}px`;
    }

    if (dialog._currentOptionsValues) {
        if (!(dialogTextOptions.children.length)) {
            for (let i = 0; i < dialog._currentOptionsValues.length; i++) {
                const dialogOption = createElement({
                    elementAbsolute: false,
                    elementClass: 'dialog-text-option',
                    elementId: `${entityId}-dialog-text-options-${i}`,
                    elementParent: dialogTextOptions,
                    entityId,
                });
                dialogOption.innerText = dialog._currentOptionsValues[i];
            }
        }

        for (let i = 0; i < dialog._currentOptionsValues.length; i++) {
            const dialogOption = getElement({ elementId: `${entityId}-dialog-text-options-${i}` });
            dialogOption.style.fontWeight = (i === dialog._currentOptionIndex) ? 'bold' : 'normal';
        }
    }
};

const destroyDialogOptions = ({ entityId }: { entityId: string }) => {
    const dialogTextOptions = getElement({ elementId: `${entityId}-dialog-text-options` });
    if (dialogTextOptions.children.length) {
        while (dialogTextOptions.children.length) {
            destroyElement({ elementId: dialogTextOptions.children[0].id });
        }
    }
};

export const endDialog = ({ entityId }: { entityId: string }) => {
    destroyDialogOptions({ entityId });
    destroyElement({ elementId: `${entityId}-dialog-text-options` });
    destroyElement({ elementId: `${entityId}-dialog` });
};
//#endregion
