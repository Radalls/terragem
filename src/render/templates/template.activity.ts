import itemRecipes from '../../assets/items/item_recipes.json';

import { createProgress, updateProgress } from './components/progress/progress';
import { createElement, destroyElement } from './template';
import { getElement, checkElement, getSpritePath, searchElementsByClassName } from './template.utils';

import {
    ActivityBugData,
    ActivityCraftData,
    ActivityFishData,
    ResourceTypes,
} from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { checkInventory } from '@/engine/systems/inventory';

//#region CONSTANTS
//#endregion

//#region HELPERS
const checkActivityBugData = (data: any): data is ActivityBugData => data;
const checkActivityFishData = (data: any): data is ActivityFishData => data;
const checkActivityCraftData = (data: any): data is ActivityCraftData => data;
//#endregion

//#region TEMPLATES
//#region MAIN ACTIVITY
export const startActivity = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startActivity.name });

    const activity = createElement({
        elementClass: 'activity',
        elementId: `${activityEntityId}-activity`,
        elementParent: getElement({ elementId: 'UI' }),
        entityId: activityEntityId,
    });

    const activityCancel = createElement({
        elementClass: 'activity-cancel',
        elementId: `${activityEntityId}-activity-cancel`,
        elementParent: activity,
        entityId: activityEntityId,
    });
    activityCancel.innerText = '❌';
};

export const winActivity = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: winActivity.name });

    const resource = getComponent({ componentId: 'Resource', entityId: activityEntityId });

    const activity = getElement({ elementId: `${activityEntityId}-activity` });
    activity.style.visibility = 'hidden';

    const activityWin = createElement({
        elementClass: 'activity-win',
        elementId: `${activityEntityId}-activity-win`,
        elementParent: getElement({ elementId: 'UI' }),
        entityId: activityEntityId,
    });

    const activityWinMessage = createElement({
        elementAbsolute: false,
        elementClass: 'activity-win-message',
        elementId: `${activityEntityId}-activity-win-message`,
        elementParent: activityWin,
        entityId: activityEntityId,
    });
    activityWinMessage.innerText = (resource._type === ResourceTypes.CRAFT)
        ? 'J\'ai fabriqué un '
        : 'J\'ai attrapé un ';

    if (resource.item) {
        const activityWinItem = createElement({
            elementAbsolute: false,
            elementClass: 'activity-win-item',
            elementId: `${activityEntityId}-activity-win-item`,
            elementParent: activityWin,
            entityId: activityEntityId,
        });
        activityWinItem.style.backgroundImage
            = `url(${getSpritePath({ spriteName: resource.item.sprite._image })})`;
    }
};

export const loseActivity = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: loseActivity.name });

    const resource = getComponent({ componentId: 'Resource', entityId: activityEntityId });

    const activity = getElement({ elementId: `${activityEntityId}-activity` });
    activity.style.visibility = 'hidden';

    const activityLose = createElement({
        elementClass: 'activity-win',
        elementId: `${activityEntityId}-activity-win`,
        entityId: activityEntityId,
    });

    activityLose.innerText = (resource._type === ResourceTypes.CRAFT)
        ? 'J\'abandonne...'
        : 'Il s\'est enfui... ';
};

export const endActivity = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endActivity.name });

    destroyElement({ elementId: `${activityEntityId}-activity` });

    if (checkElement({ elementId: `${activityEntityId}-activity-cancel` })) {
        destroyElement({ elementId: `${activityEntityId}-activity-cancel` });
    }
    if (checkElement({ elementId: `${activityEntityId}-activity-win` })) {
        destroyElement({ elementId: `${activityEntityId}-activity-win` });
    }
};
//#endregion

