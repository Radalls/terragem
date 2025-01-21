import { asset } from '@/engine/main';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';

//#region TYPES
export type AudioData = {
    audioName: string,
    loop?: boolean,
    volume?: number,
};
//#endregion

//#region CONSTANTS
const audios: Map<string, HTMLAudioElement> = new Map();
//#endregion

//#region HELPERS
export const getAudioPath = ({ audioName }: { audioName: string }) => {
    return asset.getAudioUrl(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: getAudioPath.name });
};

export const randAudio = ({ nb }: { nb: number }) => {
    return Math.floor(Math.random() * nb) + 1;
};
//#endregion

//#region SERVICES
export const initAudios = () => {
    /* BGM */
    createAudio({ audioName: 'bgm_game1' });
    createAudio({ audioName: 'bgm_menu1' });
    /* MAIN */
    createAudio({ audioName: 'main_confirm' });
    createAudio({ audioName: 'main_error' });
    createAudio({ audioName: 'main_select' });
    createAudio({ audioName: 'main_success' });
    createAudio({ audioName: 'main_warning' });
    /* MENU */
    createAudio({ audioName: 'main_action' });
    createAudio({ audioName: 'main_start' });
};

export const createAudio = ({ audioName }: { audioName: string }) => {
    if (audios.has(audioName)) return;

    const audio = new Audio(getAudioPath({ audioName }));

    audios.set(audioName, audio);
};

export const destroyAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: destroyAudio.name });

    audio.pause();
    audios.delete(audioName);
};

export const playAudio = ({ audioName, loop = false, volume = 1 }: AudioData) => {
    const admin = getAdmin();
    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    if (audio.loop && audio.currentTime > 0) return;

    audio.currentTime = 0;
    audio.loop = loop;
    audio.volume = volume * admin.settings._audioVolume;

    audio.play();
};

export const pauseAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: pauseAudio.name });

    audio.pause();
};

export const stopAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: stopAudio.name });

    audio.pause();
    audio.currentTime = 0;
};

export const setVolumeAudio = ({ audioName, volume }: { audioName?: string, volume: number }) => {
    if (audioName) {
        const audio = audios.get(audioName)
            ?? error({ message: `Audio ${audioName} not found`, where: setVolumeAudio.name });

        audio.volume = volume;
    } else {
        audios.forEach(audio => {
            if (audio.loop) audio.volume = volume;
        });
    }
};
//#endregion
