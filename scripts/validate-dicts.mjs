/**
 * validate-dicts.mjs — Verifies that reconstituted dictionaries match
 * the original raw word lists exactly.
 *
 * Compares every word from the source TS files against the compiled &
 * reconstituted dictionaries via BiDirectionalDictionary.getAllWords().
 * Also checks that no words are missing or extra.
 *
 * Usage:  node scripts/validate-dicts.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DICT_SRC = join(ROOT, 'src', 'dict');

// ── Parse a raw TS word-list file into a Set ─────────────────────────
function parseWordList(filename) {
    const raw = readFileSync(join(DICT_SRC, filename), 'utf-8');
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) {
        throw new Error(`Could not find array in ${filename}`);
    }
    const cleaned = raw.slice(start, end + 1)
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*\n\s*\]/g, '\n]');
    const words = JSON.parse(cleaned);
    return new Set(words.map(w => w.toLowerCase()));
}

// ── Parse a plain-text word list (uppercase, one word per line) ──────
function parseTextWordList(filename) {
    const raw = readFileSync(join(DICT_SRC, filename), 'utf-8');
    return new Set(
        raw.split(/\r?\n/)
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0)
    );
}

// ── Parse a compiled chunk TS file into a Set ────────────────────────
function parseCompiledChunk(filename) {
    const raw = readFileSync(join(DICT_SRC, 'compiled', filename), 'utf-8');
    const words = new Set();

    // Extract all pipe-delimited strings from Record<number, string>
    // Format:  "2: "aa|ab|ac|..."," or  2: "aa|ab|..."
    const regex = /(\d+):\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
        const wordStr = match[2];
        for (const w of wordStr.split('|')) {
            words.add(w);
        }
    }
    return words;
}

// ── Parse manifest.ts to get chunk → dictionary mapping ──────────────
function parseManifest() {
    const raw = readFileSync(join(DICT_SRC, 'compiled', 'manifest.ts'), 'utf-8');
    const map = {};

    // Strategy 1: look for DICT_MAP comments (written by newer build-dicts.mjs)
    const commentRegex = /DICT_MAP:\s*(\w+)\s*←\s*chunks\s*\[([^\]]+)\]/g;
    let match;
    while ((match = commentRegex.exec(raw)) !== null) {
        const dictName = match[1].replace('Dictionary', '').toLowerCase();
        const chunks = match[2].split(',').map(s => parseInt(s.trim(), 10));
        map[dictName] = chunks;
    }

    // Strategy 2 (fallback): parse .loadCompiled(CHUNK_X_WORDS) calls
    if (Object.keys(map).length === 0) {
        const exportRegex = /export const (\w+Dictionary) = new BiDirectionalDictionary\(\)([\s\S]*?);/g;
        while ((match = exportRegex.exec(raw)) !== null) {
            const dictName = match[1].replace('Dictionary', '').toLowerCase();
            const body = match[2];
            const chunks = [];
            const chunkRegex = /CHUNK_(\d+)_WORDS/g;
            let cm;
            while ((cm = chunkRegex.exec(body)) !== null) {
                chunks.push(parseInt(cm[1], 10));
            }
            map[dictName] = chunks;
        }
    }

    return map;
}

// ── Main ─────────────────────────────────────────────────────────────
console.log('Validating dictionary reconstitution...\n');

// 1. Parse originals
const originals = {
    sowpods: parseWordList('sowpods.ts'),
    csw22: parseWordList('CSW22.ts'),
    twl06: parseWordList('twl06.ts'),
    wow24: parseTextWordList('FINAL-WOW24-Full-Alphabetical.txt'),
};

console.log(`  Originals:`);
for (const [name, set] of Object.entries(originals)) {
    console.log(`    ${name}: ${set.size.toLocaleString()} words`);
}

// 2. Parse all compiled chunks
const chunks = {};
const chunkFiles = readdirSync(join(DICT_SRC, 'compiled')).filter(f => /^chunk-\d+\.ts$/.test(f));
for (const f of chunkFiles) {
    chunks[f] = parseCompiledChunk(f);
}
console.log(`\n  Compiled chunks: ${Object.keys(chunks).length} files loaded`);

// 3. Parse manifest
let manifest;
try {
    manifest = parseManifest();
} catch {
    console.error('  ✗ Could not parse manifest.ts — has the prebuild step run?');
    process.exit(1);
}

// 4. Reconstitute and compare
console.log('\n  Comparison:');
let allPassed = true;

for (const [dictName, originalSet] of Object.entries(originals)) {
    const chunkIndices = manifest[dictName];
    if (!chunkIndices) {
        console.error(`    ✗ ${dictName}: no manifest entry`);
        allPassed = false;
        continue;
    }

    // Build reconstituted set from chunks
    const reconstituted = new Set();
    for (const ci of chunkIndices) {
        const chunkFile = `chunk-${ci}.ts`;
        const chunkSet = chunks[chunkFile];
        if (!chunkSet) {
            console.error(`    ✗ ${dictName}: chunk ${chunkFile} not found`);
            allPassed = false;
            continue;
        }
        for (const w of chunkSet) reconstituted.add(w);
    }

    // Compare
    const missing = new Set([...originalSet].filter(w => !reconstituted.has(w)));
    const extra = new Set([...reconstituted].filter(w => !originalSet.has(w)));

    if (missing.size === 0 && extra.size === 0 && reconstituted.size === originalSet.size) {
        console.log(`    ✓ ${dictName}: ${originalSet.size.toLocaleString()} words — exact match`);
    } else {
        allPassed = false;
        console.log(`    ✗ ${dictName}: MISMATCH`);
        console.log(`       Original:      ${originalSet.size.toLocaleString()}`);
        console.log(`       Reconstituted:  ${reconstituted.size.toLocaleString()}`);
        if (missing.size > 0) {
            const samples = [...missing].slice(0, 10);
            console.log(`       Missing (${missing.size}): ${samples.join(', ')}${missing.size > 10 ? ' ...' : ''}`);
        }
        if (extra.size > 0) {
            const samples = [...extra].slice(0, 10);
            console.log(`       Extra (${extra.size}):   ${samples.join(', ')}${extra.size > 10 ? ' ...' : ''}`);
        }
    }
}

console.log('');
if (allPassed) {
    console.log('  ✓ All dictionaries match. Reconstitution is correct.');
    process.exit(0);
} else {
    console.error('  ✗ Validation FAILED. See details above.');
    process.exit(1);
}
