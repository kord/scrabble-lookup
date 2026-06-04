# Scrabble Helper (scrabble-lookup)

A lightweight React + TypeScript app for exploring Scrabble words: find valid prefixes/suffixes, and generate anagrams (including support for blank/wildcard tiles `?`). The project ships with multiple wordlists and a small anagram engine under `src/engine`.

## Features

### Affix (prefix/suffix) analysis
- Discover valid prefixes and suffixes that form real words using the built-in dictionaries in `src/dict`.
- Character-level highlights show whether a letter position accepts prefixes, suffixes, or both.
- Results are grouped by affix length for easy scanning.

### Anagram finder
- Exact anagrams using only the provided letters.
- Wildcard support: use `?` to represent blank tiles (each `?` can match any single letter).
- Results are grouped into exact matches and wildcard matches (grouped by number of blanks used).

### Interactive UI
- Debounced input for smooth typing (short delay before searches run).
- Mode toggle between Affix and Anagram views (implemented in the main `WordAnalyzer` component).
- Toggle between dictionaries (for now, SOWPODS, TWL '06 and Collins '22)
- Clear/reset controls, helpful empty states, and a small stats bar with counts and dictionary status.

## Project structure (key files)
- `src/components/WordAnalyzer.tsx` — main UI and controls.
- `src/engine/anagramEngine.ts` & `src/engine/anagramUtils.ts` — anagram generation logic.
- `src/dict/*` — wordlists and dictionary helpers (SOWPODS, TWL06, CSW22, etc.).
- `public/` and `build/` — static assets and production build output.
- `firebase.json` — (optional) Firebase hosting config (this repo includes hosting config but keeps secrets out of source).

## Tech stack

- React (functional components)
- TypeScript
- Plain CSS for styling (`src/css` / `public/static/css`)
- This was written with the substantial assistance of Deepseek and GPT-5 mini)

## Getting started

### Prerequisites
- Node.js 14+ and npm (or yarn)

### Install and run locally

```powershell
# Clone
git clone <repo-url>
cd scrabble-lookup

# Install
npm install

# Start dev server
npm start
```

### Build and deploy

```powershell
# Create an optimized production build
npm run build

# If you use Firebase Hosting (project contains firebase.json)
# this project includes a deploy script you can run after configuring Firebase
npm run deploy
```

### Tests

```powershell
npm test
```

## Notes and tips
- Dictionaries live in `src/dict`. You can add or replace wordlists there; the app is written to load dictionary files at build time.
- Service account keys or other secrets must never be committed. This repo keeps only client config and hosting metadata; server secrets belong in environment variables or a secret manager.

## Contributing
- PRs and issues welcome. Small fixes, updated dictionaries, and UX improvements are good first contributions.

## License
- See repository metadata for license details.
