import { getAdmin } from '@/engine/systems/entity';

//#region CONSTANTS
//#endregion

//#region UTILS
export const searchQuest = ({ name }: {
    name: string
    type: 'mine' | 'carry' | 'gem'
}) => {
    const admin = getAdmin();

    const quest = admin.quests.find((quest) =>
        (quest._name.includes(name.toUpperCase()) || quest._name === name)
        && quest._done === false
    );

    return quest;
};
//#endregion
