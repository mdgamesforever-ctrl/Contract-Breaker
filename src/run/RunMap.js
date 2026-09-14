import { shuffle } from '../utils/shuffle.js';

export const NODE_TYPES = Object.freeze({
  FIGHT: 'fight',
  REST: 'rest',
  BOSS: 'boss',
  MINIBOSS: 'miniboss',
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
// `enemyPool` (factory functions) is assigned randomly to fight nodes so
// each node knows which enemy it holds; `bossFactory` is assigned to the
// single (final) boss node. Both are optional -- callers that don't pass
// them just get a map without pre-assigned encounters.
//
// `miniBossFactory`, if given, marks exactly one node on a middle floor
// (the first node of `miniBossFloor`, or the middle non-boss floor if
// omitted) as a NODE_TYPES.MINIBOSS node instead of a normal roll, holding
// that factory. Omitting `miniBossFactory` reproduces the exact map shape
// (and RNG consumption) from before mini-bosses existed, so every existing
// caller is unaffected.
export function generateRunMap({
  floorCount = 5,
  nodesPerFloor = 3,
  restChance = 0.25,
  rng = Math.random,
  enemyPool = [],
  bossFactory = null,
  miniBossFactory = null,
  miniBossFloor = null,
} = {}) {
  if (floorCount < 2) {
    throw new Error('A run map needs at least 2 floors (one fight floor and a boss floor)');
  }
  if (nodesPerFloor < 1) {
    throw new Error('Each non-boss floor needs at least one node');
  }

  const nonBossFloorCount = floorCount - 1;
  const resolvedMiniBossFloor = miniBossFactory
    ? miniBossFloor ?? Math.floor(nonBossFloorCount / 2)
    : null;

  const floors = [];
  for (let f = 0; f < floorCount - 1; f++) {
    const nodes = [];
    for (let i = 0; i < nodesPerFloor; i++) {
      if (f === resolvedMiniBossFloor && i === 0) {
        nodes.push({
          id: `f${f}n${i}`,
          floor: f,
          type: NODE_TYPES.MINIBOSS,
          connections: [],
          enemyFactory: miniBossFactory,
        });
        continue;
      }
      const type = rng() < restChance ? NODE_TYPES.REST : NODE_TYPES.FIGHT;
      const node = { id: `f${f}n${i}`, floor: f, type, connections: [] };
      if (type === NODE_TYPES.FIGHT && enemyPool.length > 0) {
        node.enemyFactory = enemyPool[Math.floor(rng() * enemyPool.length)];
      }
      nodes.push(node);
    }
    floors.push(nodes);
  }
  const bossNode = { id: `f${floorCount - 1}n0`, floor: floorCount - 1, type: NODE_TYPES.BOSS, connections: [] };
  if (bossFactory) bossNode.enemyFactory = bossFactory;
  floors.push([bossNode]);

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
