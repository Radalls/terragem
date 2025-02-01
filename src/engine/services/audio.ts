import { asset } from '@/engine/main';
import { error } from '@/engine/services/error';
import { getAdmin } from '@/engine/systems/entity';

//#region TYPES
export type AudioData = {
    audioName: string,
    list?: boolean,
    loop?: boolean,
    volume?: number,
};

type AudioCategory = {
    count: number,
    currentAudio?: string,
    prefix: string,
};
//#endregion

//#region CONSTANTS
const audios: Map<string, HTMLAudioElement> = new Map();
const audioCategories: Map<string, AudioCategory> = new Map([
    ['bgm_game', { count: 9, prefix: 'bgm_game' }],
    ['bgm_menu', { count: 1, prefix: 'bgm_menu' }],
]);
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
    createAudio({ audioName: 'bgm_game2' });
    createAudio({ audioName: 'bgm_game3' });
    createAudio({ audioName: 'bgm_game4' });
    createAudio({ audioName: 'bgm_game5' });
    createAudio({ audioName: 'bgm_game6' });
    createAudio({ audioName: 'bgm_game7' });
    createAudio({ audioName: 'bgm_game8' });
    createAudio({ audioName: 'bgm_game9' });
    createAudio({ audioName: 'bgm_menu1' });
    /* MAIN */
    createAudio({ audioName: 'main_confirm' });
    createAudio({ audioName: 'main_error' });
    createAudio({ audioName: 'main_select' });
    createAudio({ audioName: 'main_success' });
    createAudio({ audioName: 'main_warning' });
    createAudio({ audioName: 'main_action' });
    createAudio({ audioName: 'main_start' });
    createAudio({ audioName: 'main_stop' });
    createAudio({ audioName: 'main_unlock' });
};

export const createAudio = ({ audioName }: { audioName: string }) => {
    if (audios.has(audioName)) return;

    const audio = new Audio(getAudioPath({ audioName }));

    audio.addEventListener('ended', () => onAudioEnd({ audioName }));

    audios.set(audioName, audio);
};

export const destroyAudio = ({ audioName }: { audioName: string }) => {
    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: destroyAudio.name });

    audio.removeEventListener('ended', () => onAudioEnd({ audioName }));

    audio.pause();
    audios.delete(audioName);
};

export const playAudio = ({
    audioName,
    loop = false,
    volume = 1,
    list = false,
}: AudioData) => {
    const admin = getAdmin();

    audioName = (list)
        ? getAudioNext({ audioCategory: audioName })
        : audioName;

    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    if (audio.loop && audio.currentTime > 0) return;

    audio.currentTime = 0;
    audio.loop = loop && !(list);
    audio.volume = volume * admin.settings._audioVolume;

    audio.play();
};

export const pauseAudio = ({ audioName }: { audioName: string }) => {
    const category = audioCategories.get(audioName);
    audioName = (category)
        ? category.currentAudio ?? audioName
        : audioName;

    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: pauseAudio.name });

    audio.pause();
};

export const stopAudio = ({ audioName }: { audioName: string }) => {
    const category = audioCategories.get(audioName);
    audioName = (category)
        ? category.currentAudio ?? audioName
        : audioName;

    const audio = audios.get(audioName)
        ?? error({ message: `Audio ${audioName} not found`, where: stopAudio.name });

    audio.pause();
    audio.currentTime = 0;
};

export const setVolumeAudio = ({ audioName, volume }: { audioName?: string, volume: number }) => {
    if (audioName) {
        const category = audioCategories.get(audioName);
        audioName = (category)
            ? category.currentAudio ?? audioName
            : audioName;

        const audio = audios.get(audioName)
            ?? error({ message: `Audio ${audioName} not found`, where: setVolumeAudio.name });

        audio.volume = volume;
    } else {
        audios.forEach(audio => {
            if (audio.loop) audio.volume = volume;
        });
    }
};

const onAudioEnd = ({ audioName }: { audioName: string }) => {
    for (const [audioCategory] of audioCategories) {
        if (audioName.startsWith(audioCategory)) {
            const nextTrack = getAudioNext({ audioCategory: audioCategory });
            const currentAudio = audios.get(audioName);

            if (currentAudio) {
                playAudio({ audioName: nextTrack, volume: currentAudio.volume });
            }

            break;
        }
    }
};

const getAudioNext = ({ audioCategory }: { audioCategory: string }) => {
    const category = audioCategories.get(audioCategory)
        ?? error({ message: `Category ${audioCategory} not found`, where: getAudioNext.name });

    let nextAudioIndex: number;
    if (category.currentAudio) {
        const currentNum = parseInt(category.currentAudio.slice(-1));
        do { nextAudioIndex = randAudio({ nb: category.count }); }
        while (nextAudioIndex === currentNum);
    } else {
        nextAudioIndex = randAudio({ nb: category.count });
    }

    const nextTrack = `${category.prefix}${nextAudioIndex}`;
    category.currentAudio = nextTrack;

    return nextTrack;
};
//#endregion
