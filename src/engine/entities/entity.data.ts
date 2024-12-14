import { error } from '@/engine/services/error';

const entityFiles: Record<string, { default: EntityData[] }>
    = import.meta.glob('/src/assets/entities/*.json', { eager: true });

//#region TYPES
export type EntityData = {
    collider?: { x: number, y: number }[],
    cooldown?: number,
    data?: any,
    height?: number,
    name?: string,
    trigger?: { x: number, y: number }[],
    type: string,
    width?: number,
};
//#endregion

//#region DATA
export const loadEntityData = ({ entityType, entityName }: {
    entityName: string,
    entityType: string
}) => {
    const entityTypePath
        = `/src/assets/entities/${entityType.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}.json`;
    const entityTypeData = entityFiles[entityTypePath].default
        ?? error({
            message: `EntityData for ${entityType} not found`,
            where: loadEntityData.name,
        });

    const entityData = entityTypeData.find((e) => e.name === entityName)
        ?? error({
            message: `EntityData for ${entityType} ${entityName} not found`,
            where: loadEntityData.name,
        });

    return entityData as EntityData;
};
//#endregion
