import { error } from '@/engine/services/error';
import { checkEntityId } from '@/engine/systems/entity';

//#region TYPES
type Store = {
    adminId: string | null;
    requestId: string | null;
    tileMapId: string | null;
};

const store: Store = {
    adminId: null,
    requestId: null,
    tileMapId: null,
};

export const setStore = ({ key, value }: { key: keyof typeof store, value: string }) => store[key] = value;

export const getStore = ({ key }: {
    key: keyof typeof store,
}) => (store[key] && checkEntityId({ entityId: store[key] })) ?? error({
    message: `No ${key} in store`,
    where: 'getStore',
});

export const clearStore = ({ key }: { key: keyof typeof store }) => store[key] = null;

export const voidStore = () => {
    for (const key in store) store[key as keyof typeof store] = null;
};
