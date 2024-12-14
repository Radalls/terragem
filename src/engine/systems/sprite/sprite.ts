import { error } from '@/engine/services/error';

//#region CONSTANTS
const spriteFiles: Record<string, { default: string }>
    = import.meta.glob('/src/assets/sprites/**/*.{png,gif}', { eager: true });
//#endregion

//#region SYSTEMS
export const getSpritePath = ({ spriteName }: { spriteName: string }) => {
    const spriteKey = spriteName.replace(/^(.*?)(\/[^/]+)?(\.[^./]+)?$/, '$1').split('_')[0];
    const spritePath = `/src/assets/sprites/${spriteKey}/${spriteName}.png`;

    return spriteFiles[spritePath].default
        ?? error({ message: `Sprite ${spriteName} not found`, where: getSpritePath.name });
};
//#endregion
