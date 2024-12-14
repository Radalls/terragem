import { updateActivityBug, updateActivityFish } from './activity';

import { ResourceTypes } from '@/engine/components/resource';
import { getComponent } from '@/engine/entities';
import { setCooldown } from '@/engine/services/cycle';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';
import {
    addItemToInventory,
    itemIsTool,
    playerInventoryFull,
    playerInventoryToolFull,
} from '@/engine/systems/inventory';
import { updateSprite } from '@/engine/systems/sprite';
import { setEntityCooldown } from '@/engine/systems/state';

//#region HELPERS
const rollResourceItem = ({ resourceEntityId }: { resourceEntityId: string }) => {
    const resource = getComponent({ componentId: 'Resource', entityId: resourceEntityId });
    if (!(resource.items)) throw error({
        message: 'Resource component does not have items',
        where: generateResourceItem.name,
    });

    const totalRate = resource.items.reduce((acc, item) => acc + item._rate, 0);
    let roll = Math.random();

    if (roll > totalRate) {
        return null;
    }

    for (const item of resource.items) {
        if (roll < item._rate) {
            return item._name;
        }

        roll -= item._rate;
    }

    return null;
};
//#endregion

//#region UTILS
export const generateResourceItem = ({ resourceEntityId, init = false }: {
    init?: boolean,
    resourceEntityId: string,
}) => {
    const resource = getComponent({ componentId: 'Resource', entityId: resourceEntityId });

    let itemName = rollResourceItem({ resourceEntityId });
    if (init) {
        while (!(itemName)) itemName = rollResourceItem({ resourceEntityId });
    }
    else if (!(itemName)) {
        setEntityCooldown({ entityId: resourceEntityId, value: true });
        setCooldown({ entityId: resourceEntityId, value: 1 }); //TODO: remove hardcoded value
        return;
    }

    resource.item = {
        info: { _name: itemName },
        sprite: { _image: `item_${itemName.toLowerCase()}` },
    };

    if (!(init)) {
        if (resource._type === ResourceTypes.ITEM) {
            updateSprite({ entityId: resourceEntityId, path: `resource_${itemName.toLowerCase()}` });
        }
        else if (resource._type === ResourceTypes.BUG) {
            updateActivityBug({ activityId: resourceEntityId });
        }
        else if (resource._type === ResourceTypes.FISH) {
            updateActivityFish({ activityId: resourceEntityId });
        }
    }
};

export const getResourceItem = ({ entityId, resourceEntityId }: {
    entityId?: string | null,
    resourceEntityId: string,
}) => {
    if (!(entityId)) entityId = getStore('playerId')
        ?? error({ message: 'Store playedId is undefined', where: getResourceItem.name });

    const resource = getComponent({ componentId: 'Resource', entityId: resourceEntityId });

    if (!(resource.item)) {
        throw error({ message: `Resource ${resourceEntityId} does not have an item`, where: getResourceItem.name });
    }

    if (itemIsTool({ itemName: resource.item.info._name })) {
        if (playerInventoryToolFull({ playerEntityId: entityId })) {
            return false;
        }
    }
    else if (playerInventoryFull({ item: resource.item })) {
        return false;
    }

    addItemToInventory({
        entityId,
        item: resource.item,
        itemAmount: 1,
    });

    return true;
};
//#endregion
