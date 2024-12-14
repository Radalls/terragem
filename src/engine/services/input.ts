//#region CONSTANTS
export const keyPress: Record<string, boolean> = {};
export const firstKeyPress: Record<string, boolean> = {};
//#endregion

//#region SERVICES
export const onKeyDown = (key: string) => {
    if (!(keyPress[key])) {
        firstKeyPress[key] = true;
    }

    keyPress[key] = true;
};

export const onKeyUp = (key: string) => {
    delete keyPress[key];
    delete firstKeyPress[key];
};

export const consumeFirstKeyPress = (key: string): boolean => {
    if (firstKeyPress[key]) {
        delete firstKeyPress[key];
        return true;
    }

    return false;
};
//#endregion
