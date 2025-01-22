import { Gems, State, Mine, Carry, Tunnel, Lift, Item } from '@/engine/components';
import { Floor, Gem, Shaft } from '@/engine/components/gem';
import { emit } from '@/engine/services/emit';
import { error } from '@/engine/services/error';
import { EngineEvents } from '@/engine/services/event';
import { checkComponent, destroyEntity, getAdmin, getComponent } from '@/engine/systems/entity';
import { addAdminItem, getCraftData, getMechData } from '@/engine/systems/item';
import { updateSprite } from '@/engine/systems/sprite';
import { RenderEvents } from '@/render/events';

//#region TYPES
type GemStatMapping<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

type GemStats = {
    [Gems.CARRY]: GemStatMapping<Carry>;
    [Gems.FLOOR]: GemStatMapping<Floor>;
    [Gems.LIFT]: GemStatMapping<Lift>;
    [Gems.MINE]: GemStatMapping<Mine>;
    [Gems.SHAFT]: GemStatMapping<Shaft>;
    [Gems.TUNNEL]: GemStatMapping<Tunnel>;
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

    const adminStatName = stat.slice(1)[0].toUpperCase() + stat.slice(2);
    const adminStatKey = `_gem${gemType}${adminStatName}` as keyof typeof admin.stats;

    if (gem._mech) {
        const mechData = getMechData({ mechName: gem._mech });
        const mechStatName = stat.slice(1);
        const mechStat = mechData.stats[mechStatName] ?? 0;

        return Math.round((
            (gem[stat as keyof typeof gem] as number)
            + (admin.stats[adminStatKey] ?? 0)
            + mechStat
        ) * 10) / 10;
    }

    return Math.round((
        (gem[stat as keyof typeof gem] as number)
        + (admin.stats[adminStatKey] ?? 0)
    ) * 10) / 10;
};

export const getGemActionSpeed = ({ gemId }: { gemId: string }) => {
    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    if (gemType === Gems.MINE || gemType === Gems.FLOOR || gemType === Gems.SHAFT || gemType === Gems.TUNNEL) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : getGemStat({ gemId, gemType, stat: '_digSpeed' });

        return gemActionSpeed;
    }
    else if (gemType === Gems.CARRY || gemType === Gems.LIFT) {
        const gemActionSpeed = (gemState._action === 'move')
            ? getGemStat({ gemId, gemType, stat: '_moveSpeed' })
            : isGemAt({ at: 'start', gemId }) || isGemAt({ at: 'target', gemId })
                ? getGemStat({ gemId, gemType, stat: '_itemSpeed' })
                : getGemStat({ gemId, gemType, stat: '_moveSpeed' });

        return gemActionSpeed;
    }
    else throw error({
        message: `Gem ${gemId} has no action speed`,
        where: getGemActionSpeed.name,
    });
};

export const getGemTypeCount = ({ gemType }: { gemType: Gems }) => {
    const admin = getAdmin();

    return admin.gems.filter(gem => getGemType({ gemId: gem }) === gemType).length;
};

export const setGemRequest = ({ gemId, request }: {
    gemId: string,
    request: boolean,
}) => {
    const admin = getAdmin();

    const gemState = getComponent({ componentId: 'State', entityId: gemId });

    gemState._request = request;

    if (request) {
        if (!(admin.requests.includes(gemId))) {
            admin.requests.push(gemId);
        }
    }
    else {
        const index = admin.requests.indexOf(gemId);

        if (index > -1) {
            admin.requests.splice(index, 1);
        }
    }
};

export const setGemStore = ({ gemId, store }: {
    gemId: string,
    store: boolean,
}) => {
    const admin = getAdmin();

    const gemType = getGemType({ gemId });
    const gemState = getComponent({ componentId: 'State', entityId: gemId });
    const gemPosition = getComponent({ componentId: 'Position', entityId: gemId });
    const gem = getGem({ gemId });

    gemState._store = store;

    if (gemState._store) {
        setGemAction({ action: 'idle', gemId });

        admin.requests = admin.requests.filter(request => request !== gemId);

        gemPosition._x = 0;
        gemPosition._y = 0;

        if (gemHasItems(gem)) {
            gem.items = [];
        }

        if (gem._mech) {
            emit({ entityId: gemId, target: 'engine', type: EngineEvents.GEM_EQUIP });
        }

        updateSprite({ entityId: gemId, image: `gem_${gemType.toLowerCase()}` });

        emit({ entityId: gemId, target: 'render', type: RenderEvents.GEM_UPDATE });
    }

    emit({
        data: { text: `${gem._name} ${store ? 'stored' : 'deployed'}`, type: 'confirm' },
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
    const gem = (gemType === Gems.CARRY) //TODO: improve
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

export const isGemUnlocked = ({ gemType }: { gemType: Gems }) => {
    const admin = getAdmin();

    return admin.crafts.includes(`GEM_${gemType.toUpperCase()}`);
};

export const destroyGem = ({ gemId }: { gemId: string }) => {
    const admin = getAdmin();

    const gemType = getGemType({ gemId });
    const gem = getGem({ gemId });
    const gemCraftData = getCraftData({ itemName: `GEM_${gemType.toUpperCase()}` });

    for (const compItem of gemCraftData.components) {
        addAdminItem({ amount: compItem.amount, name: compItem.name });
    }

    admin.gems = admin.gems.filter(gem => gem !== gemId);

    emit({
        data: { alert: true, text: `${gem._name} destroyed`, type: 'confirm' },
        target: 'render',
        type: RenderEvents.INFO,
    });

    emit({ data: { amount: -1 }, target: 'engine', type: EngineEvents.GEM_QUEST });

    destroyEntity({ entityId: gemId });
};
//#endregion
