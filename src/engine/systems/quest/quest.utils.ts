import { getAdmin } from '@/engine/systems/entity';
//#region CONSTANTS
//#endregion

//#region UTILS
export const searchQuest = ({ type, name }: {
    name: string
    type: 'mine' | 'carry'
}) => {
    const admin = getAdmin();

    const quest = admin.quests.find((quest) =>
        quest.data.type === type
        && (quest.data.name.includes(name.toUpperCase()) || quest.data.name === name)
        && quest._done === false
    );

    return quest;
};
//#endregion
