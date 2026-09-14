export const HAND_SIZE = 5;

// Drives a single combat encounter between a player Vessel (with a Deck)
// and an enemy Vessel. Console-output only; `log` is injectable for tests.
export class Combat {
  constructor({ player, deck, enemy, handSize = HAND_SIZE, log = console.log }) {
    this.player = player;
    this.deck = deck;
    this.enemy = enemy;
    this.handSize = handSize;
    this.log = log;
    this.turn = 0;
    this.over = false;
    this.result = null; // 'win' | 'loss'
  }

  startPlayerTurn() {
    if (this.over) return;
    this.turn += 1;
    this.player.startTurnEnergy();
    const drawn = this.deck.draw(this.handSize - this.deck.hand.length);
    this.log(
      `-- Turn ${this.turn}: ${this.player.name} has ${this.player.energy} energy, ` +
        `draws ${drawn.length} card(s) (hand: ${this.deck.hand.length}) --`
    );
  }

  // Plays the card at `handIndex` from the player's hand against the enemy.
  playCard(handIndex) {
    if (this.over) throw new Error('Combat is already over');
    const card = this.deck.hand[handIndex];
    if (!card) throw new Error(`No card at hand index ${handIndex}`);
    if (card.cost > this.player.energy) {
      throw new Error(`Not enough energy to play ${card.name}`);
    }

    this.player.energy -= card.cost;
    this.deck.removeFromHand(handIndex);
    card.play({ self: this.player, enemy: this.enemy, deck: this.deck });
    this.deck.discardPile.push(card);

    this.log(
      `${this.player.name} plays ${card.name}${card.corrupted ? ' (corrupted)' : ''} ` +
        `-> ${this.enemy.name} Faith: ${this.enemy.faith}/${this.enemy.maxFaith}`
    );

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
    if (this.over) return;
    this.deck.discardHand();
    this._checkWinLoss();
    if (!this.over) this.enemyTurn();
  }

  enemyTurn() {
    if (this.over || this.enemy.isDefeated()) return;
    const action = this.enemy.takeTurn(this.player);
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
