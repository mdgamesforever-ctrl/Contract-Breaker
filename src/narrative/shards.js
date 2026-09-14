// A pool of story fragments ("memory shards"). `about` links a shard to the
// fight/theme it recontextualizes once enough shards have been collected
// (see NarrativeEngine). Only a handful are revealed in any single run (one
// per node entered, and a run only ever visits a handful of nodes), so the
// pool is kept large and varied -- ~20 fragments across six threads of the
// same story -- for replay variety, not because every run sees all of them.
//
// The throughline (deliberately never stated outright in any single shard,
// only assembled by the player across several): the "Vessel" is not a
// separate hero descending into someone else's underworld. It is a piece of
// the Dying God's own unraveling mind, given just enough shape to walk its
// own dissolving memories and decide what survives them. Every "enemy" is a
// memory turned hostile by the god's own decay; every "victory" erases one.
// The Broken Acolyte was a real devotee, broken not by the god but by an
// earlier Vessel -- there have been others, and none of them stayed
// themselves. Anchoring "restores" a card by quietly stealing a memory from
// the god to pay for it. And at the end, wearing the Vessel's own face, is
// the god itself.
export function createShardPool() {
  return [
    // ---- origin: what the Vessel actually is ----
    {
      id: 'shard-origin-1',
      text: 'A flicker: the Vessel remembers holding a name it can no longer speak.',
      about: 'origin',
    },
    {
      id: 'shard-origin-2',
      text: 'Every "victory" carves another piece from the dying god.',
      about: 'origin',
    },
    {
      id: 'shard-origin-3',
      text: "The Vessel was not born. It was carved out of the god's own dying will, given just enough shape to walk.",
      about: 'origin',
    },
    {
      id: 'shard-origin-4',
      text: 'There have been other Vessels before this one. None of them came back as themselves.',
      about: 'origin',
    },

    // ---- broken-acolyte: the mid-run boss's real story ----
    {
      id: 'shard-acolyte-1',
      text: 'The Broken Acolyte once knelt at the same altar as you.',
      about: 'broken-acolyte',
    },
    {
      id: 'shard-acolyte-2',
      text: 'The Acolyte was not corrupted by the god -- it was corrupted by you.',
      about: 'broken-acolyte',
    },
    {
      id: 'shard-acolyte-3',
      text: 'Before it broke, the Acolyte begged the last Vessel to stop. The last Vessel did not stop.',
      about: 'broken-acolyte',
    },
    {
      id: 'shard-acolyte-4',
      text: 'The Acolyte still prays. It no longer remembers what it is praying for, or to whom.',
      about: 'broken-acolyte',
    },

    // ---- boss: the Dying God at the center of the descent ----
    {
      id: 'shard-boss-1',
      text: 'The thing you march toward at the end is wearing your own face.',
      about: 'boss',
    },
    {
      id: 'shard-boss-2',
      text: 'The god did not choose to die. It chose to be eaten slowly, by something it hoped would be kinder than time.',
      about: 'boss',
    },
    {
      id: 'shard-boss-3',
      text: 'Every fight on this descent is a memory the god would rather forget. You are doing it a favor. You are also the reason it is forgetting at all.',
      about: 'boss',
    },
    {
      id: 'shard-boss-4',
      text: 'At the center of everything is a throne with no one sitting in it, because whoever sat there is you.',
      about: 'boss',
    },

    // ---- anchor: what the Anchor mechanic is actually paying for ----
    {
      id: 'shard-anchor-1',
      text: 'Anchoring does not restore a card. It steals a memory from the god to spare it.',
      about: 'anchor',
    },
    {
      id: 'shard-anchor-2',
      text: 'Every anchor is a small mercy and a small theft in the same motion. The god will not remember choosing to give this up.',
      about: 'anchor',
    },
    {
      id: 'shard-anchor-3',
      text: 'You have anchored before, in other attempts, other Vessels. The god has fewer memories left each time -- fewer with each of you.',
      about: 'anchor',
    },

    // ---- mercy: preparing the player for the choice waiting at every boss ----
    {
      id: 'shard-mercy-1',
      text: 'To kill a broken thing is clean. To let it live broken is not mercy -- it is a debt you will not be the one to pay.',
      about: 'mercy',
    },
    {
      id: 'shard-mercy-2',
      text: 'The last Vessel who chose mercy vanished from every memory that came after. Choosing it here may do the same to you.',
      about: 'mercy',
    },
    {
      id: 'shard-mercy-3',
      text: 'Sparing something does not undo what was already taken from it. It only decides who carries the rest.',
      about: 'mercy',
    },

    // ---- corruption: the wear/decay system, in the god's own words ----
    {
      id: 'shard-corruption-1',
      text: 'A corrupted card does not lie. It simply remembers what it cost you to use it so many times.',
      about: 'corruption',
    },
    {
      id: 'shard-corruption-2',
      text: "The god's memories corrupt the same way yours do -- not all at once, but one wound too many, in the same place, again and again.",
      about: 'corruption',
    },
  ];
}