//#region ACTIVITY BUG
export const startActivityBug = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startActivityBug.name });

    const activityElement = getElement({ elementId: `${activityEntityId}-activity` });

    const activityBug = createElement({
        elementClass: 'activity-bug',
        elementId: `${activityEntityId}-ActivityBug`,
        elementParent: activityElement,
        entityId: activityEntityId,
    });
    activityBug.style.backgroundColor = 'rgb(24, 142, 24)';

    createProgress({
        color: 'rgb(13, 193, 13)',
        elementId: 'BugHp',
        height: 15,
        left: 530,
        parent: activityBug,
        top: 200,
        value: 100,
        width: 300,
    });

    const activityBugHpLabel = createElement({
        elementClass: 'activity-bug-hp',
        elementId: `${activityEntityId}-ActivityBugHp`,
        elementParent: activityBug,
        entityId: activityEntityId,
    });
    activityBugHpLabel.innerText = '❤️';

    createProgress({
        color: 'rgb(237, 29, 29)',
        elementId: 'BugError',
        height: 15,
        left: 530,
        parent: activityBug,
        top: 400,
        value: 0,
        width: 300,
    });

    const activityBugErrorLabel = createElement({
        elementClass: 'activity-bug-error',
        elementId: `${activityEntityId}-ActivityBugError`,
        elementParent: activityBug,
        entityId: activityEntityId,
    });
    activityBugErrorLabel.innerText = '⚠️';

    createElement({
        elementClass: 'activity-bug-symbol-value',
        elementId: `${activityEntityId}-ActivityBugSymbolValue`,
        elementParent: activityBug,
        entityId: activityEntityId,
    });

    createElement({
        elementClass: 'activity-bug-symbol-found',
        elementId: `${activityEntityId}-ActivityBugSymbolFound`,
        elementParent: activityBug,
        entityId: activityEntityId,
    });

    updateActivityBug();
};

export const updateActivityBug = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: updateActivityBug.name });

    const resource = getComponent({ componentId: 'Resource', entityId: activityEntityId });
    if (!(checkActivityBugData(resource.activityData))) {
        throw error({
            message: 'Activity bug data is not defined',
            where: updateActivityBug.name,
        });
    }
    const activityBugData = resource.activityData;

    updateProgress({
        elementId: 'BugHp',
        value: (activityBugData._hp / activityBugData._maxHp) * 100,
    });

    updateProgress({
        elementId: 'BugError',
        value: (activityBugData._nbErrors / activityBugData._maxNbErrors) * 100,
    });

    const activityBugSymbolValue = getElement({ elementId: `${activityEntityId}-ActivityBugSymbolValue` });
    activityBugSymbolValue.innerText = `${getActivityBugSymbol({ symbol: activityBugData._symbol }) ?? '...'}`;

    const activityBugSymbolFound = getElement({ elementId: `${activityEntityId}-ActivityBugSymbolFound` });
    if (activityBugData._symbolFound === undefined) {
        activityBugSymbolFound.style.backgroundImage
            = `url(${getSpritePath({ spriteName: 'activity_bug_symbol_blank' })})`;
    }
    else if (activityBugData._symbolFound === true) {
        activityBugSymbolFound.style.backgroundImage
            = `url(${getSpritePath({ spriteName: 'activity_bug_symbol_found' })})`;
    }
    else if (activityBugData._symbolFound === false) {
        activityBugSymbolFound.style.backgroundImage
            = `url(${getSpritePath({ spriteName: 'activity_bug_symbol_error' })})`;
    }
};

export const endActivityBug = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endActivityBug.name });

    destroyElement({ elementId: `${activityEntityId}-ActivityBug` });
};

const getActivityBugSymbol = ({ symbol }: { symbol?: string }) => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: getActivityBugSymbol.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    if (symbol === manager.settings.keys.move._up) {
        return '🡅';
    }
    else if (symbol === manager.settings.keys.move._down) {
        return '🡇';
    }
    else if (symbol === manager.settings.keys.move._left) {
        return '🡄';
    }
    else if (symbol === manager.settings.keys.move._right) {
        return '🡆';
    }

    return symbol;
};
//#endregion

//#region ACTIVITY FISH
export const startActivityFish = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startActivityFish.name });

    const activity = getElement({ elementId: `${activityEntityId}-activity` });

    const activityFish = createElement({
        elementClass: 'activity-fish',
        elementId: `${activityEntityId}-ActivityFish`,
        elementParent: activity,
        entityId: activityEntityId,
    });
    activityFish.style.backgroundImage
        = `url(${getSpritePath({ gif: true, spriteName: 'activity_fish_bg' })})`;

    createProgress({
        color: 'rgb(13, 193, 13)',
        elementId: 'FishHp',
        height: 15,
        left: 720,
        parent: activityFish,
        top: 430,
        value: 100,
        width: 200,
    });

    const activityFishHpLabel = createElement({
        elementClass: 'activity-fish-hp',
        elementId: `${activityEntityId}-ActivityFishHp`,
        elementParent: activityFish,
        entityId: activityEntityId,
    });
    activityFishHpLabel.innerText = '❤️';

    createProgress({
        color: 'rgb(237, 29, 29)',
        elementId: 'RodTension',
        height: 250,
        left: 270,
        parent: activityFish,
        top: 150,
        value: 0,
        width: 15,
    });

    const activityFishRodTensionLabel = createElement({
        elementClass: 'activity-fish-rod-tension',
        elementId: `${activityEntityId}-ActivityFishRodTension`,
        elementParent: activityFish,
        entityId: activityEntityId,
    });
    activityFishRodTensionLabel.innerText = '⚠️';

    createElement({
        elementClass: 'activity-fish-frenzy',
        elementId: `${activityEntityId}-ActivityFishFrenzy`,
        elementParent: activityFish,
        entityId: activityEntityId,
    });

    const activityFishKey = createElement({
        elementClass: 'activity-fish-key',
        elementId: `${activityEntityId}-ActivityFishKey`,
        elementParent: activityFish,
        entityId: activityEntityId,
    });
    activityFishKey.innerText = '🖐';

    updateActivityFish();
};

