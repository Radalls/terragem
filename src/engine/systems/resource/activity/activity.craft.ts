import itemRecipes from '../../../../assets/items/item_recipes.json';

import { canPlay, endActivity, loseActivity, startActivity, winActivity } from './activity';

import { ActivityCraftData, ActivityData, ResourceTypes } from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { randAudio } from '@/engine/services/audio';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { consumeFirstKeyPress } from '@/engine/services/input';
import { getState, setState } from '@/engine/services/state';
import { clearStore, getStore } from '@/engine/services/store';
import {
    checkInventory,
    itemIsTool,
    playerHasSameActivityTool,
    playerInventoryFull,
    playerInventoryToolFull,
    removeItemFromInventory,
} from '@/engine/systems/inventory';
import { getKeyMoveOffset } from '@/engine/systems/manager';
import { event } from '@/render/events';

//#region HELPERS
const checkActivityCraftData = (activityData: ActivityData): activityData is ActivityCraftData =>
    (activityData as ActivityCraftData)._hitCount !== undefined;
//#endregion

//#region SERVICES
export const onActivityCraftInput = ({ inputKey, activityId, managerEntityId }: {
    activityId?: string | null,
    inputKey: string,
    managerEntityId?: string | null,
}) => {
    if (!managerEntityId) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: onActivityCraftInput.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(consumeFirstKeyPress(inputKey))) return;

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined ', where: onActivityCraftInput.name });

    if (getState('isActivityCraftSelecting')) {
        if (inputKey === manager.settings.keys.action._act) {
            confirmActivityCraftRecipe({ activityId });
            return;
        }
        else if (
            inputKey === manager.settings.keys.move._up
            || inputKey === manager.settings.keys.move._down
        ) {
            const inputOffset = getKeyMoveOffset({ inputKey, managerEntityId });
            if (!(inputOffset)) throw error({
                message: 'Invalid input',
                where: onActivityCraftInput.name,
            });

            selectActivityCraftRecipe({ activityId, offset: inputOffset });
            return;
        }
        else if (inputKey === manager.settings.keys.action._back) {
            endActivityCraft({ activityId });
            return;
        }
    }
    else if (getState('isActivityCraftPlaying')) {
        if (inputKey === manager.settings.keys.action._back) {
            loseActivity();
            return;
        }
        else {
            playActivityCraft({ activityId, symbol: inputKey });
            return;
        }
    }
};

//#region SELECT
export const startActivityCraft = ({ activityId, managerEntityId }: {
    activityId: string,
    managerEntityId?: string | null,
}) => {
    startActivity({ activityId });

    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: startActivityCraft.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    manager._selectedCraftRecipe = 0;

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityCraftData = activityResource.activityData;
    if (!(activityCraftData && checkActivityCraftData(activityCraftData))) {
        throw error({ message: 'Activity Craft data is invalid', where: startActivityCraft.name });
    }

    activityCraftData._nbErrors = 0;
    activityCraftData._hitCount = 0;

    setState('isActivityCraftRunning', true);
    setState('isActivityCraftSelecting', true);

    event({ type: EventTypes.ACTIVITY_CRAFT_START });
    event({ type: EventTypes.ACTIVITY_CRAFT_SELECT_START });
    event({ data: { audioName: 'activity_craft_start' }, type: EventTypes.AUDIO_PLAY });
};

export const selectActivityCraftRecipe = ({ offset, activityId, managerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
    offset: 1 | -1,
}) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: selectActivityCraftRecipe.name });

    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: selectActivityCraftRecipe.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityCraftData = activityResource.activityData;
    if (!(activityCraftData && checkActivityCraftData(activityCraftData))) {
        throw error({ message: 'Activity Craft data is invalid', where: selectActivityCraftRecipe.name });
    }

    if (offset === -1) {
        if (manager._selectedCraftRecipe === 0) {
            manager._selectedCraftRecipe = manager.itemRecipes.length - 1;
        }
        else {
            manager._selectedCraftRecipe = Math.max(0, manager._selectedCraftRecipe - 1);
        }
    }
    else if (offset === 1) {
        if (manager._selectedCraftRecipe === manager.itemRecipes.length - 1) {
            manager._selectedCraftRecipe = 0;
        }
        else {
            manager._selectedCraftRecipe = Math.min(
                manager.itemRecipes.length - 1,
                manager._selectedCraftRecipe + 1,
            );
        }
    }

    event({ type: EventTypes.ACTIVITY_CRAFT_SELECT_UPDATE });
    event({ data: { audioName: 'main_select' }, type: EventTypes.AUDIO_PLAY });
};

