import { Card } from './Card.js';

// The 16 unique starter cards from the art manifest. Cards 16-18 and 20 in
// the manifest are visual variants of an existing card rather than separate
// mechanical cards -- see the design note at the bottom of this file for why.

export function createSeveredVow({ power = 6 } = {}) {
  return new Card({
    id: 'severed-vow',
    name: 'Severed Vow',
    cost: 3,
    power,
    type: 'attack',
    decayWhenUnplayed: true,
    art: 'assets/cards/card_01_severed_vow.png',
    effect: ({ enemy, card }) => enemy.takeDamage(card.power),
  });
}

export function createReckoningScale({ power = 8 } = {}) {
  return new Card({
    id: 'reckoning-scale',
    name: 'The Reckoning Scale',
    cost: 2,
    power,
    type: 'skill',
    art: 'assets/cards/card_02_the_reckoning_scale.png',
    // choice: 'heal' | 'damage' (defaults to damage if unspecified)
    effect: ({ self, enemy, card, choice }) => {
      if (choice === 'heal') self.heal(card.power);
      else enemy.takeDamage(card.power);
    },
  });
}

export function createLastScreamOfTheGod({ power = 18, faithCost = 5 } = {}) {
  return new Card({
    id: 'last-scream',
    name: 'Last Scream of the God',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_03_last_scream_of_the_god.png',
    corruptedArt: 'assets/cards/card_20_last_scream_of_the_god_variant.png',
    effect: ({ self, enemy, card }) => {
      self.takeDamage(faithCost);
      enemy.takeDamage(card.power);
    },
  });
}

export function createHiddenBlade({ power = 6, bonusMultiplier = 2 } = {}) {
  return new Card({
    id: 'hidden-blade',
    name: 'The Hidden Blade',
    cost: 1,
    power,
    type: 'attack',
    art: 'assets/cards/card_04_the_hidden_blade.png',
    effect: ({ enemy, card, cardsPlayedThisTurn = [] }) => {
      const playedFirst = cardsPlayedThisTurn.length === 0;
      enemy.takeDamage(playedFirst ? card.power * bonusMultiplier : card.power);
    },
  });
}

export function createTideThatRemembers({ power = 9 } = {}) {
  return new Card({
    id: 'tide-that-remembers',
    name: 'Tide That Remembers',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_05_tide_that_remembers.png',
    effect: ({ enemy, card }) => enemy.takeDamage(card.power),
  });
}

export function createOathkeepersLastStand({ power = 7, lowFaithMultiplier = 1.75 } = {}) {
  return new Card({
    id: 'oathkeepers-last-stand',
    name: "Oathkeeper's Last Stand",
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_06_oathkeepers_last_stand.png',
    effect: ({ self, enemy, card }) => {
      const lowFaith = self.faith <= self.maxFaith * 0.5;
      enemy.takeDamage(lowFaith ? Math.round(card.power * lowFaithMultiplier) : card.power);
    },
  });
}

export function createWrathOfTheStormKing({ power = 7, chainPower = 5 } = {}) {
  return new Card({
    id: 'wrath-of-the-storm-king',
    name: 'Wrath of the Storm King',
    cost: 3,
    power,
    type: 'attack',
    art: 'assets/cards/card_07_wrath_of_the_storm_king.png',
    effect: ({ enemy, card }) => {
      enemy.takeDamage(card.power);
      enemy.takeDamage(chainPower);
    },
  });
}

export function createTheLongVigil({ power = 5 } = {}) {
  return new Card({
    id: 'long-vigil',
    name: 'The Long Vigil',
    cost: 1,
    power,
    type: 'skill',
    art: 'assets/cards/card_08_the_long_vigil.png',
    effect: ({ self, card }) => self.addShield(card.power),
  });
}

export function createMirrorOfWhatWas({ power = 3 } = {}) {
  return new Card({
    id: 'mirror-of-what-was',
    name: 'Mirror of What Was',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_09_mirror_of_what_was.png',
    effect: (ctx) => {
      const { enemy, card, cardsPlayedThisTurn = [] } = ctx;
      enemy.takeDamage(card.power);
      const last = cardsPlayedThisTurn[cardsPlayedThisTurn.length - 1];
      if (last && last.id !== card.id) last.effect({ ...ctx, card: last });
    },
  });
}

