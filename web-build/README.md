# Contract Breaker -- Browser Playtest Build

A standalone front-end for playtesting Contract Breaker visually. No build
step, no npm install, no server required.

## Running it

Just double-click `index.html` (or open it via your browser's File > Open),
and play. It works over `file://` directly, including all card/enemy/boss
art and backgrounds.

If your browser ever blocks local images for some other reason, any static
file server rooted at this folder works too, e.g. `npx serve .` or
`python3 -m http.server`, then visit the printed localhost URL -- but this
shouldn't be necessary.

## What this is

- `index.html` -- page structure and all CSS (inline).
- `engine.bundle.js` -- the real game engine (Card, Deck, Vessel, Combat,
  BossCombat, RunMap, Run, NarrativeEngine, the starter cards/enemies/boss),
  auto-generated from `../src/**` by `../scripts/bundle-web-engine.mjs`.
  It is **not** hand-written or reimplemented -- the bundler only strips
  `import`/`export` syntax so the same code can run as a classic (non-module)
  script over `file://`, which sidesteps Chrome's CORS block on cross-file
  ES module imports under the file protocol. No game logic was changed.
- `app.js` -- hand-written UI code: renders the map/combat/end screens and
  wires clicks to the engine's public API (`combat.playCard`, `combat.anchor`,
  `combat.graft`, `run.enterNode`, etc). This is the only game-facing code
  that isn't a straight port of `src/`.
- `assets/` -- a copy of the project's `assets/` folder (cards, enemies,
  boss, backgrounds).

## After changing the engine

If you edit anything under `src/`, regenerate the bundle from the project
root:

```
node scripts/bundle-web-engine.mjs
```

(or `npm run build:web`). This keeps `web-build/` and `assets/` in sync;
re-copy `assets/` only if you've added or renamed art files.
