import { Enemy } from './Enemy.js';
import {
  woundThatFesters,
  broodcall,
  reliquaryBinding,
  widowsThread,
  beckoningChorus,
} from './enemyAbilities.js';

// The five starter enemies, each with a distinct attack pattern. `rng` is
// injectable on the ones that roll randomness, for deterministic tests.

// Heavy tank: telegraphs a big hit by coiling on the turn before it lands.
export class CrownedWound extends Enemy {
  constructor({ name = 'The Crowned Wound', maxFaith = 32, coilDamage = 3, strikeDamage = 11, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage: strikeDamage, art, abilities });
    this.coilDamage = coilDamage;
    this.strikeDamage = strikeDamage;
    this.coiling = false;
  }

  takeTurn(target) {
    if (!this.coiling) {
      this.coiling = true;
      target.takeDamage(this.coilDamage);
      return { type: 'coil', amount: this.coilDamage };
    }
    this.coiling = false;
    target.takeDamage(this.strikeDamage);
    return { type: 'strike', amount: this.strikeDamage };
  }
}

// Summoner: its brood grows every turn it survives, raising its damage.
export class ShriekingBrood extends Enemy {
  constructor({ name = 'Shrieking Brood', maxFaith = 24, damage = 3, growth = 2, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.growth = growth;
  }

  takeTurn(target) {
    const amount = this.damage;
    target.takeDamage(amount);
    this.damage += this.growth;
    return { type: 'swarm', amount };
  }
}

// Elite: deals bonus damage proportional to how many of the player's cards
// have already corrupted -- punishes letting the deck decay.
export class HollowReliquary extends Enemy {
  constructor({ name = 'The Hollow Reliquary', maxFaith = 30, damage = 4, bonusPerCorrupted = 3, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.bonusPerCorrupted = bonusPerCorrupted;
  }

  takeTurn(target, context = {}) {
    const corruptedCount = context.deck ? context.deck.allCards().filter((c) => c.corrupted).length : 0;
    const amount = this.damage + corruptedCount * this.bonusPerCorrupted;
    target.takeDamage(amount);
    return { type: 'punish-decay', amount };
  }
}

// Debuffer: a lighter attacker that also forces extra wear onto a random
// card in the player's deck, accelerating corruption.
export class FracturedWidow extends Enemy {
  constructor({ name = 'The Fractured Widow', maxFaith = 22, damage = 3, wearInflicted = 1, art, abilities = [], rng = Math.random } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.wearInflicted = wearInflicted;
    this.rng = rng;
  }

  takeTurn(target, context = {}) {
    target.takeDamage(this.damage);
    const pool = context.deck ? context.deck.allCards() : [];
    if (pool.length > 0) {
      const card = pool[Math.floor(this.rng() * pool.length)];
      card.applyWear(this.wearInflicted);
      if (context.log) context.log(`${this.name} frays ${card.name}, hastening its decay.`);
    }
    return { type: 'fray', amount: this.damage };
  }
}

// Fast/erratic: several small, randomized hits instead of one big swing.
export class Beckoner extends Enemy {
  constructor({ name = 'The Beckoner', maxFaith = 20, minHit = 1, maxHit = 3, minHits = 2, maxHits = 4, art, abilities = [], rng = Math.random } = {}) {
    super({ name, maxFaith, damage: minHit, art, abilities });
    this.minHit = minHit;
    this.maxHit = maxHit;
    this.minHits = minHits;
    this.maxHits = maxHits;
    this.rng = rng;
  }

  takeTurn(target) {
    const hitCount = this.minHits + Math.floor(this.rng() * (this.maxHits - this.minHits + 1));
    let total = 0;
    for (let i = 0; i < hitCount; i++) {
      const hit = this.minHit + Math.floor(this.rng() * (this.maxHit - this.minHit + 1));
      target.takeDamage(hit);
      total += hit;
    }
    return { type: 'flurry', amount: total, hits: hitCount };
  }
}

export function createCrownedWound(overrides = {}) {
  return new CrownedWound({
    art: 'assets/enemies/enemy_01_the_crowned_wound.png',
    abilities: [woundThatFesters],
    ...overrides,
  });
}

export function createShriekingBrood(overrides = {}) {
  return new ShriekingBrood({
    art: 'assets/enemies/enemy_02_shrieking_brood.png',
    abilities: [broodcall],
    ...overrides,
  });
}

export function createHollowReliquary(overrides = {}) {
  return new HollowReliquary({
    art: 'assets/enemies/enemy_03_the_hollow_reliquary.png',
    abilities: [reliquaryBinding],
    ...overrides,
  });
}

export function createFracturedWidow(overrides = {}) {
  return new FracturedWidow({
    art: 'assets/enemies/enemy_04_the_fractured_widow.png',
    abilities: [widowsThread],
    ...overrides,
  });
}

export function createBeckoner(overrides = {}) {
  return new Beckoner({
    art: 'assets/enemies/enemy_05_the_beckoner.png',
    abilities: [beckoningChorus],
    ...overrides,
  });
}

export const ENEMY_ROSTER = [
  createCrownedWound,
  createShriekingBrood,
  createHollowReliquary,
  createFracturedWidow,
  createBeckoner,
];
