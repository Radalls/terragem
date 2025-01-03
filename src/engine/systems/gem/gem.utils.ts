import { Gems, State, Mine, Carry, Tunnel, Lift, Item } from '@/engine/components';
import { Gem } from '@/engine/components/gem';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { checkComponent, getAdmin, getComponent } from '@/engine/systems/entity';
import { RenderEvents } from '@/render/events';

//#region TYPES
type GemStatMapping<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

type GemStats = {
    [Gems.MINE]: GemStatMapping<Mine>;
    [Gems.CARRY]: GemStatMapping<Carry>;
    [Gems.TUNNEL]: GemStatMapping<Tunnel>;
    [Gems.LIFT]: GemStatMapping<Lift>;
};

type GemStatParams<T extends Gems> = {
    gemId: string;
    gemType: T;
    stat: GemStats[T];
};
//#endregion

//#region UTILS
export const getGem = ({ gemId }: { gemId: string }): Gem => {
    const gemType = getGemType({ gemId });
    const gem = getComponent({ componentId: gemType, entityId: gemId });

    return gem;
};

export const getGemType = ({ gemId }: { gemId: string }) => {
    const gemType = Object.values(Gems)
        .find(type => checkComponent({ componentId: type, entityId: gemId }));

    if (!(gemType)) throw error({
        message: `Gem ${gemId} has no type`,
        where: getGemType.name,
    });

    return gemType;
};

export const getGemStat = <T extends Gems>({ gemId, gemType, stat }: GemStatParams<T>) => {
    if (!(stat)) throw error({
        message: `Invalid stat ${stat}`,
        where: getGemStat.name,
    });

    const admin = getAdmin();
    const gem = getGem({ gemId });

    if (!(gem)) {
        error({
            message: `Invalid gem ${gemId}`,
            where: getGemStat.name,
        });
    }

    if (!(stat in gem)) {
        throw error({
            message: `Stat ${stat} is not valid for gemType ${gemType}`,
            where: getGemStat.name,
        });
    }

    const statName = stat.slice(1)[0].toUpperCase() + stat.slice(2);
    const adminStatKey = `_gem${gemType}${statName}` as keyof typeof admin.stats;

    return (gem[stat as keyof typeof gem] as number) + (admin.stats[adminStatKey] ?? 0);
};

export const getGemActionSpeed = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemType === Gems.MINE) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : getGemStat({ gemId, gemType, stat: '_digSpeed' });

        return gemActionSpeed;
    }
    else if (gemType === Gems.CARRY) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : getGemStat({ gemId, gemType, stat: '_itemSpeed' });

        return gemActionSpeed;
    }
    else if (gemType === Gems.TUNNEL) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : getGemStat({ gemId, gemType, stat: '_digSpeed' });

        return gemActionSpeed;
    }
    else if (gemType === Gems.LIFT) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : getGemStat({ gemId, gemType, stat: '_itemSpeed' });

        return gemActionSpeed;
    }
    else throw error({
        message: `Gem ${gemId} has no action speed`,
        where: getGemActionSpeed.name,
    });
};

export const setGemRequest = ({ gemId, request }: {
    gemId: string,
    request: boolean,
}) => {
    const admin = getAdmin();

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._request = request;

    if (request) {
        admin.requests.push(gemId);
    }
    else {
        const index = admin.requests.indexOf(gemId);
        if (index > -1) admin.requests.splice(index, 1);
    }
};

export const setGemStore = ({ gemId, store }: {
    gemId: string,
    store: boolean,
}) => {
    const admin = getAdmin();

    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const gem = getGem({ gemId });

    gemState._store = store;
    setGemAction({ action: 'idle', gemId });

    admin.requests = admin.requests.filter(request => request !== gemId);

    gemPosition._x = 0;
    gemPosition._y = 0;

    if (gemHasItems(gem)) {
        gem.items = [];
    }

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_UPDATE });

    emit({
        data: `${gemId} ${store ? 'stored' : 'deployed'}`,
        entityId: gemId,
        target: 'render',
        type: RenderEvents.INFO,
    });
};

export const setGemAction = ({ gemId, action }: {
    action: State['_action'],
    gemId: string,
}) => {
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._action = action;

    emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_UPDATE });
};

export const gemHasItems = (gem: Gem): gem is (Gem) & {
    _itemCapacity: number,
    items: Array<Item>,
} => {
    return 'items' in gem && '_itemCapacity' in gem;
};

export const isGemAtCapacity = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gem = getGem({ gemId });

    if (!(gemHasItems(gem))) {
        return false;
    }

    const gemItemCount = gem.items.reduce((acc, item) => acc + item._amount, 0);

    return (gemItemCount >= getGemStat({ gemId, gemType, stat: '_itemCapacity' }));
};

export const isGemAt = ({ gemId, at }: {
    at: 'start' | 'target',
    gemId: string,
}) => {
    const gemType = getGemType({ gemId });
    const gem = (gemType === Gems.CARRY)
        ? getComponent({ componentId: 'Carry', entityId: gemId })
        : getComponent({ componentId: 'Lift', entityId: gemId });

    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });

    if (at === 'start') {
        return (gemPosition._x === gem._moveStartX && gemPosition._y === gem._moveStartY);
    }
    else if (at === 'target') {
        return (gemPosition._x === gem._moveTargetX && gemPosition._y === gem._moveTargetY);
    }

    return false;
};
//#endregion
