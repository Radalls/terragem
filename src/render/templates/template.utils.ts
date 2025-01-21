import { error } from '@/engine/services/error';

//#region UTILS
export const getElement = ({ elId }: { elId: string }) => {
    return document.getElementById(elId)
        ?? error({ message: `Element ${elId} does not exist`, where: getElement.name });
};

export const checkElement = ({ elId }: { elId: string }) => {
    return document.getElementById(elId) !== null;
};

export const searchElementsById = ({ partialid }: { partialid: string }) => {
    return [...document.querySelectorAll(`[id*="${partialid}"]`)] as HTMLElement[];
};

export const searchElementsByClassName = ({ parent, className }: {
    className: string,
    parent: string,
}) => {
    const parentEl = getElement({ elId: parent });

    const classEls = [...parentEl.querySelectorAll(`.${className}`)] as HTMLElement[];

    return (classEls.length)
        ? classEls
        : error({
            message: `No element with class ${className} found`,
            where: searchElementsByClassName.name,
        });
};
//#endregion
