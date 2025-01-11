import { Items, Quest } from '@/engine/components';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';
import { addAdminItem } from '@/engine/systems/item';
import { createLab } from '@/engine/systems/lab';
import { getQuestData, searchQuest } from '@/engine/systems/quest';
import { RenderEvents } from '@/render/events';

//#region CONSTANTS
//#endregion

//#region SYSTEMS
export const createQuest = ({ questName }: { questName: string }) => {
    const admin = getAdmin();

    const questData = getQuestData({ questName });

    const quest: Quest = {
        _done: false,
        _progress: 0,
        data: questData,
    };

    if (questData.type === 'gem') {
        quest._progress = admin.gems.length;
    }

    admin.quests.push(quest);

    emit({ target: 'render', type: RenderEvents.QUEST_CREATE });
};

export const progressQuestMine = ({ name, amount }: {
    amount: number,
    name: Items,
}) => {
    const quest = searchQuest({ name, type: 'mine' });

    if (!(quest)) return;
    if (quest._done) return;
    if (!(quest.data.type === 'mine')) return;

    quest._progress += amount;

    if (quest._progress >= quest.data.mine.amount) {
        endQuest({ name: quest.data.name, type: 'mine' });
        return;
    }

    emit({ target: 'render', type: RenderEvents.QUEST_UPDATE });
};

export const progressQuestCarry = ({ amount }: { amount: number }) => {
    const quest = searchQuest({ name: 'carry', type: 'carry' });

    if (!(quest)) return;
    if (quest._done) return;
    if (!(quest.data.type === 'carry')) return;

    quest._progress += amount;

    if (quest._progress >= quest.data.carry) {
        endQuest({ name: quest.data.name, type: 'carry' });
        return;
    }

    emit({ target: 'render', type: RenderEvents.QUEST_UPDATE });
};

export const progressQuestGems = ({ amount }: { amount: number }) => {
    const quest = searchQuest({ name: 'gems', type: 'gem' });

    if (!(quest)) return;
    if (quest._done) return;
    if (!(quest.data.type === 'gem')) return;

    quest._progress += amount;

    if (quest._progress >= quest.data.gems) {
        endQuest({ name: quest.data.name, type: 'gem' });
        return;
    }

    emit({ target: 'render', type: RenderEvents.QUEST_UPDATE });
};

const endQuest = ({ name, type }: {
    name: string,
    type: 'mine' | 'carry' | 'gem',
}) => {
    const admin = getAdmin();

    const quest = searchQuest({ name, type });

    if (!(quest)) throw error({
        message: `Quest ${type} ${name} not found`,
        where: endQuest.name,
    });

    quest._done = true;

    for (const reward of quest.data.reward) {
        if (reward.type === 'lab') {
            admin.stats._labPoints += reward.amount;

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
        }
        else if (reward.type === 'item') {
            addAdminItem({ amount: reward.amount, name: reward.name });

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_STORAGE });
        }
    }

    for (const unlock of quest.data.unlock) {
        if (unlock.type === 'lab') {
            createLab({ name: unlock.name });

            emit({ target: 'render', type: RenderEvents.ADMIN_UPDATE_LABS });
        }
        else if (unlock.type === 'quest') {
            createQuest({ questName: unlock.name });
        }
    }

    emit({ target: 'render', type: RenderEvents.QUEST_END });
    emit({ data: { text: `${name} complete !`, type: 'success' }, target: 'render', type: RenderEvents.INFO });
};
//#endregion
