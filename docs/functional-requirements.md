# Brain Games — Functional Requirements

Brain Games is a relaxing, simple brain-training website. People come to **feel calm and sharpen their mind** in short (about 1 minute) games. Every screen should feel friendly, positive and easy.

Reference implementation: `docs/design.html` (single file, all 15 games working). Game content: `app/data/games/*.json` (all 15) and `docs/games.json` (the same, in one array).

## 1. Product principles

1. **Relax first, challenge second.** Encouraging copy everywhere, never shaming. Mistakes get "No worries, carry on" style feedback.
2. **One minute or less** per game, with a clear finish.
3. **Explain every score.** Each result shows a band (e.g. "Steady"), what it means, the research behind it, and one tip.
4. **Honest science.** Bands are based on published norms where they exist; otherwise they're labelled as a Brain Games guide. No "boost your IQ" claims.
5. **Accessible and mobile-first.** Touch targets 44px or larger, keyboard playable, works at 320px wide, respects reduced motion, AA contrast in both themes.

## 2. Pages

| Route        | Page      | Purpose                                                              |
| ------------ | --------- | -------------------------------------------------------------------- |
| `/`          | Home      | Greeting, today's five, mood check, bento grid of all games          |
| `/games`     | All games | Bento grid with category filter                                      |
| `/games/:id` | Game      | Full-height play area (left) + guide sidebar (right)                 |
| `/profile`   | Profile   | Avatar, name, level, streak, week, brain skills, recent games, reset |
| any other    | Error     | Friendly 404 with a "Back to games" button                           |

### 2.1 Navbar (identical on every page)

- Left: brain logo + "Brain Games" (links home).
- Tabs: Home, Games, Profile. The active tab is highlighted (`aria-current="page"`).
- Right: streak (🔥 n), theme toggle (Auto → Light → Dark), and the avatar with name and level emoji (links to profile).
- **≤640px:** tabs move to a fixed bottom tab bar (thumb reach). The top bar keeps the logo, theme and avatar. Streak and name are hidden below 760px.

### 2.2 Home

- **Hero card:** time-based greeting ("Good morning/afternoon/evening/Still awake", plus the name if set), a daily affirmation (rotates by day), and **Today's five**: 5 games picked by a date-seeded PRNG, so the set is the same all day. Played games are shown struck through, with an n/5 counter.
- **Mood check:** Calm / Tired / Stressed / Energised. Picking one suggests 3 games:
  - Calm → breath, pairs, odd
  - Tired → breath, sequence, category
  - Stressed → breath, odd, hand
  - Energised → reaction, math, stroop
- **Bento grid:** 4 columns on desktop, 3 on tablet, 2 on phones, with dense auto-flow. Tile size comes from the game JSON `size`: `big` 2×2, `wide` 2×1, `tall` 1×2, `normal` 1×1. When a category filter is active, `big` becomes `wide` and the others become `normal`. Rows are at least 150px tall (130px at 560px or less) and grow when a tile needs more, so no tile cuts off its text.
- **Tile content:** icon, level pill, name, blurb (on wide/tall/big tiles), and best score with its band label (or "not played yet"). Big tiles also get a "Play now" pill. Tile tint comes from the category.

### 2.3 Game page (full height)

- **Desktop:** a grid of `1fr | 340px`, with height = viewport − navbar. Nothing on the page scrolls; the sidebar scrolls internally if needed.
- **Play panel header:** back button, game icon, name, "Category · Level · trains …", and your best score.
- **Play panel stage**, in three states:
  1. **Ready:** "Ready?", the blurb, a big Start button (Enter also starts), and an auto-looping 3-frame demo (2.2s per frame).
  2. **Playing:** the game component. While the game's code or data loads, the stage shows the `loading` line from `copy.json` ("Getting ready…"). Floating "cheer" messages (Nice!, On a roll!…) appear on milestones.
  3. **Result:** emoji by band, a big gradient score, the unit, the band label and message, and personal-best messaging (confetti on a new PB). Buttons: Play again (focused, Enter replays) and More games.
- **Sidebar**, always visible:
  - How to play (numbered steps)
  - What your score means (all bands; the current band is highlighted with a "you" tag)
  - The science, plus a tip
- **≤1000px:** the sidebar stacks below the play panel. **≤640px:** compact header, demo shown above the Start button, full-width buttons.

### 2.4 Profile

- Avatar picker (10 emoji) and a name input (max 24 characters).
- Level plant: XP / 120 per level, with 7 levels (Seed → Whole garden) and a progress bar.
- Stats: day streak, games played, games tried (x / 15).
- This week: 7 day boxes, filled if played that day.
- Brain skills, per category: the average of (bandIndex + 1) / bands.length over the games played in that category, shown as a %.
- Recent games: the last 10, each with its band label.
- Reset all progress, with a confirmation.

## 3. Progress and scoring rules

