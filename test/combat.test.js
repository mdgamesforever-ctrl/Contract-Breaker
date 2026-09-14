import test from 'node:test';
import assert from 'node:assert/strict';
import { Vessel } from '../src/game/Vessel.js';
import { Enemy } from '../src/game/Enemy.js';
import { Combat } from '../src/game/Combat.js';
import { Deck } from '../src/cards/Deck.js';
import { Card } from '../src/cards/Card.js';

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

test('a full combat round: draw, play cards, resolve effects, enemy turn', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 3 });
  const deck = new Deck([makeStrike(), makeStrike(), makeStrike()]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 100, damage: 5 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  combat.startPlayerTurn();
  assert.equal(combat.turn, 1);
  assert.equal(player.energy, 3);
  assert.equal(deck.hand.length, 3);

  combat.playCard(0);
  assert.equal(enemy.faith, 90, 'effect should resolve damage to enemy');
  assert.equal(player.energy, 2, 'energy should be spent');
  assert.equal(deck.hand.length, 2);
  assert.equal(deck.discardPile.length, 1);

  combat.endPlayerTurn();
  assert.equal(deck.hand.length, 0, 'remaining hand should be discarded');
  assert.equal(player.faith, 25, 'enemy turn should have damaged the player');
  assert.equal(combat.over, false);
});

test('playCard rejects insufficient energy or an empty hand slot', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 1 });
  const deck = new Deck([makeStrike()]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 100, damage: 5 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  combat.startPlayerTurn();
  player.energy = 0;
  assert.throws(() => combat.playCard(0), /Not enough energy/);
  assert.throws(() => combat.playCard(5), /No card at hand index/);
});

test('combat declares a win when the enemy Faith reaches zero', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 3 });
  const deck = new Deck([makeStrike(50)]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 20, damage: 5 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  combat.startPlayerTurn();
  combat.playCard(0);

  assert.equal(combat.over, true);
  assert.equal(combat.result, 'win');
  assert.equal(enemy.faith, 0);
});

test('combat declares a loss when the player Faith reaches zero', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 3, energyPerTurn: 3 });
  const deck = new Deck([makeStrike(1)]);
  const enemy = new Enemy({ name: 'Foe', maxFaith: 100, damage: 99 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  combat.startPlayerTurn();
  combat.playCard(0);
  combat.endPlayerTurn();

  assert.equal(combat.over, true);
  assert.equal(combat.result, 'loss');
  assert.equal(player.faith, 0);
});
