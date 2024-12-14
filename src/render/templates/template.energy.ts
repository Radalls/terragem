import { createElement, destroyElement } from './template';
import { getElement } from './template.utils';

import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region CONSTANTS
const ENERGY_SLOT_HEIGHT = 8;
const ENERGY_SLOT_WIDHT = 16;
//#endregion

//#region TEMPLATES
export const createEnergy = () => {
    const playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: createEnergy.name });

    const energy = getComponent({ componentId: 'Energy', entityId: playerEntityId });

    const energyElement = createElement({
        elementClass: 'energy',
        elementId: 'Energy',
        elementParent: getElement({ elementId: 'UI' }),
        entityId: playerEntityId,
    });

    const energyHeight = (ENERGY_SLOT_HEIGHT * energy._max) + (ENERGY_SLOT_HEIGHT * 2);
    energyElement.style.height = `${energyHeight}px`;
    const energyWidth = ENERGY_SLOT_WIDHT * 1.5;
    energyElement.style.width = `${energyWidth}px`;

    for (let i = 0; i < energy._max; i++) {
        createElement({
            elementAbsolute: false,
            elementClass: 'energy-slot',
            elementId: `EnergySlot-${i}`,
            elementParent: energyElement,
            entityId: playerEntityId,
        });
    }
};

export const displayEnergy = () => {
    const energy = getElement({ elementId: 'Energy' });

    energy.style.display = (energy.style.display === 'flex') ? 'none' : 'flex';
};

export const updateEnergy = () => {
    const playerEntityId = getStore('playerId')
        ?? error({ message: 'Store playerId is undefined', where: updateEnergy.name });

    const energy = getComponent({ componentId: 'Energy', entityId: playerEntityId });

    clearEnergy();

    const energyElement = getElement({ elementId: 'Energy' });

    for (let i = energyElement.children.length - 1; i >= energy._max - energy._current; i--) {
        const energySlotElement = getElement({ elementId: `EnergySlot-${i}` });
        energySlotElement.style.backgroundColor = 'rgb(231, 210, 75)';
    }
};

export const destroyEnergy = () => {
    destroyElement({ elementId: 'Energy' });
};

const clearEnergy = () => {
    const energyElement = getElement({ elementId: 'Energy' });

    for (let i = 0; i < energyElement.children.length; i++) {
        const energySlotElement = getElement({ elementId: `EnergySlot-${i}` });
        energySlotElement.style.backgroundColor = 'rgb(255, 241, 216)';
    }
};
//#endregion
