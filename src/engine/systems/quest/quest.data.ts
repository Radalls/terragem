import quests from '@/assets/quests/quests.json';
import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region TYPES
export type QuestData =
    | {
        mine: { amount: number, name: string };
        name: string;
        reward: ({ amount: number, type: 'lab' } | { amount: number, name: Items, type: 'item' })[];
        text: string;
        type: 'mine';
        unlock: { name: string, type: 'lab' | 'quest' }[];
    }
    | {
        carry: number;
        name: string;
        reward: ({ amount: number, type: 'lab' } | { amount: number, name: Items, type: 'item' })[];
        text: string;
        type: 'carry';
        unlock: { name: string, type: 'lab' | 'quest' }[];
    }
    | {
        gems: number;
        name: string;
        reward: ({ amount: number, type: 'lab' } | { amount: number, name: Items, type: 'item' })[];
        text: string;
        type: 'gem';
        unlock: { name: string, type: 'lab' | 'quest' }[];
    }
//#endregion

//#region DATA
export const getQuestData = ({ questName }: { questName: string }) => {
    const questz = quests.filter((data) => !(data['@']));

    const questData = questz.find((data) => data.name === questName) ?? error({
        message: `CraftData for ${questName} not found`,
        where: getQuestData.name,
    });

    return questData as QuestData;
};
//#endregion
