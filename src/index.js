import { Vessel } from './game/Vessel.js';
import { Enemy } from './game/Enemy.js';
import { Combat } from './game/Combat.js';
import { Deck } from './cards/Deck.js';
import { createStandardDeck } from './cards/library.js';
import { emberSting } from './game/abilities.js';

function main() {
  const player = new Vessel({ name: 'The Vessel', maxFaith: 40 });
  const deck = new Deck(createStandardDeck());
  const enemy = new Enemy({
    name: 'Broken Acolyte',
    maxFaith: 25,
    damage: 4,
    abilities: [emberSting],
  });

  const combat = new Combat({ player, deck, enemy });

  console.log(`${player.name} (Faith ${player.faith}) enters combat with ${enemy.name} (Faith ${enemy.faith}).`);

  while (!combat.over) {
    combat.startPlayerTurn();
    while (deck.hand.length > 0 && !combat.over) {
      const index = deck.hand.findIndex((card) => card.cost <= player.energy);
      if (index === -1) break;
      combat.playCard(index);
    }
    if (!combat.over) combat.endPlayerTurn();
  }

  if (combat.result === 'win') {
    const target = deck.findById('strike');
    if (target) combat.graft(enemy.abilities[0], target);
  }

  console.log(`Combat result: ${combat.result}`);
}

main();
