import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';

//#region CONSTANTS
const audioFiles: Record<string, { default: string }>
    = import.meta.glob('../../../src/assets/audio/**/*.mp3', { eager: true });

const audios: HTMLAudioElement[] = [];
//#endregion

//#region TYPES
export type AudioData = {
    audioName: string,
    loop?: boolean,
    volume?: number,
};
//#endregion

//#region HELPERS
export const getAudioPath = ({ audioName }: { audioName: string }) => {
    const audioKey = audioName.replace(/^(.*?)(\/[^/]+)?(\.[^./]+)?$/, '$1').split('_')[0];
    const audioPath = `../../assets/audio/${audioKey}/${audioName}.mp3`;

    return audioFiles[audioPath].default
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
    const existingAudio = audios.find(audio => audio.src === getAudioPath({ audioName }));
    if (existingAudio) return;

    const audio = new Audio(getAudioPath({ audioName }));

    audios.push(audio);
};

export const destroyAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.find(audio => audio.src === audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: destroyAudio.name });

    audio.pause();

    audios.splice(audios.indexOf(audio), 1);
};

export const playAudio = ({ audioName, loop = false, volume = 1 }: {
    audioName: string,
    loop?: boolean,
    volume?: number
}) => {
    const admin = getAdmin();

    const audio = audios.find(audio => audio.src.includes(audioName))
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    if (audio.loop && audio.currentTime > 0) return;

    audio.currentTime = 0;
    audio.loop = loop;
    audio.volume = volume * admin.settings._audioVolume;

    audio.play();
};

export const pauseAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.find(audio => audio.src.includes(audioName))
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    audio.pause();
};

export const stopAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.find(audio => audio.src.includes(audioName))
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    audio.pause();
    audio.currentTime = 0;
};

export const setVolumeAudio = ({ audioName, volume }: { audioName?: string, volume: number }) => {
    if (audioName) {
        const audio = audios.find(audio => audio.src.includes(audioName))
            ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

        audio.volume = volume;
    }
    else {
        const audioLoops = audios.filter(audio => audio.loop);

        audioLoops.forEach(audio => audio.volume = volume);
    }
};
//#endregion
