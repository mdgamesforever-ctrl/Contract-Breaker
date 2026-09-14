import test from 'node:test';
import assert from 'node:assert/strict';
import { Vessel } from '../src/game/Vessel.js';
import { Combat } from '../src/game/Combat.js';
import { BossCombat } from '../src/game/BossCombat.js';
import { Deck } from '../src/cards/Deck.js';
import { createStarterDeck } from '../src/cards/starterCards.js';
import { ENEMY_ROSTER } from '../src/game/enemies.js';
import { createDyingGod, createBrokenAcolyte } from '../src/game/bossRoster.js';
import { generateRunMap, NODE_TYPES } from '../src/run/RunMap.js';
import { Run } from '../src/run/Run.js';

// Balance check for the *shipped* run configuration (see src/index.js and
// web-build/app.js): the full ~30-card pool, the full 10-enemy roster, the
// mid-run Broken Acolyte mini-boss, and the final Dying God boss, at the
// larger 6-floor/4-node map size. A full run through the 16-card/5-enemy
// pool was already covered by test/fullRun.test.js; this exercises the
// expanded content specifically, across several seeds, to confirm the
// larger pool didn't accidentally trivialize or break the run.

function silentLog() {}

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

function autoPlay(combat, deck, player) {
  let guard = 0;
  while (!combat.over && guard++ < 200) {
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
        const isHeal = ['reckoning-scale', 'unbroken-choir', 'soul-ascending'].includes(card.id);
        const score = isHeal && lowFaith ? 100 : card.power;
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
  if (guard >= 200) throw new Error('autoPlay did not converge -- possible infinite loop');
}

function runFullExpandedRun(seed, { maxFaith = 50 } = {}) {
  const rng = mulberry32(seed);
  const player = new Vessel({ name: 'The Vessel', maxFaith, energyPerTurn: 3 });
  const deck = new Deck(createStarterDeck(), { rng });
  const map = generateRunMap({
    floorCount: 6,
    nodesPerFloor: 4,
    restChance: 0.22,
    rng,
    enemyPool: ENEMY_ROSTER,
    bossFactory: () => createDyingGod({ rng }),
    miniBossFactory: () => createBrokenAcolyte({ rng }),
  });
  const run = new Run({ map, player, log: silentLog });

  const faithHistory = [player.faith];
  let guard = 0;
  while (!run.over && guard++ < 30) {
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
  if (guard >= 30) throw new Error('run did not converge -- possible infinite loop');
  return { run, faithHistory };
}

test('the expanded-content run (30-card pool, 10-enemy roster, mini-boss + boss) is completable', () => {
  const outcomes = [1, 2, 3, 4, 5].map((seed) => runFullExpandedRun(seed).run.result);
  const victories = outcomes.filter((r) => r === 'victory').length;
  assert.ok(victories >= 1, `expected at least one victory across seeds 1-5, got: ${outcomes.join(', ')}`);
});

test('the expanded-content run is not trivial: the player takes real damage along the way', () => {
  const { faithHistory } = runFullExpandedRun(2);
  const minFaith = Math.min(...faithHistory);
  assert.ok(minFaith < 50, 'the player should take some damage during the run');
});

test('the expanded-content run includes exactly one mid-run mini-boss node distinct from the final boss', () => {
  const rng = mulberry32(7);
  const map = generateRunMap({
    floorCount: 6,
    nodesPerFloor: 4,
    restChance: 0.22,
    rng,
    enemyPool: ENEMY_ROSTER,
    bossFactory: () => createDyingGod(),
    miniBossFactory: () => createBrokenAcolyte(),
  });
  const miniBossNodes = map.allNodes().filter((n) => n.type === NODE_TYPES.MINIBOSS);
  const bossNodes = map.allNodes().filter((n) => n.type === NODE_TYPES.BOSS);
  assert.equal(miniBossNodes.length, 1);
  assert.equal(bossNodes.length, 1);
  assert.notEqual(miniBossNodes[0].id, bossNodes[0].id);
});

test('a much weaker player can still lose the expanded-content run', () => {
  const outcomes = [1, 2, 3].map((seed) => runFullExpandedRun(seed, { maxFaith: 10 }).run.result);
  assert.ok(outcomes.some((r) => r === 'defeat'), `expected at least one defeat with a weak vessel, got: ${outcomes.join(', ')}`);
});
