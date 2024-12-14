import { completeQuest, createQuest, destroyQuest, displayQuestMenu } from '@/render/templates';

//#region EVENTS
export const onQuestsDisplay = () => displayQuestMenu();

export const onQuestStart = () => createQuest();

export const onQuestEnd = () => destroyQuest();

export const onQuestComplete = () => completeQuest();
//#endregion
