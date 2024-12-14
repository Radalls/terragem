//#region TYPES
export type ErrorData = {
    message: string,
    where?: string,
};
//#endregion

//#region SERVICES
export const error = ({ message, where }: { message: string, where: string }) => {
    const errorData = { message, where } as ErrorData;
    throw errorData;
};
//#endregion