export const updateActivityFish = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: updateActivityFish.name });

    const resource = getComponent({ componentId: 'Resource', entityId: activityEntityId });
    if (!(checkActivityFishData(resource.activityData))) {
        throw error({
            message: 'Activity fish data is undefined',
            where: updateActivityFish.name,
        });
    }
    const activityFishData = resource.activityData;

    updateProgress({ elementId: 'FishHp', value: activityFishData._hp * 100 / activityFishData._maxHp });

    updateProgress({
        elementId: 'RodTension',
        value: activityFishData._rodTension * 100 / activityFishData._rodMaxTension,
    });

    const activityFishFrenzyValue = getElement({ elementId: `${activityEntityId}-ActivityFishFrenzy` });
    activityFishFrenzyValue.style.backgroundImage = (activityFishData._isFrenzy)
        ? `url(${getSpritePath({ spriteName: 'activity_fish_frenzy_on' })})`
        : `url(${getSpritePath({ spriteName: 'activity_fish_frenzy_off' })})`;
};

export const endActivityFish = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endActivityFish.name });

    destroyElement({ elementId: `${activityEntityId}-ActivityFish` });
};
//#endregion

//#region ACTIVITY CRAFT
export const startActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startActivityCraft.name });

    const activity = getElement({ elementId: `${activityEntityId}-activity` });

    createElement({
        elementAbsolute: false,
        elementClass: 'activity-craft',
        elementId: `${activityEntityId}-ActivityCraft`,
        elementParent: activity,
        entityId: activityEntityId,
    });
};

export const startSelectActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startSelectActivityCraft.name });

    const activityElement = getElement({ elementId: `${activityEntityId}-ActivityCraft` });

    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: startSelectActivityCraft.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const recipesElement = createElement({
        elementAbsolute: false,
        elementClass: 'activity-craft-recipes',
        elementId: `${activityEntityId}-ActivityCraftRecipes`,
        elementParent: activityElement,
        entityId: activityEntityId,
    });

    if (!(manager.itemRecipes.length)) return;

    for (const recipeName of manager.itemRecipes) {
        const itemRecipe = itemRecipes.find((itemRecipe) => itemRecipe.name === recipeName)
            ?? error({ message: 'Item recipe not found', where: startSelectActivityCraft.name });

        const recipeElement = createElement({
            elementAbsolute: false,
            elementClass: 'activity-craft-recipe',
            elementId: `${activityEntityId}-ActivityCraftRecipe-${itemRecipe.name}`,
            elementParent: recipesElement,
            entityId: activityEntityId,
        });

        const recipeItem = createElement({
            elementAbsolute: false,
            elementClass: 'activity-craft-recipe-item',
            elementId: `${activityEntityId}-ActivityCraftRecipe-${itemRecipe.name}-Item`,
            elementParent: recipeElement,
            entityId: activityEntityId,
        });

        const recipeItemIcon = createElement({
            elementAbsolute: false,
            elementClass: 'activity-craft-recipe-item-icon',
            elementId: `${activityEntityId}-ActivityCraftRecipe-${itemRecipe.name}-ItemIcon`,
            elementParent: recipeItem,
            entityId: activityEntityId,
        });
        recipeItemIcon.style.backgroundImage
            = `url(${getSpritePath({ spriteName: `item_${itemRecipe.name.toLowerCase()}` })})`;

        const recipeIngredients = createElement({
            elementAbsolute: false,
            elementClass: 'activity-craft-recipe-ingredients',
            elementId: `${activityEntityId}-ActivityCraftRecipe-${itemRecipe.name}-Ingredients`,
            elementParent: recipeElement,
            entityId: activityEntityId,
        });

        for (const ingredient of itemRecipe.ingredients) {
            const recipeIngredient = createElement({
                elementAbsolute: false,
                elementClass: 'activity-craft-recipe-ingredient',
                elementId: `${activityEntityId}-ActivityCraftRecipe-${itemRecipe.name}-Ingredient-${ingredient.name}`,
                elementParent: recipeIngredients,
                entityId: activityEntityId,
            });

            const recipeIngredientIcon = createElement({
                elementAbsolute: false,
                elementClass: 'activity-craft-recipe-ingredient-icon',
                elementId: `${activityEntityId}-ActivityCraftRecipe-
                    ${itemRecipe.name}-Ingredient-${ingredient.name}-Icon`,
                elementParent: recipeIngredient,
                entityId: activityEntityId,
            });
            recipeIngredientIcon.style.backgroundImage
                = `url(${getSpritePath({ spriteName: `item_${ingredient.name.toLowerCase()}` })})`;

            const recipeIngredientCheck = createElement({
                elementClass: 'activity-craft-recipe-ingredient-check',
                elementId: `${activityEntityId}-ActivityCraftRecipe-
                    ${itemRecipe.name}-Ingredient-${ingredient.name}-Check`,
                elementParent: recipeIngredientIcon,
                entityId: activityEntityId,
            });
            recipeIngredientCheck.innerText = (checkInventory({
                items: [{
                    amount: ingredient.amount,
                    name: ingredient.name,
                }],
            }))
                ? '✔️'
                : '';

            const activityCraftRecipeIngredientAmount = createElement({
                elementAbsolute: false,
                elementClass: 'activity-craft-recipe-ingredient-amount',
                elementId: `${activityEntityId}-ActivityCraftRecipe-
                    ${itemRecipe.name}-Ingredient-${ingredient.name}-Amount`,
                elementParent: recipeIngredient,
                entityId: activityEntityId,
            });
            activityCraftRecipeIngredientAmount.innerText = `x${ingredient.amount}`;
        }
    }

    updateSelectActivityCraft();
};

