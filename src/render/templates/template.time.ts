import { createElement } from './template';
import { getElement } from './template.utils';

import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import { DayTimes } from '@/engine/systems/manager';

//#region TEMPLATES
export const createDayTime = () => {
    createElement({
        elementClass: 'daytime',
        elementId: 'DayTime',
        elementParent: getElement({ elementId: 'UI' }),
    });

    updateDayTime();
};

export const displayDayTime = () => {
    const dayTime = getElement({ elementId: 'DayTime' });

    dayTime.style.display = (dayTime.style.display === 'block') ? 'none' : 'block';
};

export const updateDayTime = () => {
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: updateDayTime.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const dayTimeElement = getElement({ elementId: 'DayTime' });

    switch (manager._dayTime) {
        case DayTimes.DAWN:
            dayTimeElement.style.backgroundColor = 'rgba(242, 103, 182, 0.4)';
            break;
        case DayTimes.MORNING:
            dayTimeElement.style.backgroundColor = 'rgba(242, 113, 103, 0.4)';
            break;
        case DayTimes.NOON:
            dayTimeElement.style.backgroundColor = 'transparent';
            break;
        case DayTimes.AFTERNOON:
            dayTimeElement.style.backgroundColor = 'rgba(186, 70, 43, 0.4)';
            break;
        case DayTimes.EVENING:
            dayTimeElement.style.backgroundColor = 'rgba(139, 40, 20, 0.6)';
            break;
        case DayTimes.DUSK:
            dayTimeElement.style.backgroundColor = 'rgba(75, 0, 56, 0.6)';
            break;
        case DayTimes.NIGHT:
            dayTimeElement.style.backgroundColor = 'rgba(21, 0, 75, 0.6)';
            break;
        default:
            dayTimeElement.style.backgroundColor = 'transparent';
    }
};
//#endregion
