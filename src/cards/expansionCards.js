import { Card } from './Card.js';

// 10 further expansion cards, filling out the pool to ~30 unique mechanical
// cards alongside the 16 originals and the 4 repurposed variants in
// starterCards.js. None of these have real generated art yet -- each uses a
// placeholder SVG (solid color + name + "PLACEHOLDER ART" label, generated
// by scripts/generate-placeholder-art.mjs) documented in ASSET_TODO.md.

export function createWhisperingAsh() {
  return new Card({
    id: 'whispering-ash',
    name: 'Whispering Ash',
    cost: 1,
    power: 0,
    type: 'skill',
    art: 'assets/cards/placeholder_card_21_whispering_ash.svg',
    effect: ({ deck }) => deck.draw(2),
  });
}

export function createGraveboundOath({ power = 10, executeThreshold = 0.25 } = {}) {
  return new Card({
    id: 'gravebound-oath',
    name: 'Gravebound Oath',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_22_gravebound_oath.svg',
    effect: ({ enemy, card }) => {
      const executing = enemy.faith <= enemy.maxFaith * executeThreshold;
      enemy.takeDamage(executing ? card.power * 2 : card.power);
    },
  });
}

export function createAshenWard({ power = 10 } = {}) {
  return new Card({
    id: 'ashen-ward',
    name: 'Ashen Ward',
    cost: 2,
    power,
    type: 'skill',
    art: 'assets/cards/placeholder_card_23_ashen_ward.svg',
    effect: ({ self, card }) => self.addShield(card.power),
  });
}

export function createPactOfEmbers({ power = 3 } = {}) {
  return new Card({
    id: 'pact-of-embers',
    name: 'Pact of Embers',
    cost: 1,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_24_pact_of_embers.svg',
    effect: ({ enemy, card }) => enemy.applyBurn(card.power),
  });
}

export function createUnbrokenChoir({ healAmount = 10 } = {}) {
  return new Card({
    id: 'unbroken-choir',
    name: 'Unbroken Choir',
    cost: 2,
    power: 0,
    type: 'skill',
    art: 'assets/cards/placeholder_card_25_unbroken_choir.svg',
    effect: ({ self }) => self.heal(healAmount),
  });
}

export function createFaithbreakersGambit({ power = 4, selfCost = 2 } = {}) {
  return new Card({
    id: 'faithbreakers-gambit',
    name: "Faithbreaker's Gambit",
    cost: 0,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_26_faithbreakers_gambit.svg',
    effect: ({ self, enemy, card }) => {
      enemy.takeDamage(card.power);
      self.takeDamage(selfCost);
    },
  });
}

export function createCinderWake({ power = 2, exileBonus = 4 } = {}) {
  return new Card({
    id: 'cinder-wake',
    name: 'Cinder Wake',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_27_cinder_wake.svg',
    effect: ({ enemy, deck, card }) => enemy.takeDamage(card.power + deck.exile.length * exileBonus),
  });
}

export function createHollowChant({ cleanseAmount = 2 } = {}) {
  return new Card({
    id: 'hollow-chant',
    name: 'Hollow Chant',
    cost: 1,
    power: 0,
    type: 'skill',
    art: 'assets/cards/placeholder_card_28_hollow_chant.svg',
    effect: ({ deck }) => {
      const candidates = deck.allCards().filter((c) => c.wear > 0 && !c.corrupted);
      if (candidates.length === 0) return;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      target.wear = Math.max(0, target.wear - cleanseAmount);
    },
  });
}

export function createBoundInSilence({ power = 9 } = {}) {
  return new Card({
    id: 'bound-in-silence',
    name: 'Bound in Silence',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_29_bound_in_silence.svg',
    effect: ({ enemy, card }) => {
      enemy.takeDamage(card.power);
      card.applyWear(1);
    },
  });
}

export function createTheLastEmber({ power = 8 } = {}) {
  return new Card({
    id: 'last-ember',
    name: 'The Last Ember',
    cost: 3,
    power,
    type: 'attack',
    art: 'assets/cards/placeholder_card_30_the_last_ember.svg',
    effect: ({ self, enemy, deck, card }) => {
      enemy.takeDamage(card.power);
      self.heal(deck.discardPile.length);
    },
  });
}

export function createExpansionCards() {
  return [
    createWhisperingAsh(),
    createGraveboundOath(),
    createAshenWard(),
    createPactOfEmbers(),
    createUnbrokenChoir(),
    createFaithbreakersGambit(),
    createCinderWake(),
    createHollowChant(),
    createBoundInSilence(),
    createTheLastEmber(),
  ];
}
