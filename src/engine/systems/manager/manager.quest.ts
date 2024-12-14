import { error } from '../../services/error';

import { checkComponent, findEntityByName, getComponent } from '@/engine/entities';
import { setCheck } from '@/engine/services/cycle';
import { EventTypes } from '@/engine/services/event';
import { getState, setState } from '@/engine/services/state';
import { getStore } from '@/engine/services/store';
import { loadDialogData } from '@/engine/systems/dialog';
import { checkInventory, removeItemFromInventory } from '@/engine/systems/inventory';
import { event } from '@/render/events';

//#region TYPES
export type Quest = {
    check?: () => boolean,
    completed: boolean,
    items?: QuestItem[],
    name: string,
    places?: QuestPlace[],
    talk?: string,
};

export type QuestData = {
    items?: {
        amount: number,
        keep: boolean,
        name: string,
    }[],
    name: string,
    places?: {
        active?: boolean,
        amount: number,
        name: string,
    }[],
    recipes?: string[],
    talk?: string,
};

type QuestItem = {
    _amount: number,
    _keep: boolean,
    _name: string,
};

type QuestPlace = {
    _active?: boolean,
    _amount: number,
    _name: string,
}
//#endregion

//#region SYSTEMS
export const initQuest = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: initQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (manager.quests.length) {
        startQuest({ quest: manager.quests[0] });
    }
};

export const createQuest = ({ questData, managerEntityId }: {
    managerEntityId?: string | null,
    questData: QuestData,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: createQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (questData.recipes) {
        for (const recipe of questData.recipes) {
            if (!(manager.itemRecipes.find((itemRecipe) => itemRecipe === recipe))) {
                manager.itemRecipes.push(recipe);
            }
        }
    }

    const quest: Quest = {
        completed: false,
        items: (questData?.items)
            ? questData.items.map((item) => ({ _amount: item.amount, _keep: item.keep, _name: item.name }))
            : undefined,
        name: questData.name,
        places: (questData?.places)
            ? questData.places.map((place) => ({ _active: place.active, _amount: place.amount, _name: place.name }))
            : undefined,
        talk: (questData?.talk) ? questData.talk : undefined,
    };
    quest.check = createQuestCheck({ quest });

    manager.quests.push(quest);

    if (!(getState('isQuestActive'))) {
        startQuest({ quest });
    }
};

export const startQuest = ({ quest, managerEntityId }: {
    managerEntityId?: string | null,
    quest: Quest,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: startQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    manager._selectedQuest = manager.quests.indexOf(quest);

    if (!(getState('isQuestActive'))) setState('isQuestActive', true);

    if (!(quest.check)) {
        quest.check = createQuestCheck({ quest });
    }
    setCheck('questCheck', quest.check ?? error({
        message: 'QuestCheck is undefined',
        where: startQuest.name,
    }));

    event({ type: EventTypes.QUEST_START });
    event({ data: { audioName: 'quest_start' }, type: EventTypes.AUDIO_PLAY });
};

export const completeQuest = ({ managerEntityId, questState }: {
    managerEntityId?: string | null,
    questState: boolean,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: completeQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const quest = manager.quests[manager._selectedQuest];
    quest.completed = questState;

    if (quest?.talk) {
        const { entity: talkEntity, entityId: talkEntityId } = findEntityByName({ entityName: quest.talk });
        if (!(talkEntity && talkEntityId)) throw error({
            message: `Entity ${quest.talk} does not exist`,
            where: completeQuest.name,
        });

        const talkEntityDialog = getComponent({ componentId: 'Dialog', entityId: talkEntityId });

        if (!(talkEntityDialog._currentId)) throw error({
            message: `Entity ${quest.talk} has invalid dialog`,
            where: completeQuest.name,
        });

        loadDialogData({
            dialogId: (quest.completed)
                ? `${quest.name}_complete`
                : `${quest.name}_pending`,
            entityId: talkEntityId,
        });
    }

    setState('isQuestActive', (quest.completed) ? false : true);
    setState('isQuestComplete', (quest.completed) ? true : false);

    event({ type: (quest.completed) ? EventTypes.QUEST_COMPLETE : EventTypes.QUEST_START });
    event({ data: { audioName: (quest.completed) ? 'quest_complete' : 'main_fail' }, type: EventTypes.AUDIO_PLAY });
};

export const endQuest = ({ managerEntityId, playerEntityId }: {
    managerEntityId?: string | null,
    playerEntityId?: string | null,
}) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: endQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: endQuest.name });

    const quest = manager.quests[manager._selectedQuest];

    if (quest?.items) {
        for (const item of quest.items) {
            if (!(item._keep)) {
                removeItemFromInventory({
                    entityId: playerEntityId,
                    itemAmount: item._amount,
                    itemName: item._name,
                });
            }
        }
    }

    manager.questsDone.push(quest);
    manager.quests.splice(manager._selectedQuest, 1);
    manager._selectedQuest = 0;

    if (manager.quests.length) {
        startQuest({ quest: manager.quests[manager._selectedQuest] });
    }
    else {
        setState('isQuestActive', false);
        setState('isQuestComplete', false);
        setState('isQuestEnd', true);
    }

    event({ type: EventTypes.QUEST_END });
    event({ data: { audioName: 'quest_end' }, type: EventTypes.AUDIO_PLAY });
};

const createQuestCheck = ({ quest, playerEntityId }: {
    playerEntityId?: string | null,
    quest: Quest,
}) => {
    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: createQuestCheck.name });

    let check = () => true;
    let checkHasConditions = false;

    if (quest?.items) {
        const _check = check;
        check = () => _check() && checkInventory({
            entityId: playerEntityId,
            items: (quest.items ?? []).map((item) => {
                return {
                    amount: item._amount,
                    name: item._name,
                };
            }),
        });
        checkHasConditions = true;
    }

    if (quest?.places) {
        const _check = check;
        const checkPlace = () => (quest.places ?? []).map((place) => {
            const { entityId } = findEntityByName({ entityName: place._name });

            if (place._active && entityId && checkComponent({ componentId: 'State', entityId })) {
                const state = getComponent({ componentId: 'State', entityId });
                return state._active;
            }
            else {
                return !!(entityId);
            }
        });
        check = () => _check() && checkPlace().every((value) => value);
        checkHasConditions = true;
    }

    if (!(checkHasConditions)) throw error({
        message: 'QuestData is invalid',
        where: createQuestCheck.name,
    });

    return check;
};
//#endregion
