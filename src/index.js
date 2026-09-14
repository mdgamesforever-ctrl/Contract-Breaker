import { Vessel } from './game/Vessel.js';
import { Enemy } from './game/Enemy.js';
import { Combat } from './game/Combat.js';
import { MemoryShardBoss, BossCombat } from './game/BossCombat.js';
import { Deck } from './cards/Deck.js';
import { createStandardDeck } from './cards/library.js';
import { emberSting } from './game/abilities.js';
import { generateRunMap, NODE_TYPES } from './run/RunMap.js';
import { Run } from './run/Run.js';
import { NarrativeEngine } from './narrative/NarrativeEngine.js';
import { createShardPool } from './narrative/shards.js';

// Auto-plays every affordable card each turn until the fight ends. Used by
// the demo so the run can walk itself end-to-end from the console.
function autoPlay(combat, deck, player) {
  while (!combat.over) {
    combat.startPlayerTurn();
    while (deck.hand.length > 0 && !combat.over) {
      const index = deck.hand.findIndex((card) => card.cost <= player.energy);
      if (index === -1) break;
      combat.playCard(index);
    }
    if (combat.over) break;

    // A memory-shard boss reforms once at 0 Faith; sever the tether with an
    // Anchor (sacrificing one hand card) the first time that happens.
    if (combat instanceof BossCombat && !combat.anchorUsed && combat.enemy.faith < combat.enemy.maxFaith) {
      const target = deck.hand[1] ? deck.findById(deck.hand[1].id) : deck.allCards()[0];
      if (deck.hand.length > 1 && target) combat.anchor(0, target);
    }

    if (!combat.over) combat.endPlayerTurn();
  }
}

function main() {
  const player = new Vessel({ name: 'The Vessel', maxFaith: 50 });
  const deck = new Deck(createStandardDeck());
  const map = generateRunMap({ floorCount: 3, nodesPerFloor: 2, restChance: 0.3 });
  const run = new Run({ map, player, log: console.log });
  const narrative = new NarrativeEngine({ shards: createShardPool(), threshold: 3, log: console.log });

  console.log(`${player.name} (Faith ${player.faith}/${player.maxFaith}) begins the run.`);

  while (!run.over) {
    const options = run.availableNodes();
    const node = run.enterNode(options[0].id);
    narrative.revealNext();

    if (node.type === NODE_TYPES.REST) {
      run.restAtCurrentNode();
      continue;
    }

    if (node.type === NODE_TYPES.BOSS) {
      const boss = new MemoryShardBoss({
        name: 'The Dying God',
        maxFaith: 30,
        damage: 3,
        abilities: [emberSting],
      });
      const combat = new BossCombat({ player, deck, enemy: boss, log: console.log });
      autoPlay(combat, deck, player);
      run.completeCurrentNode({ victory: combat.result === 'win' });
      continue;
    }

    const enemy = new Enemy({ name: `Broken Acolyte (floor ${node.floor})`, maxFaith: 18, damage: 4 });
    const combat = new Combat({ player, deck, enemy, log: console.log });
    autoPlay(combat, deck, player);
    run.completeCurrentNode({ victory: combat.result === 'win' });
  }

  console.log(`Run result: ${run.result} (${narrative.revealed.length} memory shards recovered)`);
}

main();
