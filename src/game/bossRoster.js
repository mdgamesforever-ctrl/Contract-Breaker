import { MemoryShardBoss } from './BossCombat.js';
import { Enemy } from './Enemy.js';
import { emberSting, hollowMending } from './abilities.js';

export function createDyingGod(overrides = {}) {
  return new MemoryShardBoss({
    name: 'The Dying God',
    maxFaith: 55,
    damage: 6,
    abilities: [emberSting, hollowMending],
    art: 'assets/boss/boss_01_the_dying_god.png',
    ...overrides,
  });
}

// Mirrors' redemption: permanently makes a card wear 1 less per play
// (minimum 0), thematically opposite of the corruption the Acolyte itself
// suffers, and a direct counter-play to its own "corrupt a hand card" turn.
export const mirrorsRedemption = {
  id: 'mirrors-redemption',
  name: "Mirror's Redemption",
  description: "Permanently reduces the card's wear gain by 1 per play (minimum 0).",
  apply: (card) => {
    const originalApplyWear = card.applyWear.bind(card);
    card.applyWear = (amount = 1) => originalApplyWear(Math.max(0, amount - 1));
  },
};

// A mid-run boss with a mechanic deliberately distinct from The Dying God's
// Anchor/tether reform: no reform at all -- a normal Combat (not
// BossCombat) is used for it. Instead, every turn it directly corrupts
// (adds wear to) a random card anywhere in the player's deck, then heals
// itself in proportion to how many of the player's cards are already
// corrupted. That makes letting corruption pile up actively dangerous (it
// fuels the boss's own sustain) without ever locking the fight behind a
// single required Anchor use the way the final boss does.
export class BrokenAcolyte extends Enemy {
  constructor({
    name = 'The Broken Acolyte',
    maxFaith = 40,
    damage = 7,
    wearInflicted = 1,
    healPerCorrupted = 2,
    art,
    abilities = [],
    rng = Math.random,
  } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.wearInflicted = wearInflicted;
    this.healPerCorrupted = healPerCorrupted;
    this.rng = rng;
  }

  takeTurn(target, context = {}) {
    target.takeDamage(this.damage);

    const pool = context.deck ? context.deck.allCards() : [];
    let corrupted = null;
    if (pool.length > 0) {
      const card = pool[Math.floor(this.rng() * pool.length)];
      card.applyWear(this.wearInflicted);
      corrupted = card.id;
      if (context.log) context.log(`${this.name} corrupts ${card.name}, mirroring its own ruin.`);
    }

    const corruptedCount = context.deck ? context.deck.allCards().filter((c) => c.corrupted).length : 0;
    let healed = 0;
    if (corruptedCount > 0) {
      healed = corruptedCount * this.healPerCorrupted;
      this.heal(healed);
      if (context.log) {
        context.log(`${this.name} draws strength from ${corruptedCount} corrupted memories, healing ${healed}.`);
      }
    }

    return { type: 'ruinous-mirror', amount: this.damage, corrupted, healed };
  }
}

export function createBrokenAcolyte(overrides = {}) {
  return new BrokenAcolyte({
    art: 'assets/boss/placeholder_boss_02_the_broken_acolyte.svg',
    abilities: [mirrorsRedemption],
    ...overrides,
  });
}
