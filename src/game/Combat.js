export const HAND_SIZE = 5;

// Fraction of an enemy's maxFaith at which a Mercy-eligible fight pauses
// for the kill-vs-mercy choice, per Combat's `allowMercy` option.
export const MERCY_THRESHOLD_RATIO = 0.12;

// Drives a single combat encounter between a player Vessel (with a Deck)
// and an enemy Vessel. Console-output only; `log` is injectable for tests.
export class Combat {
  constructor({ player, deck, enemy, handSize = HAND_SIZE, log = console.log, allowMercy = false, mercyThreshold = null }) {
    this.player = player;
    this.deck = deck;
    this.enemy = enemy;
    this.handSize = handSize;
    this.log = log;
    this.turn = 0;
    this.over = false;
    this.result = null; // 'win' | 'loss' | 'mercy'

    // Cards played this turn, in order (oldest first) -- lets effects like
    // "bonus if played first" or "echo the last card played" see history.
    this.cardsPlayedThisTurn = [];
    // Set by cards like "Banner of the Broken Oath"; consumed by the next play.
    this.freeNextCard = false;

    // Mercy: a real, explicit kill-vs-spare choice for boss-tier fights.
    // When allowMercy is set, the fight pauses (pendingMercy) the moment the
    // enemy's Faith would cross mercyThreshold, holding it there instead of
    // letting it fall to (or past) 0 -- see _maybeTriggerMercy() and
    // resolveMercy(). Regular (non-boss) fights simply never set allowMercy,
    // so isDefeated()/win checks behave exactly as before for them.
    this.allowMercy = allowMercy;
    this.mercyThreshold = mercyThreshold ?? Math.max(1, Math.round(enemy.maxFaith * MERCY_THRESHOLD_RATIO));
    this.pendingMercy = false;
    this.mercyResolved = false;
    this.mercyGranted = false;
  }

  startPlayerTurn() {
    if (this.over) return;
    this.turn += 1;
    this.cardsPlayedThisTurn = [];
    this.player.startTurnEnergy();
    const drawn = this.deck.draw(this.handSize - this.deck.hand.length);
    this.log(
      `-- Turn ${this.turn}: ${this.player.name} has ${this.player.energy} energy, ` +
        `draws ${drawn.length} card(s) (hand: ${this.deck.hand.length}) --`
    );
  }

  // Plays the card at `handIndex` from the player's hand against the enemy.
  // `options` may carry a `choice` for cards with more than one mode (e.g.
  // "The Reckoning Scale").
  playCard(handIndex, options = {}) {
    if (this.over) throw new Error('Combat is already over');
    if (this.pendingMercy) throw new Error('Resolve the mercy choice before playing another card');
    const card = this.deck.hand[handIndex];
    if (!card) throw new Error(`No card at hand index ${handIndex}`);

    const free = this.freeNextCard;
    const effectiveCost = free ? 0 : card.cost;
    if (effectiveCost > this.player.energy) {
      throw new Error(`Not enough energy to play ${card.name}`);
    }

    this.player.energy -= effectiveCost;
    if (free) this.freeNextCard = false;
    this.deck.removeFromHand(handIndex);
    card.play({
      self: this.player,
      enemy: this.enemy,
      deck: this.deck,
      combat: this,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      ...options,
    });
    this.deck.discardPile.push(card);
    this.cardsPlayedThisTurn.push(card);

    this.log(
      `${this.player.name} plays ${card.name}${card.corrupted ? ' (corrupted)' : ''}` +
        `${free ? ' (free)' : ''} -> ${this.enemy.name} Faith: ${this.enemy.faith}/${this.enemy.maxFaith}`
    );

    this._maybeTriggerMercy();
    this._checkWinLoss();
    return card;
  }

