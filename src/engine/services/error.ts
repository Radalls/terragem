import { emit as emitEvent } from '@/engine/services/emit';
import { RenderEventTypes } from '@/render/events';

//#region TYPES
export type ErrorData = {
    message: string,
    where?: string,
};
//#endregion

//#region SERVICES
export const error = ({ message, where, emit = false }: {
    emit?: boolean,
    message: string,
    where: string,
}) => {
    const errorData = { message, where } as ErrorData;

    if (emit) emitEvent({
        data: message,
        target: 'render',
        type: RenderEventTypes.INFO_ALERT,
    });

    throw errorData;
};
//#endregion
