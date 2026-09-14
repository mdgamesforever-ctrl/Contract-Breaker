import { Card } from './Card.js';
import { createExpansionCards } from './expansionCards.js';

// The original 16 unique starter cards from the art manifest, plus (further
// down this file) 4 cards repurposed from what used to be alt-art variants,
// plus 10 more expansion cards in expansionCards.js -- ~30 unique mechanical
// cards in total. See createStarterDeck() at the bottom for the full pool.

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

// ---------------------------------------------------------------------
// The 4 manifest "variant" art files (16-18, 20), now standalone cards.
//
// Earlier these were folded in as `corruptedArt` for Rite of the Bleeding
// Altar (#15, x2), Titan of the Deep (#14), and Last Scream of the God (#3).
// With the card pool expanding well past a 16-card toolkit, they're more
// valuable as four fully independent cards with their own mechanics than as
// alt-art for cards that already have plenty of identity; their old base
// cards fall back to their normal (non-corrupted) art when corrupted, which
// is fine since the purple corrupted-glow border on the card frame already
// signals corruption on its own (see .hand-card.corrupted in index.html).
// ---------------------------------------------------------------------

export function createBloodCommunion({ power = 6, healAmount = 3 } = {}) {
  return new Card({
    id: 'blood-communion',
    name: 'Blood Communion',
    cost: 2,
    power,
    type: 'attack',
    art: 'assets/cards/card_16_blood_communion_variant.png',
    effect: ({ self, enemy, card }) => {
      enemy.takeDamage(card.power);
      self.heal(healAmount);
    },
  });
}

export function createBloodRite({ power = 5, burnBonus = 4 } = {}) {
  return new Card({
    id: 'blood-rite',
    name: 'Blood Rite',
    cost: 1,
    power,
    type: 'attack',
    art: 'assets/cards/card_17_blood_rite_variant.png',
    effect: ({ enemy, card }) => {
      enemy.takeDamage(card.power + (enemy.burn > 0 ? burnBonus : 0));
    },
  });
}

export function createTitansWake({ power = 12 } = {}) {
  return new Card({
    id: 'titans-wake',
    name: "Titan's Wake",
    cost: 3,
    power,
    type: 'attack',
    art: 'assets/cards/card_18_titan_of_the_deep_variant.png',
    effect: ({ enemy, deck, card }) => {
      enemy.takeDamage(card.power);
      const others = deck.hand.filter((c) => c !== card);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        target.applyWear(1);
      }
    },
  });
}

export function createEchoOfTheGod({ power = 5 } = {}) {
  return new Card({
    id: 'echo-of-the-god',
    name: 'Echo of the God',
    cost: 1,
    power,
    type: 'attack',
    art: 'assets/cards/card_20_last_scream_of_the_god_variant.png',
    effect: ({ enemy, deck, card }) => {
      enemy.takeDamage(card.power);
      deck.draw(1);
    },
  });
}

// Returns one copy of every unique mechanical card in the game: the 16
// original starter cards, the 4 cards above (repurposed from what used to
// be alt-art variants), and the 10 further expansion cards in
// expansionCards.js. Despite the name (kept for backward compatibility with
// existing call sites), this is the *entire* card pool, not a subset --
// there's no separate drafting/reward step, so every card in the game is in
// play from turn one of every run.
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
    createBloodCommunion(),
    createBloodRite(),
    createTitansWake(),
    createEchoOfTheGod(),
    ...createExpansionCards(),
  ];
}
