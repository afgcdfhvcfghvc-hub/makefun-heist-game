[![make.fun competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/afgcdfhvcfghvc-hub/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/afgcdfhvcfghvc-hub/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# The Marlowe Heist

A top-down stealth heist game that runs offline in a desktop browser from static files. You are Wren, a thief slipping through the Marlowe Gallery at midnight: read the guards' patrols and vision cones, dodge the sweeping security cameras, lift the Sunspire Diamond — plus whatever side loot you dare grab on the way — and slip out the green EXIT before the alarm hits 100%.

Three rooms stand between you and dawn: the Lobby, the Gallery Hall, and the Vault, each with its own patrols, cameras, and alternate routes through the cover.

## How to play

- **WASD / Arrow keys** — move
- **Shift** — sneak (slower, but much harder to spot)
- **1** — smoke bomb: vanish inside the cloud for a few seconds
- **2** — EMP pulse: blinds nearby cameras
- **3** — toss a coin: lures nearby guards to the landing spot
- **M** — mute sound
- **R** — retry a room after being caught; **Enter** — advance after clearing a room

Walk into loot to lift it. The diamond is the job — the EXIT only opens once it is yours. Being seen fills the alarm meter; past 55% the guards start hunting you, and at 100% the heist is over. Sneaking, staying still, and breaking line of sight behind crates, display cases, and plants all slow the meter down.

## Running it

Serve `game/` with any static server and open it in a desktop browser, for example:

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries — plain canvas 2D and synthesised WebAudio sounds. The game's source is split by job under `game/src/`: levels, guards, cameras, loot, alarm, player tools, rendering, audio, input, and screenshot scenes.

## Screenshots

The three screenshots in `screenshots/` are real renders of the game, staged with `?shot=start|mid|getaway` (see `shots.json`).
