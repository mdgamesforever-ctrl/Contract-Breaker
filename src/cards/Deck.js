function shuffle(cards, rng = Math.random) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Manages the draw / hand / discard / exile piles for a set of Cards.
export class Deck {
  constructor(cards, { rng = Math.random } = {}) {
    this.rng = rng;
    this.drawPile = shuffle(cards, rng);
    this.discardPile = [];
    this.hand = [];
    this.exile = [];
  }

  // Reshuffles the discard pile into the draw pile (in place).
  reshuffleDiscardIntoDraw() {
    this.drawPile.push(...shuffle(this.discardPile, this.rng));
    this.discardPile = [];
  }

  // Draws up to `count` cards into hand, reshuffling discard as needed.
  draw(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.reshuffleDiscardIntoDraw();
      }
      const card = this.drawPile.shift();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  // Discards a card from the top of the draw pile without playing it
  // (used by the "Unstable" corruption drawback).
  millOne() {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length === 0) return null;
      this.reshuffleDiscardIntoDraw();
    }
    const card = this.drawPile.shift();
    if (card) this.discardPile.push(card);
    return card;
  }

  // Moves the entire hand to the discard pile (end of turn cleanup).
  discardHand() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }

  // Removes and returns the card at `index` in hand, or null if absent.
  removeFromHand(index) {
    if (index < 0 || index >= this.hand.length) return null;
    return this.hand.splice(index, 1)[0];
  }

  // Permanently removes a card from play (used when Anchor sacrifices it).
  exileFromHand(index) {
    const card = this.removeFromHand(index);
    if (card) this.exile.push(card);
    return card;
  }

  // All cards still in circulation (hand + draw + discard), excluding exile.
  allCards() {
    return [...this.hand, ...this.drawPile, ...this.discardPile];
  }

  findById(cardId) {
    return this.allCards().find((c) => c.id === cardId);
  }
}
