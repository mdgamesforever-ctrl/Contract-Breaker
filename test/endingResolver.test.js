import test from 'node:test';
import assert from 'node:assert/strict';
import { EndingResolver, ENDING } from '../src/narrative/EndingResolver.js';

test('defeat resolves to The Tether Holds, with different text for high vs low shard recall', () => {
  const resolver = new EndingResolver();

  const highRecall = resolver.resolve({ victory: false, shardsCollected: 6 });
  assert.equal(highRecall.id, ENDING.TETHER_HOLDS);
  assert.equal(highRecall.title, 'The Tether Holds');
  assert.match(highRecall.text, /already remembered almost everything/);

  const lowRecall = resolver.resolve({ victory: false, shardsCollected: 1 });
  assert.equal(lowRecall.id, ENDING.TETHER_HOLDS);
  assert.notEqual(lowRecall.text, highRecall.text);
  assert.match(lowRecall.text, /mostly unremembered/);
});

test('defeat is always The Tether Holds regardless of mercy choices or Faith', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: false,
    shardsCollected: 10,
    mercyChoices: { dyingGod: 'mercy', acolyte: 'mercy' },
    finalFaith: 0,
    maxFaith: 50,
  });
  assert.equal(result.id, ENDING.TETHER_HOLDS);
});

test('victory + mercy on both bosses + high shard count resolves to Names Unspoken, Remembered', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 5,
    mercyChoices: { dyingGod: 'mercy', acolyte: 'mercy' },
    finalFaith: 10,
    maxFaith: 50,
  });
  assert.equal(result.id, ENDING.NAMES_UNSPOKEN);
});

test('Names Unspoken is also reachable if the Acolyte was never encountered at all (path skipped it)', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 5,
    mercyChoices: { dyingGod: 'mercy', acolyte: null },
    finalFaith: 10,
    maxFaith: 50,
  });
  assert.equal(result.id, ENDING.NAMES_UNSPOKEN);
});

test('victory + mercy on the Dying God but NOT enough shards falls back to The Long Mercy', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 2,
    mercyChoices: { dyingGod: 'mercy', acolyte: 'mercy' },
    finalFaith: 10,
    maxFaith: 50,
  });
  assert.equal(result.id, ENDING.LONG_MERCY);
});

test('victory + mercy on the Dying God but the Acolyte was killed (not spared) falls back to The Long Mercy', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 8,
    mercyChoices: { dyingGod: 'mercy', acolyte: 'kill' },
    finalFaith: 10,
    maxFaith: 50,
  });
  assert.equal(result.id, ENDING.LONG_MERCY);
});

test('victory + kill on the Dying God with strong Faith remaining resolves to The Vessel Ascends', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 1,
    mercyChoices: { dyingGod: 'kill', acolyte: null },
    finalFaith: 30,
    maxFaith: 50, // 60% remaining
  });
  assert.equal(result.id, ENDING.VESSEL_ASCENDS);
});

test('victory + kill on the Dying God with Faith nearly spent resolves to A Hollow Victory', () => {
  const resolver = new EndingResolver();
  const result = resolver.resolve({
    victory: true,
    shardsCollected: 1,
    mercyChoices: { dyingGod: 'kill', acolyte: null },
    finalFaith: 5,
    maxFaith: 50, // 10% remaining
  });
  assert.equal(result.id, ENDING.HOLLOW_VICTORY);
});

test('the Vessel Ascends / Hollow Victory split is gated exactly at the 50% Faith-remaining boundary', () => {
  const resolver = new EndingResolver();
  const atBoundary = resolver.resolve({
    victory: true,
    mercyChoices: { dyingGod: 'kill' },
    finalFaith: 25,
    maxFaith: 50, // exactly 50%
  });
  assert.equal(atBoundary.id, ENDING.VESSEL_ASCENDS, 'exactly 50% should count as "strong enough"');

  const justBelow = resolver.resolve({
    victory: true,
    mercyChoices: { dyingGod: 'kill' },
    finalFaith: 24,
    maxFaith: 50,
  });
  assert.equal(justBelow.id, ENDING.HOLLOW_VICTORY);
});

test('every ending has a non-empty, distinct title and text', () => {
  const resolver = new EndingResolver();
  const scenarios = [
    { victory: false, shardsCollected: 5 },
    { victory: false, shardsCollected: 0 },
    { victory: true, mercyChoices: { dyingGod: 'mercy', acolyte: 'mercy' }, shardsCollected: 6 },
    { victory: true, mercyChoices: { dyingGod: 'mercy' }, shardsCollected: 0 },
    { victory: true, mercyChoices: { dyingGod: 'kill' }, finalFaith: 50, maxFaith: 50 },
    { victory: true, mercyChoices: { dyingGod: 'kill' }, finalFaith: 1, maxFaith: 50 },
  ];

  const seen = new Set();
  for (const scenario of scenarios) {
    const result = resolver.resolve(scenario);
    assert.ok(result.id, 'ending must have an id');
    assert.ok(result.title && result.title.length > 0, 'ending must have a title');
    assert.ok(result.text && result.text.length > 0, 'ending must have flavor text');
    seen.add(result.id);
  }
  // The 6 scenarios above are deliberately chosen to hit all 5 distinct endings.
  assert.equal(seen.size, 5);
});