- **Storage:** localStorage key `bgarden`, holding a JSON `Progress` object (see `shared/types/game.ts`). It's the same key the design file uses, so progress carries over.
- **On finish:**
  - Personal best: if there's no previous best, or the new score is better (higher, or lower when `lowerIsBetter`), the best is updated.
  - History: the entry is added to the start of `hist`, which keeps a maximum of 60 entries.
  - Days: today's date (`YYYY-MM-DD`) is added to `days`, which keeps a maximum of 120 entries.
  - XP: +10 for every game, plus +5 when a previous best is beaten.
- **Streak:** consecutive days with at least one game, counting back from today (or from yesterday if nothing has been played yet today).
- **Band lookup:** `bands` are ordered from lowest to highest performance, and the score falls in the last band whose `at` it reaches:
  - Higher-is-better games: the score falls in the last band where `score >= at`.
  - Lower-is-better games: the score falls in the last band where `score <= at`, with `at: null` meaning no limit.
- **Theme:** `auto` (follows the system), `light` or `dark`, stored in Progress.

### 3.1 Difficulty

- A game with a `difficulties` block in its JSON has three difficulties: `easy`, `medium` and `hard`. Reaction, breath and hand have no block and no selector.
- **Selector:** the Ready screen shows a radio group (Easy, Medium, Hard) above the Start button. Arrow keys move the choice. The default is Medium. The last choice for each game is stored in `Progress.diff[id]` and is selected the next time.
- **Resolved game:** `withDifficulty(game, d)` returns the game with that difficulty's `bands`, `science` and `settings`, and with `difficulty: d`. Medium has no `bands` or `science` of its own and uses the top-level ones. The game component, the sidebar, the result screen and the header all get the resolved game. A game reads a setting with `setting(game, key)`, which throws when the key is missing.
- **Best score per difficulty:** Medium keeps `best[id]` (compatible with design.html). Easy and Hard use `best['<id>@easy']` and `best['<id>@hard']`. The header and the result screen compare only with the best of the selected difficulty.
- **History:** each entry stores its difficulty in `l` (missing means medium). Recent games on the profile use the bands of that difficulty.
- **Games tried** on the profile counts each game id once, whatever its difficulties. Brain skills on the profile and the best score on the home tile use `topBest(game, best)`: the best of the hardest difficulty played (Hard, then Medium, then Easy). The tile names that difficulty, for example `Best 12.3 s · Excellent · Hard`.
- The game header shows the selected difficulty in place of the fixed `level` for a game with difficulties.
- A stored `diff[id]` that is not one of the three difficulties is ignored, and Medium is selected.
- Easy and Hard bands are Brain Games guides, not research norms, and their `science` says so.

## 4. Game JSON contract (`app/data/games/<id>.json`)

| Field                     | Type                               | Notes                                                                                                          |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| id                        | string                             | URL slug, unique                                                                                               |
| order                     | number                             | Display order                                                                                                  |
| component                 | string                             | Key in `app/components/games/registry.ts`                                                                      |
| name, blurb, trains, unit | string                             | Copy. The blurb is one sentence that ends with a full stop.                                                    |
| category                  | Calm/Speed/Words/Memory/Focus/Body | Drives tint                                                                                                    |
| level                     | Easy/Medium/Hard                   |                                                                                                                |
| size                      | normal/wide/tall/big               | Bento tile size                                                                                                |
| durationSec               | number or null                     | Timed games only                                                                                               |
| lowerIsBetter             | boolean                            | reaction, schulte, pairs                                                                                       |
| steps                     | string[3]                          | How to play                                                                                                    |
| demo                      | {scene (HTML), caption}[3]         | Ready-screen animation frames                                                                                  |
| bands                     | {at, range, label, message}[]      | Lowest → highest performance                                                                                   |
| science, tip              | string                             | Sidebar                                                                                                        |
| icon                      | string                             | File name in `app/assets/icons/games/<icon>.svg`: a 48×48 SVG (`viewBox="0 0 48 48"`) that uses `currentColor` |
| content                   | object (optional)                  | Game-specific lists the game reads at play time. Components never hard-code them. See the table below.         |
| difficulties              | object (optional)                  | `{ easy, medium, hard }`. Each has `settings` (name → number). Easy and Hard also have `bands` and `science`.  |

| Game     | `content` shape                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| pairs    | `{ emojis: string[12] }`                                                                                         |
| words    | `{ letters: string[] }` (the start letters)                                                                      |
| category | `{ categories: string[] }`                                                                                       |
| backward | `{ pools: string[][5] }` (word pools, shortest words first)                                                      |
| nback    | `{ letters: string[], hint: string }` (`hint` holds `{n}`)                                                       |
| stroop   | `{ colours: { name: string, token: string }[4] }` (`token` is a colour token in `tokens.css`, e.g. `stroop-red`) |
| hand     | `{ tasks: string[] }` (at least 4)                                                                               |

