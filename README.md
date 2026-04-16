# Family Base Battle Lab (4 Playable Prototypes)

A small HTML/CSS/JS Canvas project containing **4 genuinely playable prototype variants** of one 2D side-view base battle concept.

## What is included

- Single project with one main menu and a prototype selector (A/B/C/D)
- Shared face asset system in `assets/faces/`
- Shared unit data config in `src/game.js`
- Mobile-friendly controls (large tap buttons, responsive layout)
- In-match and end-match comparison stats (prototype name, duration, win/loss, damage, units spawned)

## Prototype differences

- **Prototype A — Classic Baseline**
  - Balanced energy, 6 units, simple upgrades
- **Prototype B — Fast Chaos**
  - Faster energy, lower-cost swarm loops, shorter hectic matches
- **Prototype C — Tech Tree**
  - Slower early game, unlock tiers/legend, stronger progression choices
- **Prototype D — Hero Ability**
  - Fewer units, dramatic identities, active cooldown abilities

## Face image setup

Put your images in `assets/faces/` using the exact names listed in:

- `assets/faces/README.md`

## Run locally

No backend required. Any static server works.

### Option 1: Python

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

### Option 2: VS Code Live Server

Open folder and run **"Open with Live Server"**.

## Notes on tone/content

- Family-themed, cartoony, silly visuals.
- No gore or disturbing effects.
- Original shapes/UI only; no copied Age of War assets or code.
