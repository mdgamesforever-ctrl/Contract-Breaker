// A pool of story fragments ("memory shards"). `about` links a shard to the
// fight/node it recontextualizes once enough shards have been collected.
export function createShardPool() {
  return [
    {
      id: 'shard-origin-1',
      text: 'A flicker: the Vessel remembers holding a name it can no longer speak.',
      about: 'origin',
    },
    {
      id: 'shard-acolyte-1',
      text: 'The Broken Acolyte once knelt at the same altar as you.',
      about: 'broken-acolyte',
    },
    {
      id: 'shard-origin-2',
      text: 'Every "victory" carves another piece from the dying god.',
      about: 'origin',
    },
    {
      id: 'shard-acolyte-2',
      text: 'The Acolyte was not corrupted by the god -- it was corrupted by you.',
      about: 'broken-acolyte',
    },
    {
      id: 'shard-boss-1',
      text: 'The thing you march toward at the end is wearing your own face.',
      about: 'boss',
    },
    {
      id: 'shard-anchor-1',
      text: 'Anchoring does not restore a card. It steals a memory from the god to spare it.',
      about: 'anchor',
    },
  ];
}
