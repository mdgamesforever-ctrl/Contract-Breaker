import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRunMap, NODE_TYPES } from '../src/run/RunMap.js';
import { Run } from '../src/run/Run.js';
import { Vessel } from '../src/game/Vessel.js';

function silentLog() {}

// Cycles deterministically through a fixed sequence of [0, 1) values.
function sequenceRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('generateRunMap produces the requested floor shape with exactly one boss node', () => {
  const map = generateRunMap({ floorCount: 4, nodesPerFloor: 3, rng: sequenceRng([0.1, 0.9, 0.4]) });

  assert.equal(map.floors.length, 4);
  for (let f = 0; f < 3; f++) {
    assert.equal(map.floors[f].length, 3);
    for (const node of map.floors[f]) assert.notEqual(node.type, NODE_TYPES.BOSS);
  }
  assert.equal(map.floors[3].length, 1);
  assert.equal(map.floors[3][0].type, NODE_TYPES.BOSS);
  assert.equal(map.bossNode, map.floors[3][0]);
});

test('every node is reachable from floor 0, including the boss', () => {
  const map = generateRunMap({ floorCount: 5, nodesPerFloor: 4, rng: sequenceRng([0.05, 0.2, 0.55, 0.8, 0.35]) });

  const reachable = new Set(map.startingNodes.map((n) => n.id));
  for (let f = 0; f < map.floors.length - 1; f++) {
    for (const node of map.floors[f]) {
      if (!reachable.has(node.id)) continue;
      for (const targetId of node.connections) reachable.add(targetId);
    }
  }

  for (const node of map.allNodes()) {
    assert.ok(reachable.has(node.id), `expected ${node.id} to be reachable from floor 0`);
  }
  assert.ok(reachable.has(map.bossNode.id));
});

test('every non-final floor node has at least one outgoing connection', () => {
  const map = generateRunMap({ floorCount: 4, nodesPerFloor: 3, rng: Math.random });
  for (let f = 0; f < map.floors.length - 1; f++) {
    for (const node of map.floors[f]) {
      assert.ok(node.connections.length >= 1, `${node.id} should connect forward`);
    }
  }
  assert.equal(map.bossNode.connections.length, 0, 'boss node is terminal');
});

test('generateRunMap rejects degenerate configurations', () => {
  assert.throws(() => generateRunMap({ floorCount: 1 }));
  assert.throws(() => generateRunMap({ nodesPerFloor: 0 }));
});

test('Run progresses sequentially through reachable nodes to a boss victory', () => {
  const map = generateRunMap({ floorCount: 3, nodesPerFloor: 2, rng: sequenceRng([0.9, 0.9, 0.9]) });
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const run = new Run({ map, player, log: silentLog });

  assert.deepEqual(run.availableNodes(), map.startingNodes);

  let node = run.enterNode(map.startingNodes[0].id);
  assert.equal(run.currentNode, node);
  run.completeCurrentNode({ victory: true });
  assert.equal(run.over, false);

  const nextOptions = run.availableNodes();
  assert.ok(nextOptions.length > 0);
  node = run.enterNode(nextOptions[0].id);
  run.completeCurrentNode({ victory: true });

  const bossOptions = run.availableNodes();
  assert.equal(bossOptions.length, 1);
  assert.equal(bossOptions[0].id, map.bossNode.id);
  node = run.enterNode(bossOptions[0].id);
  assert.equal(node.type, NODE_TYPES.BOSS);
  run.completeCurrentNode({ victory: true });

  assert.equal(run.over, true);
  assert.equal(run.result, 'victory');
});

test('Run ends in defeat immediately when a fight is lost', () => {
  const map = generateRunMap({ floorCount: 3, nodesPerFloor: 2, rng: sequenceRng([0.1, 0.1, 0.1]) });
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const run = new Run({ map, player, log: silentLog });

  run.enterNode(map.startingNodes[0].id);
  run.completeCurrentNode({ victory: false });

  assert.equal(run.over, true);
  assert.equal(run.result, 'defeat');
  assert.deepEqual(run.availableNodes(), []);
  assert.throws(() => run.enterNode(map.floors[1][0].id), /already ended/);
});

test('Run rejects entering a node that is not currently reachable', () => {
  const map = generateRunMap({ floorCount: 3, nodesPerFloor: 2, rng: sequenceRng([0.9, 0.1, 0.5]) });
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const run = new Run({ map, player, log: silentLog });

  assert.throws(() => run.enterNode(map.bossNode.id), /not reachable/);
});

test('restAtCurrentNode heals the player and completes the node', () => {
  const map = generateRunMap({ floorCount: 2, nodesPerFloor: 1, restChance: 1, rng: () => 0 });
  const player = new Vessel({ name: 'Player', maxFaith: 40 });
  player.takeDamage(20);
  const run = new Run({ map, player, log: silentLog });

  const restNode = run.enterNode(map.startingNodes[0].id);
  assert.equal(restNode.type, NODE_TYPES.REST);
  run.restAtCurrentNode(10);

  assert.equal(player.faith, 30);
  assert.equal(run.over, false, 'a non-boss node should not end the run');
});
