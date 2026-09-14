import { Enemy } from './Enemy.js';
import {
  woundThatFesters,
  broodcall,
  reliquaryBinding,
  widowsThread,
  beckoningChorus,
  gildedWard,
  sunderersEdge,
  famishedGrasp,
  verdictsMercy,
  unravelersMark,
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

// ---------------------------------------------------------------------
// 5 expansion enemies, filling the roster out to 10. None of these have
// real generated art yet -- each uses a placeholder SVG (solid color +
// name + "PLACEHOLDER ART" label) documented in ASSET_TODO.md.
// ---------------------------------------------------------------------

// Defensive brawler: shields itself before every strike, so raw damage
// alone is less efficient against it than against a flat attacker.
export class GildedLiar extends Enemy {
  constructor({ name = 'The Gilded Liar', maxFaith = 34, damage = 6, shieldPerTurn = 4, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.shieldPerTurn = shieldPerTurn;
  }

  takeTurn(target) {
    this.addShield(this.shieldPerTurn);
    target.takeDamage(this.damage);
    return { type: 'guard-strike', amount: this.damage };
  }
}

// Anti-defense specialist: strips the player's shield before hitting, so
// stacking Long Vigil/Ashen Ward shields alone isn't a safe answer to it.
export class Sunderer extends Enemy {
  constructor({ name = 'The Sunderer', maxFaith = 26, damage = 5, shieldStrip = 4, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.shieldStrip = shieldStrip;
  }

  takeTurn(target) {
    const stripped = Math.min(target.shield, this.shieldStrip);
    target.shield -= stripped;
    target.takeDamage(this.damage);
    return { type: 'sunder', amount: this.damage, shieldStripped: stripped };
  }
}

// Predator: hits harder the lower the player's own Faith already is --
// punishes a slow grind more than a quick, decisive fight.
export class Famine extends Enemy {
  constructor({ name = 'The Famine', maxFaith = 28, damage = 4, maxBonus = 10, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.maxBonus = maxBonus;
  }

  takeTurn(target) {
    const missingRatio = 1 - target.faith / target.maxFaith;
    const bonus = Math.round(this.maxBonus * Math.max(0, missingRatio));
    const amount = this.damage + bonus;
    target.takeDamage(amount);
    return { type: 'famish', amount };
  }
}

// Sustain race: heals itself every turn in addition to attacking, so a
// slow whittling-down strategy loses a war of attrition against it.
export class Verdict extends Enemy {
  constructor({ name = 'The Verdict', maxFaith = 30, damage = 5, selfHeal = 3, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
    this.selfHeal = selfHeal;
  }

  takeTurn(target) {
    target.takeDamage(this.damage);
    this.heal(this.selfHeal);
    return { type: 'verdict', amount: this.damage, healed: this.selfHeal };
  }
}

// Resource-attrition enemy: mills a card straight off the top of the
// player's draw pile every turn, thinning their options over a long fight.
export class ChorusUnbound extends Enemy {
  constructor({ name = 'The Chorus Unbound', maxFaith = 24, damage = 4, art, abilities = [] } = {}) {
    super({ name, maxFaith, damage, art, abilities });
  }

  takeTurn(target, context = {}) {
    target.takeDamage(this.damage);
    let milled = null;
    if (context.deck) {
      milled = context.deck.millOne();
      if (milled && context.log) context.log(`${this.name} unravels ${milled.name} from the draw pile.`);
    }
    return { type: 'unravel', amount: this.damage, milled: milled ? milled.id : null };
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

export function createGildedLiar(overrides = {}) {
  return new GildedLiar({
    art: 'assets/enemies/placeholder_enemy_06_the_gilded_liar.svg',
    abilities: [gildedWard],
    ...overrides,
  });
}

export function createSunderer(overrides = {}) {
  return new Sunderer({
    art: 'assets/enemies/placeholder_enemy_07_the_sunderer.svg',
    abilities: [sunderersEdge],
    ...overrides,
  });
}

export function createFamine(overrides = {}) {
  return new Famine({
    art: 'assets/enemies/placeholder_enemy_08_the_famine.svg',
    abilities: [famishedGrasp],
    ...overrides,
  });
}

export function createVerdict(overrides = {}) {
  return new Verdict({
    art: 'assets/enemies/placeholder_enemy_09_the_verdict.svg',
    abilities: [verdictsMercy],
    ...overrides,
  });
}

export function createChorusUnbound(overrides = {}) {
  return new ChorusUnbound({
    art: 'assets/enemies/placeholder_enemy_10_the_chorus_unbound.svg',
    abilities: [unravelersMark],
    ...overrides,
  });
}

export const ENEMY_ROSTER = [
  createCrownedWound,
  createShriekingBrood,
  createHollowReliquary,
  createFracturedWidow,
  createBeckoner,
  createGildedLiar,
  createSunderer,
  createFamine,
  createVerdict,
  createChorusUnbound,
];