export const updateSelectActivityCraft = () => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: updateSelectActivityCraft.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const activityCraftRecipes = searchElementsByClassName({ className: 'activity-craft-recipe' });
    for (const recipe of activityCraftRecipes) {
        recipe.style.border = 'solid 4px rgb(91, 48, 38)';
    }

    activityCraftRecipes[manager._selectedCraftRecipe].style.border = 'solid 4px rgb(255, 241, 216)';
};

export const endSelectActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endSelectActivityCraft.name });

    destroyElement({ elementId: `${activityEntityId}-ActivityCraftRecipes` });
};

export const startPlayActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: startPlayActivityCraft.name });

    const activityCraft = getElement({ elementId: `${activityEntityId}-ActivityCraft` });

    const activityCraftPlay = createElement({
        elementClass: 'activity-craft-play',
        elementId: `${activityEntityId}-ActivityCraftPlay`,
        elementParent: activityCraft,
        entityId: activityEntityId,
    });

    createProgress({
        color: 'rgb(13, 193, 13)',
        elementId: 'CraftProgress',
        height: 15,
        left: 486,
        parent: activityCraftPlay,
        top: 309,
        value: 0,
        width: 300,
    });

    const activityFishHpLabel = createElement({
        elementClass: 'activity-craft-progress',
        elementId: `${activityEntityId}-ActivityCraftProgress`,
        elementParent: activityCraftPlay,
        entityId: activityEntityId,
    });
    activityFishHpLabel.innerText = '⚒️';

    const activityCraftKey = createElement({
        elementClass: 'activity-craft-key',
        elementId: `${activityEntityId}-ActivityCraftKey`,
        elementParent: activityCraftPlay,
        entityId: activityEntityId,
    });
    activityCraftKey.innerText = '🖐';

    updatePlayActivityCraft();
};

export const updatePlayActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: updatePlayActivityCraft.name });

    const resource = getComponent({ componentId: 'Resource', entityId: activityEntityId });
    if (!(checkActivityCraftData(resource.activityData))) {
        throw error({
            message: 'Activity craft data is undefined',
            where: updatePlayActivityCraft.name,
        });
    }
    const activityCraftData = resource.activityData;

    updateProgress({ elementId: 'CraftProgress', value: (activityCraftData._hitCount ?? 0) * 10 });
};

export const endPlayActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endPlayActivityCraft.name });

    destroyElement({ elementId: `${activityEntityId}-ActivityCraftPlay` });
};

export const endActivityCraft = () => {
    const activityEntityId = getStore('activityId')
        ?? error({ message: 'Store activityId is undefined', where: endActivityCraft.name });

    destroyElement({ elementId: `${activityEntityId}-ActivityCraft` });
};
//#endregion
//#endregion
