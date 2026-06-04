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
- Hovering on a word in one of the results pane will attempt to lookup a definition of the word.

## Dictionary compression

To keep the bundle small, wordlists are compiled at build time using a **common-words + delta** strategy:

1. **`scripts/build-dicts.mjs`** runs as a `prebuild` step and reads the three raw wordlists (SOWPODS, TWL06, CSW22).
2. It computes the **intersection** of all three — the set of words common to every dictionary — and three **deltas** (words unique to each dictionary).
3. Each set is **grouped by word length**, sorted alphabetically, and joined into a single pipe-delimited string per length (e.g. `3: "aah|aal|aas|..."`).
4. Four compact TypeScript files are written to `src/dict/compiled/`:

| File | Contents | Raw size |
|------|----------|----------|
| `common.ts` | Words in all 3 dicts | 1.76 MB |
| `sowpods-delta.ts` | SOWPODS-only words | 946 KB |
| `twl06-delta.ts` | TWL06-only words | 2 KB |
| `csw22-delta.ts` | CSW22-only words | 1.06 MB |

5. At runtime, each dictionary is reconstituted as `common ∪ delta` via `BiDirectionalDictionary.loadCompiled()` — no sorting or deduplication needed since that's done at build time.

**Result:** 725,520 raw word instances across three files → 368,594 across four files (a 49% reduction). Combined with gzip, the JS bundle dropped from ~2.0 MB to ~1.43 MB. TWL06 has only 228 words outside the common set, so it adds almost no weight.

To regenerate the compiled dictionaries manually:

```powershell
node scripts/build-dicts.mjs
```


## Project structure (key files)
- `src/components/WordAnalyzer.tsx` — main UI and controls.
- `src/components/WordResultChip.tsx` — individual result chips (affixes, anagrams).
- `src/components/DictionaryTooltip.tsx` — hover tooltip with definitions from the Free Dictionary API.
- `src/engine/anagramEngine.ts` & `src/engine/anagramUtils.ts` — anagram generation logic.
- `src/dict/dict.ts` — `BiDirectionalDictionary` with binary-search prefix/suffix lookup.
- `src/dict/scrabbledicts.ts` — reconstitutes dictionary instances from compiled files.
- `src/dict/compiled/` — auto-generated length-grouped wordlists (see above).
- `scripts/build-dicts.mjs` — build script that generates the compiled dictionary files.
- `public/` and `build/` — static assets and production build output.
- `firebase.json` — Firebase hosting config.

## Tech stack

- React (functional components)
- TypeScript
- Plain CSS for styling (`src/css` / `public/static/css`)
- This was written with the substantial assistance of Deepseek and GPT-5 mini

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
