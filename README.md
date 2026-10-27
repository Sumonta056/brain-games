<div align="center">

# Brain Games 🧠🌱

**Short, friendly brain games to relax and sharpen your mind.**

15 games · about one minute each · no account · no tracking

[![Play now](https://img.shields.io/badge/▶_Play_now-d9466e?style=for-the-badge)](https://YOUR-DEPLOY-URL)

![Nuxt](https://img.shields.io/badge/Nuxt-4-00dc82)
![Vue](https://img.shields.io/badge/Vue-3-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-blue)

[Play now](https://YOUR-DEPLOY-URL) · [Features](#features) · [Games](#the-15-games) · [For developers](#for-developers)

<br>

<img src="docs/screenshots/home.png" alt="Brain Games home page" width="900">

</div>

## Why Brain Games

Most brain-training apps push streaks, ads and sign-ups. Brain Games does not.

Each game takes about one minute. The words are kind. The app never says "Wrong!". It says "It was X. Carry on from there."

Open the site and play. Your progress stays on your device.

## Features

- **15 short games** in 6 categories: Calm, Speed, Words, Memory, Focus and Body.
- **Today's Five.** A new set of 5 games each day.
- **Mood check.** Tell the app how you feel. It suggests games to match.
- **Friendly bands, not grades.** Each result maps to a band. When a band comes from research, the science note names the source. When it does not, the note says it is a Brain Games guide.
- **Streak and best scores.** See them on your profile.
- **Light, dark and auto themes.**
- **Play by keyboard.** Every game works with Enter and Space.
- **Works on phones.** Large touch targets and a bottom tab bar.
- **No account and no tracking.** Progress is saved in your browser only.

## See it in action

<table>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/games.png" alt="All games"><br><sub>Pick from 15 games, filter by category</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/game-ready.png" alt="Game ready screen"><br><sub>Each game starts with a short demo</sub></td>
  </tr>
</table>

<div align="center">
  <img src="docs/screenshots/mobile.png" alt="Brain Games on a phone" width="280"><br>
  <sub>Made for phones too</sub>
</div>

## The 15 games

<table>
  <tr>
    <td align="center" width="33%"><img src="docs/screenshots/games/breath.png" alt="Box breathing"><br><b>Box breathing</b><br><sub>Calm · Breathe with a growing circle for one minute.</sub></td>
    <td align="center" width="33%"><img src="docs/screenshots/games/pairs.png" alt="Memory pairs"><br><b>Memory pairs</b><br><sub>Calm · Flip cards and find matching pairs.</sub></td>
    <td align="center" width="33%"><img src="docs/screenshots/games/odd.png" alt="Odd colour out"><br><b>Odd colour out</b><br><sub>Calm · Spot the tile with a slightly different shade.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/games/math.png" alt="Mental math"><br><b>Mental math</b><br><sub>Speed · Sums get harder the faster you go.</sub></td>
    <td align="center"><img src="docs/screenshots/games/reaction.png" alt="Reaction time"><br><b>Reaction time</b><br><sub>Speed · Tap the moment the box turns green.</sub></td>
    <td align="center"><img src="docs/screenshots/games/serial7.png" alt="Serial sevens"><br><b>Serial sevens</b><br><sub>Speed · Count down by 7 from a random number.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/games/backward.png" alt="Backward spelling"><br><b>Backward spelling</b><br><sub>Words · See a word, then spell it in reverse.</sub></td>
    <td align="center"><img src="docs/screenshots/games/category.png" alt="Category challenge"><br><b>Category challenge</b><br><sub>Words · Name things in a category before time runs out.</sub></td>
    <td align="center"><img src="docs/screenshots/games/words.png" alt="Word sprint"><br><b>Word sprint</b><br><sub>Words · Write as many words as you can from one letter.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/games/digits.png" alt="Digit span"><br><b>Digit span</b><br><sub>Memory · Remember a growing string of numbers.</sub></td>
    <td align="center"><img src="docs/screenshots/games/nback.png" alt="N-back"><br><b>N-back</b><br><sub>Memory · Spot a letter that matches the one a few steps ago.</sub></td>
    <td align="center"><img src="docs/screenshots/games/sequence.png" alt="Sequence memory"><br><b>Sequence memory</b><br><sub>Memory · Repeat the pattern of lit squares.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/games/schulte.png" alt="Schulte table"><br><b>Schulte table</b><br><sub>Focus · Find 1 to 25 in a scrambled grid.</sub></td>
    <td align="center"><img src="docs/screenshots/games/stroop.png" alt="Stroop colours"><br><b>Stroop colours</b><br><sub>Focus · Pick the ink colour, not the word.</sub></td>
    <td align="center"><img src="docs/screenshots/games/hand.png" alt="Other hand day"><br><b>Other hand day</b><br><sub>Body · Do today's tasks with your other hand.</sub></td>
  </tr>
</table>

## Your progress and privacy

- Progress is saved in your browser (`localStorage`, key `bgarden`).
- The app has no server, no account and no tracking.
- To reset, clear the site data in your browser.

---

## For developers

Do you want to run Brain Games on your own machine or add a game? Start here.

### Run locally

Node 24 is required. The version is pinned in `.nvmrc`.

```bash
git clone https://github.com/Sumonta056/brain-games.git
cd brain-games
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`.

### Scripts

| Command                                   | What it does                           |
| ----------------------------------------- | -------------------------------------- |
| `npm run dev`                             | Start the dev server on port 3000.     |
| `npm run build`                           | Make a production build.               |
| `npm run generate`                        | Make a static site.                    |
| `npm run preview`                         | Serve the production build.            |
| `npm run typecheck`                       | Check types with `vue-tsc`.            |
| `npm run lint` / `npm run lint:fix`       | Run ESLint, with or without fixes.     |
| `npm run format` / `npm run format:check` | Run Prettier, with or without writes.  |
| `npm test`                                | Run all specs once.                    |
| `npm run test:watch`                      | Run specs in watch mode.               |
| `npm run test:coverage`                   | Run specs and write a coverage report. |

### How it works

Nuxt 4, Vue 3 and TypeScript, with Tailwind v4. The app is client-only (`ssr: false`). The design tokens are in `app/assets/css/tokens.css`.

```
app/
  pages/              index, games/index, games/[id], profile
  components/
    app/              AppNav, GameIcon
    home/             HomeHero, DailyFive, MoodCheck, BentoGrid, GameTile
    game/             GameShell, GameSidebar, ReadyScreen, ResultScreen
    games/            one component per game, plus registry.ts
  composables/        useGames, useProgress, useTheme, useCountdown, useCheer, useListGame
  utils/              bands.ts, random.ts, confetti.ts
  data/games/*.json   the 15 game definitions
  data/copy.json      shared UI copy
shared/types/game.ts  GameDef, Band, Progress
docs/                 design.html, functional-requirements.md, games.json
test/nuxt/            Vitest specs
```

Each game follows one contract:

- **Props:** `game: GameDef`.
- **Emits:** `finish(score: number)`.

`GameShell` owns the ready, playing and result flow. It records the score and shows the sidebar. A game never touches progress or routing.

All game copy lives in `app/data/games/<id>.json`. No component holds game copy.

### Add a new game

1. Create `app/data/games/<id>.json`. Give it 3 steps, 3 demo frames, bands from low to high, a science note, a tip and a 48×48 icon.
2. Write `test/nuxt/components/games/<Component>.spec.ts` first. It must fail. Then create `app/components/games/<Component>.vue`.
3. Register the game in `app/components/games/registry.ts` with `defineAsyncComponent`. The key must equal `component` in the JSON.

Read `docs/functional-requirements.md` section 4 for the full JSON contract.

### Contributing

1. Run `nvm use` before every command.
2. Use the `/feature` skill in Claude Code for every change. The steps are: plan, approval, failing specs, implement, lint, typecheck, test, UI check, review.
3. Give every file under `app/` a spec at `test/nuxt/<path>/<Name>.spec.ts`.
4. Write Conventional Commits, for example `feat(games): port memory pairs`. A `commit-msg` hook checks them.
5. A pre-commit hook runs ESLint, Prettier and the related specs.

`CLAUDE.md` holds the full rules.

### Tests

Vitest runs in a Nuxt environment with happy-dom.

```bash
npm test
npm run test:coverage
npx vitest run test/nuxt/components/games
```

Specs select elements by `data-testid`, ARIA role or `data-state`. They never select by a styling class.

### Documentation

| File                              | Content                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `docs/design.html`                | The approved design. Open it in a browser to play all 15 games. |
| `docs/functional-requirements.md` | Product and behaviour rules.                                    |
| `docs/games.json`                 | Game catalogue.                                                 |
| `CLAUDE.md`                       | Rules for Claude Code and for contributors.                     |

### Limitations

1. Progress does not sync between devices.
2. Clearing browser data erases progress.
3. English only.
4. No offline mode yet.

Planned: accounts and cloud sync, leaderboards, more languages (Bangla), and PWA support.

## License

MIT © 2026 Sumonta Saha Mridul

The Word sprint word lists come from [SCOWL](http://wordlist.aspell.net/), Copyright 2000-2016 by Kevin Atkinson. The full notice is in `public/licenses/scowl.txt`.
