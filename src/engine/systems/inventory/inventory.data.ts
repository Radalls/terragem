import itemRules from '../../../assets/items/item_rules.json';

import { ResourceTypes } from '@/engine/components/resource';

//#region TYPES
export type ItemRule = {
    active?: boolean,
    energy?: number,
    maxAmount: number,
    name: string,
    place?: boolean,
    resource: ResourceTypes,
    tool?: string,
};
//#endregion

//#region DATA
export const findItemRule = ({ itemName }: {
    itemName: string,
}) => itemRules.find((rule) => rule.name === itemName) as ItemRule;

export const itemIsTool = ({ itemName }: { itemName: string }) => !!(findItemRule({ itemName })?.tool);

export const itemIsEnergy = ({ itemName }: { itemName: string }) => !!(findItemRule({ itemName })?.energy);

export const itemIsPlace = ({ itemName }: { itemName: string }) => !!(findItemRule({ itemName })?.place);
//#endregion
