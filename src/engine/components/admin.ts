export type Admin = {
    _: 'Admin';
    gems: string[];
    items: Item[];
    recipes: string[];
    requests: string[];
};

export type Item = {
    _amount: number;
    _type: ItemTypes;
};

export enum ItemTypes {
    COPPER = 'COPPER',
    GEM_CARRY = 'GEM_CARRY',
    GEM_MINE = 'GEM_MINE',
    IRON = 'IRON',
    LUMYN = 'LUMYN',
    STONE = 'STONE',
}