**Word list (words):** `app/data/wordlists/<letter>.txt` holds one lowercase word per line for each letter a–z. `npm run wordlists` builds the files from `wordlist-english` (SCOWL size 60, American, British and Canadian spellings) plus a fixed list of common contractions. It leaves out every word that matches the local client-data guard patterns (`CLIENT_GUARD_PATTERNS`, or `~/.config/git/client-data-patterns` when that file exists), because the commit guard blocks those words. Word sprint loads only its letter's file, and its countdown starts after the file loads. A word is real when it is in the list. The list has no hyphenated words, so a hyphenated word gets no point. An unknown word gets no point and the message "I do not know that one yet. Try another". If the file fails to load, the game still plays and counts every word that passes the other rules. The SCOWL copyright notice ships in `app/data/wordlists/COPYRIGHT` and on the site at `/licenses/scowl.txt`.

Shared copy that is not about one game lives in `app/data/copy.json`: `greetings` (hour limits 5, 12, 17, 24), `affirmations`, `moods` (the §2.2 mood → games table), `avatars`, `praise`, `loading` (the line the game page shows while a game loads) and `difficulty` (the selector's label and the names Easy, Medium, Hard). Components never hard-code it.

## 5. The 15 games (behaviour)

| id       | Name               | Rules                                                                                                     | Score                         |
| -------- | ------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------- |
| breath   | Box breathing      | 4 rounds of in 4s / hold 4s / out 4s / hold 4s; circle scales; "Finish early"                             | rounds (0–4)                  |
| pairs    | Memory pairs       | `pairs` emoji pairs (easy 6, medium 8, hard 10); 5 columns for 10 pairs, else 4; mismatch flips back 0.8s | moves (lower better)          |
| odd      | Odd colour out     | n×n grid (2→7, grows every 3 levels); one tile ±lightness, delta shrinks per level; 60s                   | levels                        |
| math     | Mental math        | +/− (then ×) sums; auto-advance on correct answer; difficulty up every 5; 60s                             | solved                        |
| serial7  | Serial sevens      | Start 100–199, subtract 7, Enter; wrong answers show the correct one and continue; restarts below 7; 60s  | steps                         |
| reaction | Reaction time      | Random 1.2–3.8s wait, then green; tapping early restarts the round; 5 rounds                              | avg ms (lower better)         |
| words    | Word sprint        | Random letter; real words of 3+ letters starting with it, no repeats; 60s (see the word list rule below)  | words                         |
| category | Category challenge | Random category; items with no repeats; 60s                                                               | items                         |
| backward | Backward spelling  | Word shown for 1.8s + 0.22s per letter, then hidden; type it reversed; 8 rounds, longer words             | out of 8                      |
| digits   | Digit span         | Digits shown 0.9s each; starts at 3; +1 per success; 2 misses in a row ends                               | longest span                  |
| sequence | Sequence memory    | 3×3 grid; pattern +1 each level; repeat it by tapping                                                     | levels                        |
| nback    | N-back             | `n`-back (easy 1, medium 2, hard 3); 24 letters, 2.4s each, about 30% matches; Match button or Space      | % accuracy over trials n+1–24 |
| stroop   | Stroop colours     | Colour word in a different ink; tap the ink; wrong = −1; 45s                                              | points (min 0)                |
| schulte  | Schulte table      | `size`×`size` grid (easy 4, medium 5, hard 6) of 1–size² shuffled; tap in order; wrong taps flash         | seconds (lower better)        |
| hand     | Other hand day     | 4 daily tasks (date-seeded) + a drawing pad; tick the tasks                                               | out of 4                      |

## 6. Visual system

- **Light, "pink matter":** bg `#FFF6F7`, surface `#FFFFFF`, ink `#2B1D2F`, accent `#D9466E`, accent-2 `#7552E0`.
- **Dark, "neural night":** bg `#110E1F`, surface `#1B1730`, ink `#F2EDFB`, accent `#FF7FA3`, accent-2 `#A08BFF`.
- **Category tints** (bg/fg pairs, same lightness per theme): Calm = mint, Speed = peach, Words = rose, Memory = lilac, Focus = sky, Body = sun.
- **Stroop inks:** `--stroop-red` `#E04848`, `--stroop-blue` `#2F80E8`, `--stroop-green` `#2E9E5B`, `--stroop-yellow` `#E8A800` (the same in both themes). Buttons use white text, except Yellow, which uses dark text `--stroop-yellow-text` `#2B1D2F` for contrast. A colour token `<t>` can define `--<t>-text`; the default is `--stroop-text` `#FFFFFF`. Neither changes with the theme. Only the Stroop game uses them.
- **Fonts:** Baloo 2 (display, numbers, buttons), Lexend (body).
- **Shape:** radius 22px (cards), 18px (buttons), 14px (icons). Primary button: accent fill with a 5px darker bottom shadow ("pressable").
- All tokens are in `app/assets/css/tokens.css` (`:root`, `[data-theme]`). `app/assets/css/main.css` maps them into Tailwind `@theme`, so utilities use only these tokens (no default Tailwind palette).

## 7. Non-functional requirements

- Lighthouse a11y ≥ 95. Every control is a real `<button>`/`<a>` with a visible focus ring.
- No network calls besides fonts. Fully client-side (`ssr: false`) until a backend exists.
- Timers and listeners are cleaned up on unmount (no ghost timers after navigating away).
- `prefers-reduced-motion`: no confetti, animations or transitions.
