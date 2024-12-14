import { checkEntityId } from '@/engine/entities';

const store = {
    activityId: '',
    dialogId: '',
    managerId: '',
    playerId: '',
    tileMapId: '',
};

export const setStore = (key: keyof typeof store, value: string) => store[key] = value;
export const getStore = (key: keyof typeof store) => checkEntityId({ entityId: store[key] }) && store[key];
export const clearStore = (key: keyof typeof store) => store[key] = '';
export const resetStore = () => {
    store.activityId = '';
    store.dialogId = '';
    store.playerId = '';
    store.tileMapId = '';
};
