import { getComponent, loadEntityData } from '@/engine/entities';
import { error } from '@/engine/services/error';

//#region DATA
export const getResourceData = ({ resourceEntityId }: { resourceEntityId: string }) => {
    const resource = getComponent({ componentId: 'Resource', entityId: resourceEntityId });
    const itemName = resource.item?.info._name;
    if (!(itemName)) throw error({
        message: `Resource ${resourceEntityId} does not have an item`,
        where: getResourceData.name,
    });

    const entityData = loadEntityData({ entityName: itemName, entityType: resource._type })
        ?? error({
            message: `EntityData for ${resource._type} ${itemName} not found`,
            where: getResourceData.name,
        });

    return entityData;
};
//#endregion
