# Asset TODO

Every placeholder asset added in the content-expansion pass, and what it
should eventually be replaced with. "Placeholder" here means: generated
programmatically (SVG shapes/text, or synthesized audio tones), not
AI-generated or hand-drawn art/music in the game's established dark-fantasy
style (see `assets/ART_MANIFEST.md` for that style guide).

Regenerate the placeholder SVGs (if you tweak labels/colors) with:

```
node scripts/generate-placeholder-art.mjs
```

Never hand-edit the generated `.svg` files directly -- edit the script.

## Placeholder card art (10 files, `assets/cards/`)

All are 300x420 SVGs: solid color background, the card's name, and a
"PLACEHOLDER ART" label baked into the image itself.

| File | Card | Real art should depict |
|---|---|---|
| placeholder_card_21_whispering_ash.svg | Whispering Ash | A cheap card-draw ritual -- ash/embers swirling into visible motes of memory |
| placeholder_card_22_gravebound_oath.svg | Gravebound Oath | An execution-style finishing blow -- a grave oath sworn over a near-dead foe |
| placeholder_card_23_ashen_ward.svg | Ashen Ward | A defensive rite -- an ash-grey ward/barrier forming around the Vessel |
| placeholder_card_24_pact_of_embers.svg | Pact of Embers | A cheap burn/fire ritual -- embers bound into a small, sustained flame |
| placeholder_card_25_unbroken_choir.svg | Unbroken Choir | A pure healing hymn -- unseen voices restoring the Vessel's Faith |
| placeholder_card_26_faithbreakers_gambit.svg | Faithbreaker's Gambit | A reckless, free (0-cost) strike paid for in the Vessel's own Faith |
| placeholder_card_27_cinder_wake.svg | Cinder Wake | Damage that scales with sacrificed/exiled cards -- ashes of what was Anchored away |
| placeholder_card_28_hollow_chant.svg | Hollow Chant | An anti-corruption cleansing chant, reducing wear on a decaying card |
| placeholder_card_29_bound_in_silence.svg | Bound in Silence | A reckless, self-corrupting heavy strike -- chains fraying as it's cast |
| placeholder_card_30_the_last_ember.svg | The Last Ember | Damage + self-heal scaling with the discard pile -- warmth drawn from spent memories |

## Placeholder enemy art (5 files, `assets/enemies/`)

All are 320x320 SVGs, same placeholder style.

| File | Enemy | Real art should depict |
|---|---|---|
| placeholder_enemy_06_the_gilded_liar.svg | The Gilded Liar | A gilded, armored defender that shields itself before striking |
| placeholder_enemy_07_the_sunderer.svg | The Sunderer | A blade-focused enemy that tears down the Vessel's shields before hitting |
| placeholder_enemy_08_the_famine.svg | The Famine | A gaunt, starved horror that hits harder the weaker its prey already is |
| placeholder_enemy_09_the_verdict.svg | The Verdict | A judge-like figure that sustains itself turn over turn as it attacks |
| placeholder_enemy_10_the_chorus_unbound.svg | The Chorus Unbound | A many-voiced horror that unravels the Vessel's deck as it fights |

## Placeholder boss art (1 file, `assets/boss/`)

420x420 SVG.

| File | Boss | Real art should depict |
|---|---|---|
| placeholder_boss_02_the_broken_acolyte.svg | The Broken Acolyte | The mid-run boss referenced in the existing narrative shards ("The Broken Acolyte once knelt at the same altar as you") -- a corrupted, mirror-image acolyte who spreads corruption onto the Vessel's cards and feeds on it |

## Placeholder background art (2 files, `assets/backgrounds/`)

960x540 SVGs.

| File | Used for | Real art should depict |
|---|---|---|
| placeholder_bg_04_the_hollow_sanctum.svg | Rest node background | A safe, dim sanctuary distinct from the fight/boss arenas -- where the Vessel rests and recovers Faith |
| placeholder_bg_05_the_acolytes_hollow.svg | Mid-run mini-boss arena background | A ruined, intimate arena for The Broken Acolyte fight -- distinct from the final boss's grand "Bled Throne" |

## Placeholder audio (synthesized, no files yet)

`web-build/audio.js` implements a lightweight `AudioManager` using the
browser's Web Audio API (`OscillatorNode` + `GainNode` envelopes) to
synthesize simple tones/drones at runtime -- there are no `.mp3`/`.ogg`
files yet, by design, so nothing large had to be fabricated or faked as
real recorded audio. Every placeholder sound is generated in
`web-build/audio.js`; swap each one out by replacing the corresponding
`play...()` method's oscillator calls with `new Audio('assets/audio/...')`
once real files exist, and update `capacitor.config.json`/`web-build`
asset copying accordingly.

| Placeholder (synthesized) | Real audio should be |
|---|---|
| Title screen music (slow, low drone pad) | A somber, ambient title theme establishing the "dying god" tone |
| Map screen music (sparse, mysterious pad) | Exploration/ambient music for the node map |
| Combat screen music (mid-tempo pulsing tone) | A tense combat loop |
| Boss screen music (faster, lower pulsing tone) | An intense final-boss theme, distinct from the mid-run mini-boss |
| Card-played SFX (short plucked tone) | A card-flip/whoosh sound effect |
| Damage-taken SFX (short noisy thud) | An impact/hit sound effect |
| Victory SFX (rising arpeggio) | A triumphant musical sting |
| Defeat SFX (descending tone) | A somber defeat sting |
| Anchor SFX (low resonant tone) | A heavy, ritualistic "sacrifice" sound |
| Graft SFX (bright chime) | A magical "attach/bind" chime |

## Already-real (not placeholders, for reference)

The original 16 cards' base art, the 4 repurposed variant-art cards
(`card_16`-`card_18`, `card_20`, now standalone cards instead of
corrupted-state art), the 5 original enemies, the original boss (The Dying
God), and the 3 original backgrounds were all generated to the game's
established art style already -- see `assets/ART_MANIFEST.md`. Only the
expansion content listed above is placeholder.
