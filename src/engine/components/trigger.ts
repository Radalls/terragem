export type Trigger = {
    _: 'Trigger',
    _priority: number,
    points: TriggerPoint[],
};

export type TriggerPoint = {
    _offsetX: number,
    _offsetY: number,
};
