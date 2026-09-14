import test from 'node:test';
import assert from 'node:assert/strict';
import { NarrativeEngine } from '../src/narrative/NarrativeEngine.js';
import { shuffle } from '../src/utils/shuffle.js';

function silentLog() {}

function shards() {
  return [
    { id: 's1', text: 'One', about: 'origin' },
    { id: 's2', text: 'Two', about: 'acolyte' },
    { id: 's3', text: 'Three', about: 'origin' },
    { id: 's4', text: 'Four', about: 'boss' },
  ];
}

// A constant rng close to 1 makes the Fisher-Yates shuffle a no-op, so the
// pool keeps its original ["s1","s2","s3","s4"] order -- useful for tests
// that need a predictable reveal sequence.
const IDENTITY_RNG = () => 0.9999;

test('shards are revealed in the order the injected rng shuffles them into', () => {
  const rng = () => 0.4;
  const expectedOrder = shuffle(shards(), rng).map((s) => s.id);
  const engine = new NarrativeEngine({ shards: shards(), rng, threshold: 10, log: silentLog });

  const actualOrder = [];
  let shard;
  while ((shard = engine.revealNext())) actualOrder.push(shard.id);

  assert.deepEqual(actualOrder, expectedOrder);
});

test('different rngs produce different reveal orders from the same pool', () => {
  const engineA = new NarrativeEngine({ shards: shards(), rng: IDENTITY_RNG, threshold: 10, log: silentLog });
  const engineB = new NarrativeEngine({ shards: shards(), rng: () => 0.4, threshold: 10, log: silentLog });

  assert.notDeepEqual(
    engineA.pool.map((s) => s.id),
    engineB.pool.map((s) => s.id)
  );
});

test('revealNext hands out shards one at a time and returns null once exhausted', () => {
  const engine = new NarrativeEngine({ shards: shards(), threshold: 10, rng: IDENTITY_RNG, log: silentLog });

  const first = engine.revealNext();
  assert.equal(first.id, 's1');
  assert.equal(engine.remaining, 3);

  engine.revealNext();
  engine.revealNext();
  engine.revealNext();
  assert.equal(engine.remaining, 0);
  assert.equal(engine.revealNext(), null);
});

test('a flag system tracks exactly which shards have been seen', () => {
  const engine = new NarrativeEngine({ shards: shards(), threshold: 10, rng: IDENTITY_RNG, log: silentLog });

  assert.equal(engine.hasSeen('s1'), false);
  engine.revealNext(); // s1
  assert.equal(engine.hasSeen('s1'), true);
  assert.equal(engine.hasSeen('s2'), false);
  assert.equal(engine.hasSeen('s3'), false);
});

test('recontextualization fires exactly once, after the threshold of shards is reached', () => {
  const engine = new NarrativeEngine({ shards: shards(), threshold: 3, rng: IDENTITY_RNG, log: silentLog });

  engine.revealNext(); // s1 (origin)
  assert.equal(engine.recontextualized, false);
  engine.revealNext(); // s2 (acolyte)
  assert.equal(engine.recontextualized, false);
  engine.revealNext(); // s3 (origin) -- crosses the threshold
  assert.equal(engine.recontextualized, true);
  assert.ok(engine.twist);
  assert.equal(engine.twist.type, 'recontextualization');

  // s1, s2, s3 have "about" values origin, acolyte, origin -- deduped.
  assert.deepEqual(engine.twist.affected.sort(), ['acolyte', 'origin']);
  assert.match(engine.twist.message, /acolyte/);
  assert.match(engine.twist.message, /origin/);

  const twistAfterThreshold = engine.twist;
  engine.revealNext(); // s4 -- must not re-trigger or change the twist
  assert.equal(engine.twist, twistAfterThreshold);
});

test('threshold must be a positive number', () => {
  assert.throws(() => new NarrativeEngine({ shards: shards(), threshold: 0 }));
});
