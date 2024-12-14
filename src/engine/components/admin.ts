export type Admin = {
    _: 'Admin';
    gems: string[];
    items: Item[];
    requests: string[];
};

export type Item = {
    _amount: number;
    _type: ItemTypes;
};

export enum ItemTypes {
    COPPER = 'COPPER',
    IRON = 'IRON',
    LUMYN = 'LUMYN',
    ROCK = 'ROCK',
}
