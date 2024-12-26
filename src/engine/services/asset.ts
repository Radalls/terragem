import { emit, GameEvents } from '@/engine/services/emit';
import { error } from '@/engine/services/error';

const spriteFiles = import.meta.glob('/src/assets/sprites/**/*.{png,gif}', { eager: true });
const audioFiles = import.meta.glob('/src/assets/audio/**/*.{mp3,wav,ogg}', { eager: true });
const fontFiles = import.meta.glob('/src/assets/fonts/**/*.{ttf,woff,woff2}', { eager: true });

//#region TYPES
export type AssetManager = {
    isLoadingComplete: () => boolean;
    startLoading: () => Promise<boolean>;
}
//#endregion

//#region SERVICES
export const createAssetManager = () => {
    let isLoading = false;
    let loadingPromise: Promise<boolean> | null = null;

    const startLoading = () => {
        if (isLoading || loadingPromise) return;

        isLoading = true;
        emit({ target: 'all', type: GameEvents.GAME_LOADING_ON });

        loadingPromise = preloadAssets().then(success => {
            isLoading = false;
            loadingPromise = null;

            if (success) {
                emit({ target: 'all', type: GameEvents.GAME_LOADING_OFF });
            } else {
                emit({ target: 'all', type: GameEvents.GAME_LOADING_ERROR });
            }

            return success;
        });

        return loadingPromise;
    };

    const isLoadingComplete = () => !(isLoading) && !(loadingPromise);

    return {
        isLoadingComplete,
        startLoading,
    } as AssetManager;
};

const preloadAssets = async (): Promise<boolean> => {
    const [spritesLoaded, audioLoaded, fontsLoaded] = await Promise.all([
        loadSprites(),
        loadAudio(),
        loadFonts(),
    ]);

    const allLoaded = spritesLoaded && audioLoaded && fontsLoaded;

    if (allLoaded) {
        return true;
    } else {
        error({
            message: 'Some assets failed to load',
            where: preloadAssets.name,
        });

        return false;
    }
};

const loadSprites = async (): Promise<boolean> => {
    const sprites = Object.entries(spriteFiles).map(([path, module]) => {
        const img = new Image();

        return new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => {
                error({
                    message: `Failed to load sprite: ${path}`,
                    where: loadSprites.name,
                });

                resolve(false);
            };
            img.src = (module as { default: string }).default;
        });
    });

    const results = await Promise.all(sprites);

    return results.every(result => result);
};

const loadAudio = async (): Promise<boolean> => {
    const audio = Object.entries(audioFiles).map(([path, module]) => {
        const audio = new Audio();
        return new Promise<boolean>((resolve) => {
            audio.oncanplaythrough = () => resolve(true);

            audio.onerror = () => {
                error({
                    message: `Failed to load audio: ${path}`,
                    where: loadAudio.name,
                });

                resolve(false);
            };

            audio.src = (module as { default: string }).default;

            audio.load();
        });
    });

    const results = await Promise.all(audio);

    return results.every(result => result);
};

const loadFonts = async (): Promise<boolean> => {
    const fonts = Object.entries(fontFiles).map(([path, module]) => {
        const fontName = path.split('/').pop()?.split('.')[0] || 'gameFont';
        const fontUrl = (module as { default: string }).default;

        return new Promise<boolean>((resolve) => {
            const fontFace = new FontFace(fontName, `url(${fontUrl})`);
            fontFace.load()
                .then(loadedFont => {
                    document.fonts.add(loadedFont);
                    resolve(true);
                })
                .catch(error => {
                    error({
                        message: `Failed to load font: ${path}`,
                        where: loadFonts.name,
                    });

                    resolve(false);
                });
        });
    });

    const results = await Promise.all(fonts);
    return results.every(result => result);
};
//#endregion
