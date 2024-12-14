import { Position } from './position';

export type TileMap = {
    _: 'TileMap',
    _height: number,
    _name: string,
    _width: number,
    tiles: Tile[],
};

export type TileMapState = TileMap & {
    source: 'game' | 'save',
};

export type Tile = {
    _entityColliderIds: string[],
    _entityIds: string[],
    _entityTriggerIds: string[],
    _solid?: boolean,
    _sound?: string,
    exits?: TileExit[],
    position: TilePosition,
};

export type TileExit = {
    _direction: 'up' | 'down' | 'left' | 'right',
    _targetMap: string,
    targetPosition: TilePosition,
};

type TilePosition = Pick<Position, '_x' | '_y'>;
