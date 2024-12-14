import { startDialog, updateDialog, endDialog } from '@/render/templates';

//#region EVENTS
export const onDialogStart = ({ entityId }: { entityId: string }) => startDialog({ entityId });

export const onDialogNext = ({ entityId }: { entityId: string }) => updateDialog({ entityId });

export const onDialogEnd = ({ entityId }: { entityId: string }) => endDialog({ entityId });
//#endregion