export const confirmActivityCraftRecipe = ({ activityId, managerEntityId, playerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
    playerEntityId?: string | null,
}) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: confirmActivityCraftRecipe.name });

    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: confirmActivityCraftRecipe.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityCraftData = activityResource.activityData;
    if (!(activityCraftData && checkActivityCraftData(activityCraftData))) {
        throw error({ message: 'Activity Craft data is invalid', where: confirmActivityCraftRecipe.name });
    }

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: confirmActivityCraftRecipe.name });

    const recipeTool = itemIsTool({ itemName: itemRecipes[manager._selectedCraftRecipe].name });
    if (recipeTool) {
        const playerHasTool = playerHasSameActivityTool({
            activity: itemRecipes[manager._selectedCraftRecipe].tool as ResourceTypes,
            playerEntityId: playerEntityId,
        });

        if (playerHasTool) {
            event({ data: { message: 'Je ne peux pas en avoir plus' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({
                message: `Player cannot craft more ${itemRecipes[manager._selectedCraftRecipe].name}`,
                where: confirmActivityCraftRecipe.name,
            });
        }

        if (playerInventoryToolFull({ playerEntityId })) {
            event({ data: { message: 'Mon sac est plein' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({
                message: 'Player inventory full',
                where: confirmActivityCraftRecipe.name,
            });
        }
    }

    if (!(canPlay({ entityId: playerEntityId, strict: false }))) {
        event({ data: { message: 'Je suis trop fatigué pour ça' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Not enough energy to craft ${itemRecipes[manager._selectedCraftRecipe].name}`,
            where: confirmActivityCraftRecipe.name,
        });
    }

    if (!(checkInventory({
        entityId: playerEntityId,
        items: itemRecipes[manager._selectedCraftRecipe].ingredients,
    }))) {
        event({ data: { message: 'Je n\'ai pas ce qu\'il faut pour ça' }, type: EventTypes.MAIN_ERROR });
        event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

        throw error({
            message: `Could not find all ingredients for ${itemRecipes[manager._selectedCraftRecipe].name}`,
            where: confirmActivityCraftRecipe.name,
        });
    }

    const recipeItem = {
        info: { _name: itemRecipes[manager._selectedCraftRecipe].name },
        sprite: { _image: `item_${itemRecipes[manager._selectedCraftRecipe].name.toLowerCase()}` },
    };

    if (!(recipeTool)) {
        if (playerInventoryFull({ item: recipeItem })) {
            event({ data: { message: 'Mon sac est plein' }, type: EventTypes.MAIN_ERROR });
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            throw error({
                message: `Player will not be able to get ${itemRecipes[manager._selectedCraftRecipe].name}`,
                where: confirmActivityCraftRecipe.name,
            });
        }
    }

    activityResource.item = recipeItem;

    setState('isActivityCraftSelecting', false);
    setState('isActivityCraftPlaying', true);

    event({ type: EventTypes.ACTIVITY_CRAFT_SELECT_END });
    event({ type: EventTypes.ACTIVITY_CRAFT_PLAY_START });
    event({ data: { audioName: 'main_confirm' }, type: EventTypes.AUDIO_PLAY });
};
//#endregion

//#region PLAY
export const playActivityCraft = ({ symbol, activityId, managerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
    symbol: string,
}) => {
    if (!managerEntityId) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: playActivityCraft.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (symbol !== manager.settings.keys.action._act) return;

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: playActivityCraft.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityCraftData = activityResource.activityData;
    if (!(activityCraftData && checkActivityCraftData(activityCraftData))) {
        throw error({ message: 'Activity Craft data is invalid', where: playActivityCraft.name });
    }

    if (activityCraftData._hitCount === undefined) {
        throw error({ message: 'Activity Craft hit count is invalid', where: playActivityCraft.name });
    }

    activityCraftData._hitCount++;

    if (activityCraftData._hitCount >= 10) {
        endActivityCraft({ activityId });
        winActivity({ activityId });

        event({ data: { audioName: 'activity_craft_win' }, type: EventTypes.AUDIO_PLAY });

        return;
    }

    event({ type: EventTypes.ACTIVITY_CRAFT_PLAY_UPDATE });
    event({ data: { audioName: `activity_craft_play${randAudio({ nb: 6 })}` }, type: EventTypes.AUDIO_PLAY });
};

export const endActivityCraft = ({ activityId, playerEntityId }: {
    activityId?: string | null,
    playerEntityId?: string | null,
}) => {
    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endActivityCraft.name });

    if (getState('isActivityCraftSelecting')) {
        setState('isActivityCraftSelecting', false);

        event({ type: EventTypes.ACTIVITY_CRAFT_SELECT_END });
        event({ data: { audioName: 'activity_craft_end' }, type: EventTypes.AUDIO_PLAY });

        endActivity({ activityId });
        clearStore('activityId');

        return;
    }
    else if (getState('isActivityCraftPlaying')) {
        if (!(playerEntityId)) playerEntityId = getStore('playerId')
            ?? error({ message: 'Store playerId is undefined', where: endActivityCraft.name });

        canPlay({ entityId: playerEntityId, strict: true });

        removeCraftIngredients({ activityId });

        setState('isActivityCraftPlaying', false);

        event({ type: EventTypes.ACTIVITY_CRAFT_PLAY_END });
    }

    setState('isActivityCraftRunning', false);

    event({ type: EventTypes.ACTIVITY_CRAFT_END });
};

const removeCraftIngredients = ({ activityId, managerEntityId, playerEntityId }: {
    activityId?: string | null,
    managerEntityId?: string | null,
    playerEntityId?: string | null,
}) => {
    if (!managerEntityId) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: removeCraftIngredients.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (!(activityId)) activityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: playActivityCraft.name });

    const activityResource = getComponent({ componentId: 'Resource', entityId: activityId });
    const activityCraftData = activityResource.activityData;
    if (!(activityCraftData && checkActivityCraftData(activityCraftData))) {
        throw error({ message: 'Activity Craft data is invalid', where: removeCraftIngredients.name });
    }

    if (manager._selectedCraftRecipe === undefined) {
        throw error({ message: 'Activity Craft recipe index is invalid', where: removeCraftIngredients.name });
    }

    if (!(playerEntityId)) playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: removeCraftIngredients.name });

    for (const ingredient of itemRecipes[manager._selectedCraftRecipe].ingredients) {
        const itemAmountRemoved = removeItemFromInventory({
            entityId: playerEntityId,
            itemAmount: ingredient.amount,
            itemName: ingredient.name,
        });

        if (!(itemAmountRemoved)) {
            event({ data: { audioName: 'main_fail' }, type: EventTypes.AUDIO_PLAY });

            error({
                message: `Could not remove ${ingredient.amount} ${ingredient.name} from inventory`,
                where: removeCraftIngredients.name,
            });
        }
    }
};
//#endregion
