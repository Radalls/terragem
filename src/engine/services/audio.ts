import { getComponent } from '@/engine/entities';
import { error } from '@/engine/services/error';
import { getStore } from '@/engine/services/store';

//#region CONSTANTS
export type AudioData = {
    audioName: string,
    loop?: boolean,
    volume?: number,
};

const audioFiles: Record<string, { default: string }>
    = import.meta.glob('../../../src/assets/audio/**/*.mp3', { eager: true });

const audios: HTMLAudioElement[] = [];
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
    /* MAIN */
    createAudio({ audioName: 'main_confirm' });
    createAudio({ audioName: 'main_fail' });
    createAudio({ audioName: 'main_select' });
    createAudio({ audioName: 'main_success' });
    /* ACTIVITIES */
    createAudio({ audioName: 'activity_pickup' });
    /* BUG */
    createAudio({ audioName: 'activity_bug_select' });
    createAudio({ audioName: 'activity_bug_start' });
    createAudio({ audioName: 'activity_bug_win' });
    /* FISH */
    createAudio({ audioName: 'activity_fish_frenzy' });
    createAudio({ audioName: 'activity_fish_play1' });
    createAudio({ audioName: 'activity_fish_play2' });
    createAudio({ audioName: 'activity_fish_start' });
    createAudio({ audioName: 'activity_fish_win' });
    /* CRAFT */
    createAudio({ audioName: 'activity_craft_end' });
    createAudio({ audioName: 'activity_craft_play1' });
    createAudio({ audioName: 'activity_craft_play2' });
    createAudio({ audioName: 'activity_craft_play3' });
    createAudio({ audioName: 'activity_craft_play4' });
    createAudio({ audioName: 'activity_craft_play5' });
    createAudio({ audioName: 'activity_craft_play6' });
    createAudio({ audioName: 'activity_craft_start' });
    createAudio({ audioName: 'activity_craft_win' });
    /* BGM */
    createAudio({ audioName: 'bgm_map1' });
    createAudio({ audioName: 'bgm_menu1' });
    createAudio({ audioName: 'bgm_menu2' });
    /* ENERGY */
    createAudio({ audioName: 'energy_gain' });
    /* INVENTORY */
    createAudio({ audioName: 'inventory_close' });
    createAudio({ audioName: 'inventory_empty' });
    createAudio({ audioName: 'inventory_open' });
    createAudio({ audioName: 'inventory_tool_active' });
    createAudio({ audioName: 'inventory_tool_empty' });
    /* MENUS */
    createAudio({ audioName: 'menu_launch_start' });
    createAudio({ audioName: 'menu_settings_close' });
    createAudio({ audioName: 'menu_settings_open' });
    createAudio({ audioName: 'menu_settings_save' });
    /* QUEST */
    createAudio({ audioName: 'quest_complete' });
    createAudio({ audioName: 'quest_end' });
    createAudio({ audioName: 'quest_start' });
    /* STEPS */
    createAudio({ audioName: 'step_grass1' });
    createAudio({ audioName: 'step_grass2' });
    createAudio({ audioName: 'step_grass3' });
    createAudio({ audioName: 'step_grass4' });
    createAudio({ audioName: 'step_sand1' });
    createAudio({ audioName: 'step_sand2' });
    createAudio({ audioName: 'step_sand3' });
    createAudio({ audioName: 'step_sand4' });
};

export const createAudio = ({ audioName }: { audioName: string }) => {
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
    const managerEntityId = getStore('managerId')
        ?? error({ message: 'Store managerId is undefined', where: playAudio.name });

    const manager = getComponent({ componentId: 'Manager', entityId: managerEntityId });

    const audio = audios.find(audio => audio.src.includes(audioName))
        ?? error({ message: `Audio ${audioName} not found`, where: playAudio.name });

    audio.currentTime = 0;
    audio.loop = loop;
    audio.volume = volume * manager.settings._audioVolume;

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
