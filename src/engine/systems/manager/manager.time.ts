import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { EventTypes } from '@/engine/services/event';
import { getStore } from '@/engine/services/store';
import { event } from '@/render/events';

//#region TYPES
export enum DayTimes {
    AFTERNOON = 3,
    DAWN = 0,
    DUSK = 5,
    EVENING = 4,
    MORNING = 1,
    NIGHT = 6,
    NOON = 2,
}
//#endregion

//#region SYSTEMS
export const setDayTime = ({ managerEntityId }: { managerEntityId?: string | null }) => {
    if (!(managerEntityId)) managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: setDayTime.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    manager._dayTime = (manager._dayTime + 1) % Object.keys(DayTimes).length;

    event({ type: EventTypes.TIME_DAY_UPDATE });
};
//#endregion
