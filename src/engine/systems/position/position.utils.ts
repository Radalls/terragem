import { getComponent } from '@/engine/systems/entity';
import { getTileAtPosition } from '@/engine/systems/position';

//#region CONSTANTS
export const activePathRequests = new Map<string, PathRequest>();
//#endregion

//#region TYPES
type PathRequest = {
    entityId: string;
    path: Point[];
    targetX: number;
    targetY: number;
}

type Point = {
    x: number;
    y: number;
}

type Node = {
    f: number;
    g: number;
    h: number;
    parent: Node | null;
    x: number;
    y: number;
}
//#endregion

//#region UTILS
export const calculatePath = ({ startX, startY, targetX, targetY }: {
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
}): Point[] => {
    const openSet: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
        f: 0,
        g: 0,
        h: manhattanDistance(startX, startY, targetX, targetY),
        parent: null,
        x: startX,
        y: startY,
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    while (openSet.length > 0) {
        const currentNode = openSet.reduce((min, node) =>
            node.f < min.f ? node : min, openSet[0]);

        openSet.splice(openSet.indexOf(currentNode), 1);

        closedSet.add(`${currentNode.x},${currentNode.y}`);

        if (currentNode.x === targetX && currentNode.y === targetY) {
            return reconstructPath(currentNode);
        }

        const neighbors = getValidNeighbors(currentNode.x, currentNode.y);

        for (const neighbor of neighbors) {
            if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

            const tentativeG = currentNode.g + 1;

            const existingNeighbor = openSet.find(n =>
                n.x === neighbor.x && n.y === neighbor.y);

            if (!(existingNeighbor)) {
                const newNode: Node = {
                    f: 0,
                    g: tentativeG,
                    h: manhattanDistance(neighbor.x, neighbor.y, targetX, targetY),
                    parent: currentNode,
                    x: neighbor.x,
                    y: neighbor.y,
                };

                newNode.f = newNode.g + newNode.h;
                openSet.push(newNode);
            } else if (tentativeG < existingNeighbor.g) {
                existingNeighbor.g = tentativeG;
                existingNeighbor.f = existingNeighbor.g + existingNeighbor.h;
                existingNeighbor.parent = currentNode;
            }
        }
    }

    return [];
};

const getValidNeighbors = (x: number, y: number): Point[] => {
    const directions = [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
    ];

    return directions
        .map(dir => ({ x: x + dir.x, y: y + dir.y }))
        .filter(pos => {
            try {
                const tileId = getTileAtPosition({ x: pos.x, y: pos.y });
                const tile = getComponent({ componentId: 'Tile', entityId: tileId });

                return tile._destroy;
            } catch {
                return false;
            }
        });
};

const manhattanDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
};

const reconstructPath = (endNode: Node): Point[] => {
    const path: Point[] = [];
    let current: Node | null = endNode;

    while (current !== null) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
    }

    return path;
};
//#endregion
