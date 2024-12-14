import { Dialog, DialogText } from '@/engine/components/dialog';
import { error } from '@/engine/services/error';

//#region CHECKS
export const invalidDialog
    = (dialog: Dialog) => !(dialog.texts.length) || !(dialog.texts.some((text) => text._id === 1));
export const invalidDialogText = (text: DialogText) => !(text._value.length);
export const invalidDialogTextNext = (text: DialogText) => text._next !== undefined && !!(text._options?.length);
export const isDialogTextEnd = (text: DialogText) => !(text._next) && !(text._options);
export const isDialogTextDialogNext = (text: DialogText) => text._nextDialog !== undefined;
export const isDialogTextQuestStart = (text: DialogText) => text._questStart !== undefined;
export const isDialogTextQuestEnd = (text: DialogText) => text._questEnd !== undefined;
export const isDialogTextOptionsSet = (text: DialogText) => !!(text._options?.length);
//#endregion

//#region UTILS
export const getDialogText = (dialog: Dialog, textId: number = 1) => dialog.texts.find((text) => text._id === textId);

export const getDialogCurrentText = (dialog: Dialog) => getDialogText(dialog, dialog._currentTextId);

export const setDialogCurrentText = (entityId: string, dialog: Dialog, textIndex: number = 1) => {
    dialog._currentTextId = textIndex;

    const dialogCurrentText = getDialogCurrentText(dialog)
        ?? error({
            message: `DialogText ${entityId}-${dialog._currentTextId} not found`,
            where: setDialogCurrentText.name,
        });

    if (invalidDialogText(dialogCurrentText)) {
        error({
            message: `DialogText ${entityId}-${dialog._currentTextId} is invalid`,
            where: setDialogCurrentText.name,
        });
    }

    if (isDialogTextOptionsSet(dialogCurrentText)) {
        dialog._currentOptionIndex = 0;
    }
    else {
        dialog._currentOptionIndex = undefined;
    }

    setDialogCurrentValues(dialog);
};

export const setDialogCurrentValues = (dialog: Dialog) => {
    dialog._currentValue = undefined;
    const dialogCurrentText = getDialogCurrentText(dialog)
        ?? error({ message: `DialogText ${dialog._currentTextId} not found`, where: setDialogCurrentValues.name });
    dialog._currentValue = dialogCurrentText._value;

    dialog._currentOptionsValues = undefined;
    if (isDialogTextOptionsSet(dialogCurrentText)) {
        dialog._currentOptionsValues = dialogCurrentText._options?.map((option) => getDialogText(dialog, option)?._value
            ?? error({
                message: `DialogText ${dialog._currentTextId} option ${option} not found`,
                where: setDialogCurrentValues.name,
            }),
        );
    }
};
//#endregion
