import test from 'node:test';
import assert from 'node:assert/strict';
import { Card } from '../src/cards/Card.js';
import { Deck } from '../src/cards/Deck.js';
import { Vessel } from '../src/game/Vessel.js';
import { Enemy } from '../src/game/Enemy.js';
import { Combat } from '../src/game/Combat.js';
import { emberSting, hollowMending } from '../src/game/abilities.js';

function silentLog() {}

function makeStrike(power = 10) {
  return new Card({
    id: 'strike',
    name: 'Strike',
    cost: 1,
    power,
    effect: ({ enemy, card }) => enemy.takeDamage(card.power),
  });
}

test('grafting an ability from a defeated enemy permanently modifies a card (power)', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const strike = makeStrike(10);
  const deck = new Deck([strike]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 5, damage: 1, abilities: [emberSting] });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  deck.hand = [strike];
  deck.drawPile = [];
  combat.startPlayerTurn();
  combat.playCard(0); // defeats the enemy (10 damage vs 5 Faith)
  assert.equal(combat.result, 'win');

  combat.graft(enemy.abilities[0], strike);

  assert.equal(strike.graftedAbilities.length, 1);
  assert.equal(strike.graftedAbilities[0], emberSting);
  assert.equal(strike.basePower, 12, 'Ember Sting should permanently add 2 power');
  assert.equal(strike.power, 12);
});

test('grafting an ability that wraps the effect function composes with the original effect', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  player.takeDamage(5); // so healing from the grafted ability is observable
  const strike = makeStrike(10);
  const deck = new Deck([strike]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 5, damage: 1, abilities: [hollowMending] });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  deck.hand = [strike];
  deck.drawPile = [];
  combat.startPlayerTurn();
  combat.playCard(0);
  assert.equal(combat.result, 'win');

  combat.graft(enemy.abilities[0], strike);

  const faithBefore = player.faith;
  const enemyTwo = new Enemy({ name: 'Foe 2', maxFaith: 100 });
  strike.effect({ self: player, enemy: enemyTwo, card: strike });

  assert.equal(enemyTwo.faith, 100 - strike.power, 'original damage effect still applies');
  assert.equal(player.faith, faithBefore + 1, 'grafted heal effect also applies');
});

test('grafting before defeating the enemy is rejected', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const strike = makeStrike(1);
  const deck = new Deck([strike]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 100, abilities: [emberSting] });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  assert.throws(() => combat.graft(emberSting, strike), /Can only graft/);
});
