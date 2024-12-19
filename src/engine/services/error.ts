import { emit as emitEvent } from '@/engine/services/emit';
import { RenderEvents } from '@/render/events';

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
        type: RenderEvents.INFO_ALERT,
    });

    throw errorData;
};
//#endregion
