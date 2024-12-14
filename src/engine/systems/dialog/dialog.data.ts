import { DialogText } from '@/engine/components/dialog';
import { getComponent, getRawEntityId } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { createQuest, QuestData } from '@/engine/systems/manager';

const dialogFiles: Record<string, { default: { [dialogId: string]: DialogTextData[] } }>
    = import.meta.glob('/src/assets/dialogs/*.json', { eager: true });
const questFiles: Record<string, { default: QuestData }>
    = import.meta.glob('/src/assets/quests/*.json', { eager: true });

//#region TYPES
export type DialogTextData = {
    id: number,
    next?: number,
    nextDialog?: string,
    options?: number[],
    questEnd?: string,
    questStart?: string,
    value: string
};
//#endregion

//#region DATA
export const loadDialogData = ({ entityId, dialogId }: {
    dialogId?: string,
    entityId: string,
}) => {
    const entityDialog = getComponent({ componentId: 'Dialog', entityId });
    const dialogPath = `/src/assets/dialogs/${getRawEntityId({ entityId }).toLowerCase()}.json`;
    const dialogData = dialogFiles[dialogPath].default
        ?? error({ message: `DialogData for ${entityId} not found`, where: loadDialogData.name });

    const questDialogId = getQuestDialogId({});

    entityDialog._currentId = dialogId ?? questDialogId ?? Object.keys(dialogData)[0];

    entityDialog.texts = dialogData[entityDialog._currentId].map((dialogText: DialogTextData) => {
        const text: DialogText = {
            _id: dialogText.id,
            _next: dialogText.next,
            _nextDialog: dialogText.nextDialog,
            _options: dialogText.options,
            _questEnd: dialogText.questEnd,
            _questStart: dialogText.questStart,
            _value: dialogText.value,
        };

        return text;
    });
};

export const loadQuestData = ({ questName }: { questName: string }) => {
    const questPath = `/src/assets/quests/${questName.toLowerCase()}.json`;
    const questData = questFiles[questPath].default
        ?? error({ message: `QuestData for ${questName} not found`, where: loadQuestData.name });

    createQuest({ questData });
};

const getQuestDialogId = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: loadDialogData.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (manager.quests.length) {
        const questDialogId = (manager.quests[0].completed)
            ? `${manager.quests[0].name}_complete`
            : `${manager.quests[0].name}_pending`;

        return questDialogId;
    }
    else if (manager.questsDone.length) {
        const questDialogId = `${manager.questsDone[manager.questsDone.length - 1].name}_end`;

        return questDialogId;
    }
};
//#endregion
