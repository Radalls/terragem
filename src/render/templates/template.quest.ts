import { createElement, destroyElement } from './template';
import { checkElement, getElement, getSpritePath, searchElementsByClassName } from './template.utils';

import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region TEMPLATES
export const createQuestMenu = () => {
    createElement({
        elementClass: 'quests',
        elementId: 'QuestMenu',
        elementParent: getElement({ elementId: 'UI' }),
    });
};

export const displayQuestMenu = () => {
    const quests = getElement({ elementId: 'QuestMenu' });

    quests.style.display = (quests.style.display === 'block') ? 'none' : 'block';
};

export const destroyQuestMenu = () => {
    destroyElement({ elementId: 'QuestMenu' });
};

export const createQuest = () => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: createQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const quests = getElement({ elementId: 'QuestMenu' });
    const questData = manager.quests[manager._selectedQuest];

    if (checkElement({ elementId: `Quest${manager._selectedQuest}` })) {
        destroyElement({ elementId: `Quest${manager._selectedQuest}` });
    }

    const quest = createElement({
        elementAbsolute: false,
        elementClass: 'quest',
        elementId: `Quest${manager._selectedQuest}`,
        elementParent: quests,
    });

    if (questData?.items) {
        for (const item of questData.items) {
            const questItem = createElement({
                elementAbsolute: false,
                elementClass: 'quest-item',
                elementId: `Quest-${manager._selectedQuest}-Item-${item._name}`,
                elementParent: quest,
            });

            const questItemAmount = createElement({
                elementAbsolute: false,
                elementClass: 'quest-item-amount',
                elementId: `Quest-${manager._selectedQuest}-Item-${item._name}-Amount`,
                elementParent: questItem,
            });
            questItemAmount.innerText = `- Obtient ${item._amount} `;

            const questItemIcon = createElement({
                elementAbsolute: false,
                elementClass: 'quest-item-icon',
                elementId: `Quest-${manager._selectedQuest}-Item-${item._name}-Icon`,
                elementParent: questItem,
            });
            questItemIcon.style.backgroundImage
                = `url(${getSpritePath({ spriteName: `item_${item._name.toLowerCase()}` })})`;
        }
    }

    if (questData?.places) {
        for (const place of questData.places) {
            const questPlace = createElement({
                elementAbsolute: false,
                elementClass: 'quest-place',
                elementId: `Quest-${manager._selectedQuest}-Place-${place._name}`,
                elementParent: quest,
            });

            const questPlaceAmount = createElement({
                elementAbsolute: false,
                elementClass: 'quest-place-amount',
                elementId: `Quest-${manager._selectedQuest}-Place-${place._name}-Amount`,
                elementParent: questPlace,
            });
            questPlaceAmount.innerText = `- Place ${place._amount} `;

            const questPlaceIcon = createElement({
                elementAbsolute: false,
                elementClass: 'quest-place-icon',
                elementId: `Quest-${manager._selectedQuest}-Place-${place._name}-Icon`,
                elementParent: questPlace,
            });
            questPlaceIcon.style.backgroundImage
                = `url(${getSpritePath({ spriteName: `item_${place._name.toLowerCase()}` })})`;

            if (place._active) {
                const questPlaceActive = createElement({
                    elementAbsolute: false,
                    elementClass: 'quest-place-active',
                    elementId: `Quest-${manager._selectedQuest}-Place-${place._name}-Active`,
                    elementParent: quest,
                });

                const questPlaceActiveText = createElement({
                    elementAbsolute: false,
                    elementClass: 'quest-place-active-text',
                    elementId: `Quest-${manager._selectedQuest}-Place-${place._name}-ActiveText`,
                    elementParent: questPlaceActive,
                });
                questPlaceActiveText.innerText = '- Active ';

                const questPlaceActiveIcon = createElement({
                    elementAbsolute: false,
                    elementClass: 'quest-place-active-icon',
                    elementId: `Quest-${manager._selectedQuest}-Place-${place._name}-ActiveIcon`,
                    elementParent: questPlaceActive,
                });
                questPlaceActiveIcon.style.backgroundImage
                    = `url(${getSpritePath({ spriteName: `resource_${place._name.toLowerCase()}` })})`;
            }
        }
    }
};

export const completeQuest = () => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: completeQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const questData = manager.quests[manager._selectedQuest];

    const quest = getElement({ elementId: `Quest${manager._selectedQuest}` });

    if (questData?.items) {
        const questItems = searchElementsByClassName({ className: 'quest-item' });
        for (const item of questItems) {
            destroyElement({ elementId: item.id });
        }
    }

    if (questData?.places) {
        const questPlaces = searchElementsByClassName({ className: 'quest-place' });
        for (const place of questPlaces) {
            destroyElement({ elementId: place.id });
        }

        if (questData.places.some((place) => place._active)) {
            const questPlacesActive = searchElementsByClassName({ className: 'quest-place-active' });
            for (const place of questPlacesActive) {
                destroyElement({ elementId: place.id });
            }
        }
    }

    const questComplete = createElement({
        elementAbsolute: false,
        elementClass: 'quest-complete',
        elementId: `Quest-${manager._selectedQuest}-Complete`,
        elementParent: quest,
    });

    if (questData?.talk) {
        const questTalk = createElement({
            elementAbsolute: false,
            elementClass: 'quest-talk',
            elementId: `Quest-${manager._selectedQuest}-Talk`,
            elementParent: questComplete,
        });
        questTalk.innerText = '- Parle à ';

        const questTalkIcon = createElement({
            elementAbsolute: false,
            elementClass: 'quest-talk-icon',
            elementId: `Quest-${manager._selectedQuest}-TalkIcon`,
            elementParent: questComplete,
        });
        questTalkIcon.style.backgroundImage
            = `url(${getSpritePath({ spriteName: `npc_${questData.talk.toLowerCase()}_talk` })})`;
    }

    const questCompleteIcon = createElement({
        elementAbsolute: false,
        elementClass: 'quest-complete-icon',
        elementId: `Quest-${manager._selectedQuest}-CompleteIcon`,
        elementParent: questComplete,
    });
    questCompleteIcon.style.backgroundImage = `url(${getSpritePath({ spriteName: 'quest_complete' })})`;
};

export const destroyQuest = () => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: destroyQuest.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    destroyElement({ elementId: `Quest${manager._selectedQuest}` });
};
//#endregion
