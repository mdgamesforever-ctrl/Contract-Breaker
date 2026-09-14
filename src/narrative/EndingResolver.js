// Resolves which of the game's 3-5 endings a completed run earns, from a
// plain summary of run state -- no engine coupling, so it's trivial to
// test in isolation (mirrors NarrativeEngine's constructor-plus-plain-
// methods shape rather than reaching back into Run/Combat itself).
//
// Gated by exactly the dimensions the story cares about: whether the run
// ended in victory or defeat, how many memory shards were collected,
// whether Mercy was chosen on each boss encountered (the final Dying God,
// and the mid-run Broken Acolyte when that node was on the player's path),
// and how much Faith remained at the very end.

export const ENDING = Object.freeze({
  NAMES_UNSPOKEN: 'names-unspoken',
  LONG_MERCY: 'long-mercy',
  VESSEL_ASCENDS: 'vessel-ascends',
  HOLLOW_VICTORY: 'hollow-victory',
  TETHER_HOLDS: 'tether-holds',
});

// A boss's mercy choice is 'kill', 'mercy', or null (that boss was never
// reached/resolved on this run -- e.g. the map path skipped the mid-run
// Broken Acolyte entirely, or the run ended before reaching it).
const NAMES_UNSPOKEN_SHARD_THRESHOLD = 5;
const TETHER_HOLDS_SHARD_THRESHOLD = 4;
const HOLLOW_VICTORY_FAITH_RATIO = 0.5;

const ENDING_TEXT = {
  [ENDING.NAMES_UNSPOKEN]: {
    title: 'Names Unspoken, Remembered',
    text: [
      'You remembered enough to know better, and chose mercy anyway, twice.',
      'The god fades still broken, still dying, but it dies knowing its own name one more time,',
      'and so does the Acolyte kneeling beside it.',
      'Nothing is undone. Something, for once, is not made worse.',
    ].join(' '),
  },
  [ENDING.LONG_MERCY]: {
    title: 'The Long Mercy',
    text: [
      'You could have finished it. You chose not to.',
      'The god does not thank you; it can no longer hold a thought that long.',
      'But it is allowed to end on its own terms, at its own pace, unconsumed.',
      'You walk back out of the Shard Network carrying nothing you took by force.',
    ].join(' '),
  },
  [ENDING.VESSEL_ASCENDS]: {
    title: 'The Vessel Ascends',
    text: [
      'The last tether snaps. What is left of the god pours into the shape that was carved to hold it,',
      'and the shape does not refuse.',
      'You are standing where the throne was.',
      'You are beginning to understand why it was always empty before you sat down.',
    ].join(' '),
  },
  [ENDING.HOLLOW_VICTORY]: {
    title: 'A Hollow Victory',
    text: [
      'The god is gone. You are still standing, barely; more debt than Vessel by the end,',
      'held together by whatever you did not have to spend.',
      'Something has been won. It is hard, afterward, to remember what.',
    ].join(' '),
  },
  [ENDING.TETHER_HOLDS]: {
    title: 'The Tether Holds',
    highRecallText: [
      'Your Faith breaks before the god’s does.',
      'But you had already remembered almost everything: who sent you, what it cost, whose face waited at the end.',
      'The next Vessel will not start from nothing.',
      'That is not the same as winning.',
    ].join(' '),
    lowRecallText: [
      'Your Faith breaks before the god’s does.',
      'The descent ends here, mostly unremembered, one more attempt folded into all the ones before it.',
      'Somewhere, another Vessel is already being carved.',
    ].join(' '),
  },
};

export class EndingResolver {
  // `shardsCollected`: number of memory shards revealed this run.
  // `mercyChoices`: { dyingGod: 'kill'|'mercy'|null, acolyte: 'kill'|'mercy'|null }.
  // `finalFaith`/`maxFaith`: the player's Faith at the moment the run ended.
  resolve({ victory, shardsCollected = 0, mercyChoices = {}, finalFaith = 0, maxFaith = 1 }) {
    const dyingGodMercy = mercyChoices.dyingGod === 'mercy';
    const acolyteMercy = mercyChoices.acolyte === 'mercy';
    const acolyteEncountered = mercyChoices.acolyte != null;
    const faithRatio = maxFaith > 0 ? finalFaith / maxFaith : 0;

    if (!victory) {
      const highRecall = shardsCollected >= TETHER_HOLDS_SHARD_THRESHOLD;
      return {
        id: ENDING.TETHER_HOLDS,
        title: ENDING_TEXT[ENDING.TETHER_HOLDS].title,
        text: highRecall ? ENDING_TEXT[ENDING.TETHER_HOLDS].highRecallText : ENDING_TEXT[ENDING.TETHER_HOLDS].lowRecallText,
      };
    }

    let id;
    if (dyingGodMercy && (acolyteMercy || !acolyteEncountered) && shardsCollected >= NAMES_UNSPOKEN_SHARD_THRESHOLD) {
      id = ENDING.NAMES_UNSPOKEN;
    } else if (dyingGodMercy) {
      id = ENDING.LONG_MERCY;
    } else if (faithRatio >= HOLLOW_VICTORY_FAITH_RATIO) {
      id = ENDING.VESSEL_ASCENDS;
    } else {
      id = ENDING.HOLLOW_VICTORY;
    }

    return { id, title: ENDING_TEXT[id].title, text: ENDING_TEXT[id].text };
  }
}