export function createWeepingCrown({ power = 4, corruptedBonus = 2 } = {}) {
  return new Card({
    id: 'weeping-crown',
    name: 'The Weeping Crown',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_10_the_weeping_crown.png',
    effect: ({ enemy, deck, card }) => {
      const corruptedCount = deck.allCards().filter((c) => c.corrupted).length;
      enemy.applyBurn(card.power + corruptedCount * corruptedBonus);
    },
  });
}

export function createSoulAscending() {
  return new Card({
    id: 'soul-ascending',
    name: 'Soul Ascending',
    cost: 3,
    power: 0,
    type: 'skill',
    art: 'assets/cards/card_11_soul_ascending.png',
    effect: ({ self, deck }) => {
      if (deck.hand.length > 0) {
        const index = Math.floor(Math.random() * deck.hand.length);
        deck.exileFromHand(index);
      }
      self.heal(self.maxFaith);
    },
  });
}

export function createFieldOfTheFallen({ power = 2 } = {}) {
  return new Card({
    id: 'field-of-the-fallen',
    name: 'Field of the Fallen',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_12_field_of_the_fallen.png',
    effect: ({ enemy, deck, card }) => enemy.takeDamage(card.power + deck.discardPile.length),
  });
}

export function createBannerOfTheBrokenOath() {
  return new Card({
    id: 'banner-of-the-broken-oath',
    name: 'Banner of the Broken Oath',
    cost: 1,
    power: 0,
    type: 'skill',
    art: 'assets/cards/card_13_banner_of_the_broken_oath.png',
    effect: ({ combat }) => {
      if (combat) combat.freeNextCard = true;
    },
  });
}

export function createTitanOfTheDeep({ power = 15 } = {}) {
  return new Card({
    id: 'titan-of-the-deep',
    name: 'Titan of the Deep',
    cost: 3,
    power,
    type: 'attack',
    art: 'assets/cards/card_14_titan_of_the_deep.png',
    corruptedArt: 'assets/cards/card_18_titan_of_the_deep_variant.png',
    effect: ({ enemy, card }) => {
      enemy.takeDamage(card.power);
      card.corrupt();
    },
  });
}

export function createRiteOfTheBleedingAltar({ power = 11, faithCost = 3 } = {}) {
  return new Card({
    id: 'rite-of-the-bleeding-altar',
    name: 'Rite of the Bleeding Altar',
    cost: 1,
    power,
    type: 'attack',
    art: 'assets/cards/card_15_rite_of_the_bleeding_altar.png',
    corruptedArt: 'assets/cards/card_16_blood_communion_variant.png',
    effect: ({ self, enemy, card }) => {
      self.takeDamage(faithCost);
      enemy.takeDamage(card.power);
    },
  });
}

export function createVacantThrone() {
  return new Card({
    id: 'vacant-throne',
    name: 'The Vacant Throne',
    cost: 1,
    power: 0,
    type: 'skill',
    art: 'assets/cards/card_19_the_vacant_throne.png',
    effect: ({ deck }) => deck.draw(1),
  });
}

// Returns one copy of each of the 16 starter cards.
export function createStarterDeck() {
  return [
    createSeveredVow(),
    createReckoningScale(),
    createLastScreamOfTheGod(),
    createHiddenBlade(),
    createTideThatRemembers(),
    createOathkeepersLastStand(),
    createWrathOfTheStormKing(),
    createTheLongVigil(),
    createMirrorOfWhatWas(),
    createWeepingCrown(),
    createSoulAscending(),
    createFieldOfTheFallen(),
    createBannerOfTheBrokenOath(),
    createTitanOfTheDeep(),
    createRiteOfTheBleedingAltar(),
    createVacantThrone(),
  ];
}

// Design note on the manifest's "variant" art files (16-18, 20):
//
// card_16_blood_communion_variant.png and card_17_blood_rite_variant.png
// are alt art for Rite of the Bleeding Altar (#15); card_18 is alt art for
// Titan of the Deep (#14); card_20 is alt art for Last Scream of the God
// (#3). All four are wired as `corruptedArt` on their base card (shown once
// the card corrupts) rather than as four additional playable cards. Keeping
// them as separate cards would have produced near-duplicate effects with
// different flavor art -- diluting the 20-slot pool without adding
// mechanical depth. As alt/corrupted-state art they instead reinforce the
// decay system that's already central to the game. 16 unique mechanical
// cards is still a healthy starter-deck size, so this didn't leave the pool
// short on variety. (card_17 "Blood Rite" is the second variant for #15;
// since a card only has one `corruptedArt` slot, it's kept in the assets
// folder as a second alt-art option for future use but isn't wired up yet.)
