import { shuffle } from '../utils/shuffle.js';

export const NODE_TYPES = Object.freeze({
  FIGHT: 'fight',
  REST: 'rest',
  BOSS: 'boss',
});

// A branching, floor-by-floor node map. Every floor's nodes connect forward
// to at least one node in the next floor, so every node is reachable from
// somewhere in floor 0, and the single boss node in the final floor is
// reachable from every path through the map.
export class RunMap {
  constructor(floors) {
    this.floors = floors;
  }

  get startingNodes() {
    return this.floors[0];
  }

  get bossNode() {
    return this.floors[this.floors.length - 1][0];
  }

  allNodes() {
    return this.floors.flat();
  }

  getNode(id) {
    return this.allNodes().find((n) => n.id === id);
  }
}

// Generates a RunMap. `rng` is injectable for deterministic tests.
export function generateRunMap({
  floorCount = 5,
  nodesPerFloor = 3,
  restChance = 0.25,
  rng = Math.random,
} = {}) {
  if (floorCount < 2) {
    throw new Error('A run map needs at least 2 floors (one fight floor and a boss floor)');
  }
  if (nodesPerFloor < 1) {
    throw new Error('Each non-boss floor needs at least one node');
  }

  const floors = [];
  for (let f = 0; f < floorCount - 1; f++) {
    const nodes = [];
    for (let i = 0; i < nodesPerFloor; i++) {
      const type = rng() < restChance ? NODE_TYPES.REST : NODE_TYPES.FIGHT;
      nodes.push({ id: `f${f}n${i}`, floor: f, type, connections: [] });
    }
    floors.push(nodes);
  }
  floors.push([
    { id: `f${floorCount - 1}n0`, floor: floorCount - 1, type: NODE_TYPES.BOSS, connections: [] },
  ]);

  for (let f = 0; f < floors.length - 1; f++) {
    const current = floors[f];
    const next = floors[f + 1];

    for (const node of current) {
      const linkCount = Math.min(next.length, rng() < 0.5 ? 1 : 2);
      node.connections = shuffle(next, rng)
        .slice(0, linkCount)
        .map((target) => target.id);
    }

    // Guarantee every node in the next floor is reachable from this one.
    for (const node of next) {
      const hasIncoming = current.some((c) => c.connections.includes(node.id));
      if (!hasIncoming) {
        const source = current[Math.floor(rng() * current.length)];
        source.connections.push(node.id);
      }
    }
  }

  return new RunMap(floors);
}
