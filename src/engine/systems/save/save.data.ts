//#region TYPES
export type SaveData = {
    entities: Record<string, SerializedEntity>;
    store: Record<string, string>;
    timestamp: number;
    version: string;
}

type SerializedEntity = {
    components: Record<string, unknown>;
    entityName: string;
};
//#endregion

//#region DATA
//#endregion