  // Sacrifices the hand card at `sacrificeIndex` (removing it from play
  // permanently) to reset `targetCard`'s wear/corruption back to pristine.
  anchor(sacrificeIndex, targetCard) {
    if (this.over) throw new Error('Combat is already over');
    const sacrifice = this.deck.exileFromHand(sacrificeIndex);
    if (!sacrifice) throw new Error(`No card at hand index ${sacrificeIndex} to sacrifice`);
    targetCard.resetWear();
    this.log(`${this.player.name} anchors: sacrifices ${sacrifice.name} to restore ${targetCard.name}`);
    return sacrifice;
  }

  endPlayerTurn() {
    if (this.over || this.pendingMercy) return;
    // Cards still sitting in hand were not played this turn.
    for (const card of this.deck.hand) card.onTurnPassedUnplayed?.();
    this.deck.discardHand();
    this.enemy.tickBurn(this.log);
    this._maybeTriggerMercy();
    this._checkWinLoss();
    if (!this.over) this.enemyTurn();
  }

  enemyTurn() {
    if (this.over || this.enemy.isDefeated()) return;
    const action = this.enemy.takeTurn(this.player, { deck: this.deck, log: this.log });
    this.log(
      `${this.enemy.name} attacks for ${action.amount} -> ` +
        `${this.player.name} Faith: ${this.player.faith}/${this.player.maxFaith}`
    );
    this._checkWinLoss();
  }

  // Permanently attaches a defeated enemy's ability onto one of the
  // player's cards. Only legal once the enemy has been beaten.
  graft(ability, targetCard) {
    if (this.result !== 'win') {
      throw new Error('Can only graft an ability after defeating the enemy');
    }
    targetCard.graft(ability);
    this.log(`${this.player.name} grafts "${ability.name}" onto ${targetCard.name}`);
    return targetCard;
  }

  // If this fight allows Mercy and the enemy's Faith has fallen to (or past)
  // mercyThreshold, holds it there and pauses the fight (pendingMercy) for
  // an explicit resolveMercy() call, instead of letting it continue toward
  // 0 and end the fight as an ordinary win. Fires at most once per combat
  // (mercyResolved gates it after the player has answered).
  _maybeTriggerMercy() {
    if (!this.allowMercy || this.mercyResolved || this.pendingMercy) return;
    if (this.enemy.faith <= this.mercyThreshold) {
      // Hold it exactly at the threshold, whatever the triggering blow
      // actually rolled it down to (a soft graze at 5/6 and a 999-damage
      // overkill both land here the same way).
      this.enemy.faith = this.mercyThreshold;
      this.pendingMercy = true;
      this.log(`${this.enemy.name} is broken and at your mercy. Kill, or spare it?`);
    }
  }

  // Resolves a pending Mercy choice. 'kill' delivers the finishing blow and
  // lets the fight conclude normally (still subject to e.g. the final
  // boss's tether/reform rule in BossCombat). 'mercy' ends the fight
  // immediately with result 'mercy': the enemy survives, broken, at
  // mercyThreshold Faith -- no further damage, no loot/graft opportunity
  // (app.js only offers Graft when result === 'win').
  resolveMercy(choice) {
    if (this.over) throw new Error('Combat is already over');
    if (!this.pendingMercy) throw new Error('No mercy choice is pending');
    if (choice !== 'kill' && choice !== 'mercy') throw new Error(`Unknown mercy choice: ${choice}`);

    this.pendingMercy = false;
    this.mercyResolved = true;

    if (choice === 'mercy') {
      this.mercyGranted = true;
      this.over = true;
      this.result = 'mercy';
      this.log(`${this.player.name} shows mercy. ${this.enemy.name} is spared, broken but alive.`);
    } else {
      this.log(`${this.player.name} delivers the finishing blow.`);
      this.enemy.takeDamage(this.enemy.faith);
      this._checkWinLoss();
    }
    return this.result;
  }

  _checkWinLoss() {
    if (this.over) return;
    if (this.player.isDefeated()) {
      this.over = true;
      this.result = 'loss';
      this.log(`${this.player.name}'s Faith is broken. Defeat.`);
    } else if (this.enemy.isDefeated()) {
      this.over = true;
      this.result = 'win';
      this.log(`${this.enemy.name} has been defeated!`);
    }
  }
}
