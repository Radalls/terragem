import { getComponent } from '@/engine/entities';
import { EventTypes } from '@/engine/services/event';
import { updateSpriteActive } from '@/engine/systems/sprite';
import { event } from '@/render/events';

//#region SYSTEMS
export const setEntityLoad = ({ entityId, value }: {
    entityId: string,
    value: boolean,
}) => {
    const state = getComponent({ componentId: 'State', entityId });

    state._load = value;

    if (state._load) {
        setTimeout(() => { event({ entityId, type: EventTypes.ENTITY_DISPLAY }); }, 1);
    }
    else {
        event({ entityId, type: EventTypes.ENTITY_DISPLAY });
    }
};

export const setEntityCooldown = ({ entityId, value }: {
    entityId: string,
    value: boolean,
}) => {
    const state = getComponent({ componentId: 'State', entityId });

    state._cooldown = value;

    event({ entityId, type: EventTypes.ENTITY_DISPLAY });
};

export const setEntityActive = ({ entityId, value, gif = false }: {
    entityId: string,
    gif?: boolean,
    value: boolean,
}) => {
    const state = getComponent({ componentId: 'State', entityId });
    state._active = value;

    updateSpriteActive({ active: value, entityId, gif });
};
//#endregion
