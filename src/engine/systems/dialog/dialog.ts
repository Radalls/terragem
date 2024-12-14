import { loadDialogData, loadQuestData } from './dialog.data';
import {
    getDialogCurrentText,
    invalidDialog,
    invalidDialogTextNext,
    isDialogTextDialogNext,
    isDialogTextEnd,
    isDialogTextOptionsSet,
    isDialogTextQuestEnd,
    isDialogTextQuestStart,
    setDialogCurrentText,
} from './dialog.utils';

import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { consumeFirstKeyPress } from '@/engine/services/input';
import { setState } from '@/engine/services/state';
import { clearStore, getStore, setStore } from '@/engine/services/store';
import { fillEnergy } from '@/engine/systems/energy';
import { emptyPlayerInventory } from '@/engine/systems/inventory';
import { endQuest, getKeyMoveOffset } from '@/engine/systems/manager';
import { setEntityActive } from '@/engine/systems/state';
import { event } from '@/render/events';

//#region SYSTEMS
export const onDialogInput = ({ inputKey, dialogEntityId, managerEntityId }: {
    dialogEntityId?: string | null,
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onDialogInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(dialogEntityId)) dialogEntityId = getStore('dialogId')
        ?? error({ message: 'Store dialogId is undefined', where: onDialogInput.name });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (inputKey === manager.settings.keys.action._act) {
        nextDialog({ entityId: dialogEntityId });
        return;
    }
    else {
        const inputOffset = getKeyMoveOffset({ inputKey, managerEntityId });
        if (!(inputOffset)) return;

        selectDialogOption({ entityId: dialogEntityId, offset: inputOffset });
    }
};

export const startDialog = ({ entityId }: { entityId: string }) => {
    const entityDialog = getComponent({ componentId: 'Dialog', entityId });
    if (invalidDialog(entityDialog)) {
        error({ message: `Dialog ${entityId} is invalid`, where: startDialog.name });
    }

    setEntityActive({ entityId, value: true });
    setDialogCurrentText(entityId, entityDialog);

    setState('isPlayerDialogOpen', true);
    setStore('dialogId', entityId);

    event({ entityId, type: EventTypes.DIALOG_START });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const nextDialog = ({ entityId }: { entityId: string }) => {
    const entityDialog = getComponent({ componentId: 'Dialog', entityId });

    const dialogPreviousText = getDialogCurrentText(entityDialog)
        ?? error({
            message: `DialogText ${entityId}-${entityDialog._currentTextId} not found`,
            where: nextDialog.name,
        });

    if (dialogPreviousText._value.includes('☕')) fillEnergy({}); //TODO: temp
    if (dialogPreviousText._value.includes('🕵️‍♂️')) emptyPlayerInventory({}); //TODO: temp

    if (entityDialog._currentOptionIndex !== undefined && isDialogTextOptionsSet(dialogPreviousText)) {
        entityDialog._currentTextId = dialogPreviousText._options?.[entityDialog._currentOptionIndex];
        entityDialog._currentOptionIndex = undefined;
    }

    const dialogCurrentText = getDialogCurrentText(entityDialog)
        ?? error({
            message: `DialogText ${entityId}-${entityDialog._currentTextId} not found`,
            where: nextDialog.name,
        });

    if (isDialogTextQuestStart(dialogCurrentText)) {
        dialogCurrentText._questStart && loadQuestData({ questName: dialogCurrentText._questStart });
    }
    else if (isDialogTextQuestEnd(dialogCurrentText)) {
        endQuest({});
    }

    if (isDialogTextDialogNext(dialogCurrentText)) {
        dialogCurrentText._nextDialog && loadDialogData({ dialogId: dialogCurrentText._nextDialog, entityId });
    }

    if (isDialogTextEnd(dialogCurrentText)) {
        endDialog({ entityId });
        return;
    }

    if (invalidDialogTextNext(dialogCurrentText)) {
        error({
            message: `DialogText ${entityId}-${entityDialog._currentTextId} next is invalid`,
            where: nextDialog.name,
        });
    }
    setDialogCurrentText(entityId, entityDialog, dialogCurrentText._next);

    event({ entityId, type: EventTypes.DIALOG_UPDATE });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const selectDialogOption = ({ entityId, offset }: { entityId: string, offset: 1 | -1 }) => {
    const entityDialog = getComponent({ componentId: 'Dialog', entityId });

    if (!(entityDialog._currentOptionIndex)) {
        entityDialog._currentOptionIndex = 0;
    }

    const dialogCurrentText = getDialogCurrentText(entityDialog)
        ?? error({
            message: `DialogText ${entityId}-${entityDialog._currentTextId} not found`,
            where: selectDialogOption.name,
        });

    if (!(dialogCurrentText._options)) {
        throw error({
            message: `DialogText ${entityId}-${entityDialog._currentTextId} options not found`,
            where: selectDialogOption.name,
        });
    }

    if (offset === -1) {
        if (entityDialog._currentOptionIndex === 0) {
            entityDialog._currentOptionIndex = dialogCurrentText._options.length - 1;
        }
        else {
            entityDialog._currentOptionIndex = Math.max(0, entityDialog._currentOptionIndex - 1);
        }
    }
    else if (offset === 1) {
        if (entityDialog._currentOptionIndex === dialogCurrentText._options.length - 1) {
            entityDialog._currentOptionIndex = 0;
        }
        else {
            entityDialog._currentOptionIndex = Math.min(
                dialogCurrentText._options.length - 1,
                entityDialog._currentOptionIndex + 1,
            );
        }
    }

    event({ entityId, type: EventTypes.DIALOG_UPDATE });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const endDialog = ({ entityId }: { entityId: string }) => {
    const entityDialog = getComponent({ componentId: 'Dialog', entityId });

    entityDialog._currentTextId = undefined;
    entityDialog._currentOptionIndex = undefined;

    setEntityActive({ entityId, value: false });
    setState('isPlayerDialogOpen', false);
    clearStore('dialogId');

    event({ entityId, type: EventTypes.DIALOG_END });
};
//#endregion SYSTEMS
