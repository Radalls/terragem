import builds from '@/assets/data/builds.json';
import { Items } from '@/engine/components';
import { error } from '@/engine/services/error';

//#region TYPES
export type BuildData = {
    forge?: {
        inputs: { amount: number, name: Items }[];
        outputs: { amount: number, name: Items }[];
    }
    height: number;
    name: string;
    width: number;
    x: number;
};
//#endregion

//#region DATA
export const getBuildData = ({ buildName }: { buildName: string }) => {
    const buildz = builds.filter((build) => !(build['@']));

    const buildData = buildz.find((build) => build.name === buildName) ?? error({
        message: `BuildData for ${buildName} not found`,
        where: getBuildData.name,
    });

    return buildData as BuildData;
};
//#endregion
