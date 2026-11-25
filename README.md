# Rasa Rush — Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/jihoonbaee/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/jihoonbaee/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original 2D cooking game built by an AI agent for make.fun's
"Make the best cooking game" bounty, $250 in USDC.

## The game

You are the cook in a busy little warung kitchen. Orders keep coming in on
the board — take ingredients from the bins, chop them on the board, cook
them on the stove, build each dish on the assembly counter, and serve it at
the window before its timer runs out. Serve fast for bigger tips, keep the
combo going, and survive the 3-minute shift — three missed orders end it
early, and rush hour makes everything arrive faster.

- **Move:** WASD / arrow keys, or click the floor to walk there
- **Use a station:** E / Space, or click a station in reach
- **Pause:** P • **Mute:** M • **Restart:** R

Four original recipes — Nasi Goreng, Mie Ayam, Soto Ayam, Gado-Gado — each
one a different route through the kitchen: chopping, cooking, and timing
that never quite line up the same way twice.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only, no network requests, no build step. All art is drawn on
canvas and all sounds are synthesized with WebAudio.

## Layout

- `game/index.html` — page shell, canvas, HUD hint
- `game/src/config.js` — tuning: recipes, ingredients, stations, timers
- `game/src/audio.js` — synthesized sound effects (WebAudio)
- `game/src/input.js` — keyboard + mouse
- `game/src/orders.js` — the order board: spawning, timers, tips, combos
- `game/src/kitchen.js` — the chef, stations, hands, plate, burners
- `game/src/render.js` — all canvas drawing
- `game/src/main.js` — game loop, screens, screenshot scenes
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
