import { Vessel } from './game/Vessel.js';
import { Combat } from './game/Combat.js';
import { BossCombat } from './game/BossCombat.js';
import { Deck } from './cards/Deck.js';
import { createStarterDeck } from './cards/starterCards.js';
import { ENEMY_ROSTER } from './game/enemies.js';
import { createDyingGod, createBrokenAcolyte } from './game/bossRoster.js';
import { generateRunMap, NODE_TYPES } from './run/RunMap.js';
import { Run } from './run/Run.js';
import { NarrativeEngine } from './narrative/NarrativeEngine.js';
import { createShardPool } from './narrative/shards.js';

// Auto-plays every affordable card each turn until the fight ends. Used by
// the demo so the run can walk itself end-to-end from the console.
function autoPlay(combat, deck, player) {
  while (!combat.over) {
    combat.startPlayerTurn();
    let played = true;
    while (played && deck.hand.length > 0 && !combat.over) {
      played = false;
      let bestIndex = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < deck.hand.length; i++) {
        const card = deck.hand[i];
        if (card.cost > player.energy) continue;
        const score = card.power;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      if (bestIndex >= 0) {
        const card = deck.hand[bestIndex];
        const choice = card.id === 'reckoning-scale' && player.faith < player.maxFaith * 0.4 ? 'heal' : 'damage';
        combat.playCard(bestIndex, { choice });
        played = true;
      }
    }
    if (combat.over) break;

    // A memory-shard boss reforms once at 0 Faith; sever the tether with an
    // Anchor (sacrificing one hand card) the first time that happens.
    if (combat instanceof BossCombat && !combat.anchorUsed && combat.enemy.faith < combat.enemy.maxFaith && deck.hand.length > 1) {
      combat.anchor(deck.hand.length - 1, deck.hand[0]);
    }

    if (!combat.over) combat.endPlayerTurn();
  }
}

function main() {
  const player = new Vessel({ name: 'The Vessel', maxFaith: 50 });
  const deck = new Deck(createStarterDeck());
  const map = generateRunMap({
    floorCount: 6,
    nodesPerFloor: 4,
    restChance: 0.22,
    enemyPool: ENEMY_ROSTER,
    bossFactory: createDyingGod,
    miniBossFactory: createBrokenAcolyte,
  });
  const run = new Run({ map, player, log: console.log });
  const narrative = new NarrativeEngine({ shards: createShardPool(), threshold: 3, log: console.log });

  console.log(`${player.name} (Faith ${player.faith}/${player.maxFaith}) begins the descent.`);

  while (!run.over) {
    const options = run.availableNodes();
    const node = run.enterNode(options[0].id);
    narrative.revealNext();

    if (node.type === NODE_TYPES.REST) {
      run.restAtCurrentNode();
      continue;
    }

    const enemy = node.enemyFactory();
    const CombatClass = node.type === NODE_TYPES.BOSS ? BossCombat : Combat;
    const combat = new CombatClass({ player, deck, enemy, log: console.log });
    console.log(`[Art: ${enemy.art}]`);
    autoPlay(combat, deck, player);
    run.completeCurrentNode({ victory: combat.result === 'win' });
  }

  console.log(`Run result: ${run.result} (${narrative.revealed.length} memory shards recovered)`);
}

main();
