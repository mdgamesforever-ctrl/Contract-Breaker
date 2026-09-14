import test from 'node:test';
import assert from 'node:assert/strict';
import { Vessel } from '../src/game/Vessel.js';
import { Combat } from '../src/game/Combat.js';
import { BossCombat } from '../src/game/BossCombat.js';
import { Deck } from '../src/cards/Deck.js';
import { createStarterDeck } from '../src/cards/starterCards.js';
import {
  createCrownedWound,
  createShriekingBrood,
  createHollowReliquary,
  createFracturedWidow,
  createBeckoner,
} from '../src/game/enemies.js';
import { createDyingGod } from '../src/game/bossRoster.js';
import { generateRunMap, NODE_TYPES } from '../src/run/RunMap.js';
import { Run } from '../src/run/Run.js';

function silentLog() {}

// Small deterministic PRNG so the whole run (map shape, deck shuffle, and
// every enemy's own rolls) is fully reproducible.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A greedy but simple auto-play strategy: always play the highest-power
// affordable card, healing with The Reckoning Scale when Faith is low, and
// Anchor a memory once a memory-shard boss reforms.
function autoPlay(combat, deck, player) {
  let guard = 0;
  while (!combat.over && guard++ < 100) {
    combat.startPlayerTurn();
    let played = true;
    while (played && deck.hand.length > 0 && !combat.over) {
      played = false;
      let bestIndex = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < deck.hand.length; i++) {
        const card = deck.hand[i];
        if (card.cost > player.energy) continue;
        const lowFaith = player.faith < player.maxFaith * 0.4;
        const score = card.id === 'reckoning-scale' && lowFaith ? 100 : card.power;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      if (bestIndex >= 0) {
        const card = deck.hand[bestIndex];
        const lowFaith = player.faith < player.maxFaith * 0.4;
        const choice = card.id === 'reckoning-scale' && lowFaith ? 'heal' : 'damage';
        combat.playCard(bestIndex, { choice });
        played = true;
      }
    }
    if (combat.over) break;

    if (combat instanceof BossCombat && !combat.anchorUsed && combat.enemy.faith < combat.enemy.maxFaith && deck.hand.length > 1) {
      combat.anchor(deck.hand.length - 1, deck.hand[0]);
    }

    if (!combat.over) combat.endPlayerTurn();
  }
  if (guard >= 100) throw new Error('autoPlay did not converge -- possible infinite loop');
}

function deterministicEnemyPool() {
  return [
    () => createCrownedWound(),
    () => createShriekingBrood(),
    () => createHollowReliquary(),
    () => createFracturedWidow({ rng: mulberry32(4242) }),
    () => createBeckoner({ rng: mulberry32(1337) }),
  ];
}

function runFullRun(seed) {
  const rng = mulberry32(seed);
  const player = new Vessel({ name: 'The Vessel', maxFaith: 50, energyPerTurn: 3 });
  const deck = new Deck(createStarterDeck(), { rng });
  const map = generateRunMap({
    floorCount: 5,
    nodesPerFloor: 3,
    restChance: 0.25,
    rng,
    enemyPool: deterministicEnemyPool(),
    bossFactory: () => createDyingGod({ damage: 6 }),
  });
  const run = new Run({ map, player, log: silentLog });

  const faithHistory = [player.faith];
  while (!run.over) {
    const options = run.availableNodes();
    const node = run.enterNode(options[0].id);

    if (node.type === NODE_TYPES.REST) {
      run.restAtCurrentNode();
    } else {
      const enemy = node.enemyFactory();
      const CombatClass = node.type === NODE_TYPES.BOSS ? BossCombat : Combat;
      const combat = new CombatClass({ player, deck, enemy, log: silentLog });
      autoPlay(combat, deck, player);
      faithHistory.push(player.faith);
      run.completeCurrentNode({ victory: combat.result === 'win' });
    }
  }
  return { run, faithHistory };
}

test('a full run from floor 0 to boss victory is completable with the starter deck', () => {
  const { run, faithHistory } = runFullRun(1);

  assert.equal(run.over, true);
  assert.equal(run.result, 'victory');
  assert.equal(run.currentNode.type, NODE_TYPES.BOSS);
});

test('the run is not trivial: the player takes real damage along the way', () => {
  const { faithHistory } = runFullRun(1);
  const minFaith = Math.min(...faithHistory);
  const maxFaith = 50;

  assert.ok(minFaith < maxFaith, 'the player should take some damage during the run');
  assert.ok(minFaith < maxFaith * 0.9, 'the run should cost meaningful Faith, not just a scratch');
});

test('a full run can also end in defeat -- the boss is a real threat, not a formality', () => {
  // A much weaker player Vessel should lose even to the early floors.
  const rng = mulberry32(1);
  const player = new Vessel({ name: 'The Vessel', maxFaith: 8, energyPerTurn: 3 });
  const deck = new Deck(createStarterDeck(), { rng });
  const map = generateRunMap({
    floorCount: 5,
    nodesPerFloor: 3,
    restChance: 0.25,
    rng,
    enemyPool: deterministicEnemyPool(),
    bossFactory: () => createDyingGod({ damage: 6 }),
  });
  const run = new Run({ map, player, log: silentLog });

  while (!run.over) {
    const options = run.availableNodes();
    const node = run.enterNode(options[0].id);
    if (node.type === NODE_TYPES.REST) {
      run.restAtCurrentNode();
      continue;
    }
    const enemy = node.enemyFactory();
    const CombatClass = node.type === NODE_TYPES.BOSS ? BossCombat : Combat;
    const combat = new CombatClass({ player, deck, enemy, log: silentLog });
    autoPlay(combat, deck, player);
    run.completeCurrentNode({ victory: combat.result === 'win' });
  }

  assert.equal(run.result, 'defeat');
});
