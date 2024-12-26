const state = {
    gameLaunch: false,
    gameLoad: false,
    gamePause: false,
    gamePlay: false,
    requestGemCarryStart: false,
    requestGemCarryTarget: false,
    requestGemLift: false,
    requestGemMove: false,
    requestTile: false,
};

export const setState = ({ key, value }: { key: keyof typeof state, value: boolean }) => state[key] = value;
export const getState = ({ key }: { key: keyof typeof state }) => state[key];
