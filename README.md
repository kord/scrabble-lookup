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

To keep the bundle small, the three raw wordlists (~14 MB of TypeScript arrays) are never shipped directly. Instead, `scripts/build-dicts.mjs` runs as a `prebuild` step and compiles them into a minimal set of chunk files using automated set-theoretic exploration.

### How it works

1. **Parse** the three raw word lists (SOWPODS, CSW22, TWL06) into Sets.
2. **Compute all 7 Venn-diagram atoms** — the non-overlapping regions of the 3-set Venn diagram:

   | Atom | Meaning | Typical size |
   |------|---------|-------------|
   | `ABC` | In all 3 dictionaries | ~178k |
   | `AB` | In SOWPODS & CSW22, not TWL06 | ~89k |
   | `AC` | In SOWPODS & TWL06, not CSW22 | ~228 |
   | `BC` | In CSW22 & TWL06, not SOWPODS | ~0 |
   | `A_` | SOWPODS-only | ~400 |
   | `B_` | CSW22-only | ~12k |
   | `C_` | TWL06-only | ~0 |

   Each dictionary is just a union of its constituent atoms (e.g. SOWPODS = ABC ∪ AB ∪ AC ∪ A_).

3. **Enumerate all valid partitions** — every way to group the non-empty atoms into chunk files such that each dictionary can be reconstituted as a union of some subset of chunks.

4. **Gzip-measure each candidate**. For every valid partition, the script serializes grouped word data, gzips it, and sums the sizes. The partition with the smallest total wins.

5. **Write the winning chunk files + a manifest**. The manifest (`src/dict/compiled/manifest.ts`) imports the right chunks and exports the three reconstituted dictionary instances. `scrabbledicts.ts` simply re-exports from the manifest — it never needs to know which partition was chosen.

### Optimal result for 3 dictionaries

The explorer found that keeping each atom as its own file minimizes gzip size:

| Chunk | Atoms | Gzip size |
|-------|-------|-----------|
| `chunk-0` | ABC | 605 KB |
| `chunk-1` | AB | 342 KB |
| `chunk-2` | AC | 1 KB |
| `chunk-3` | A_ | 2 KB |
| `chunk-4` | B_ | 47 KB |
| **Total** | | **995 KB** |

Runtime reconstitution (from `manifest.ts`):

```
SOWPODS ← chunks [0, 1, 2, 3]
CSW22   ← chunks [0, 1, 4]
TWL06   ← chunks [0, 2]
```

### Bundle size history

| Strategy | Gzipped JS bundle | Reduction |
|----------|------------------|-----------|
| Original (3 full arrays) | ~2.00 MB | — |
| 4-file common+delta | 1.43 MB | -29% |
| 5-file with SOWPODS-CSW22 shared | 1.09 MB | -24% |
| Partition explorer (atom-per-file) | **1.09 MB** | (same optimum) |

The partition explorer converged on the same result as the manual 5-file approach — confirming it's optimal for this data. If dictionary word lists change or a 4th dictionary is added, the explorer automatically finds the new optimum.

To run the explorer manually:

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
