/**
 * SOWPODS Dictionary for Scrabble word lookup.
 * 
 * Provides:
 * - check(word): boolean — is the word in the dictionary?
 * - findValidPrefixes(word): string[] — prefixes that combine with word
 * - findValidSuffixes(word): string[] — suffixes that combine with word
 * - findAnagrams(pattern): { word, blanks }[] — anagram search with wildcards
 */

import { AnagramEngine } from '../engine';
import { SOWPODS_WORDS } from './sowpods';

// ============================================================
// BI-DIRECTIONAL PREFIX DICTIONARY
// ============================================================

class BiDirectionalPrefixDictionary {
    private wordSet = new Set<string>();
    // wordsEndingWith[prefix] = all dictionary words ending with that string
    private wordsEndingWith = new Map<string, string[]>();
    // wordsStartingWith[suffix] = all dictionary words starting with that string
    private wordsStartingWith = new Map<string, string[]>();

    constructor(words: string[]) {
        for (const raw of words) {
            const w = raw.toLowerCase().trim();
            if (w.length === 0) continue;
            this.wordSet.add(w);

            // Index all suffixes of this word (for prefix lookup)
            // If dict has "unhelp", we need to find that "help" → prefix "un"
            for (let i = 0; i < w.length; i++) {
                const suffix = w.slice(i);
                if (!this.wordsEndingWith.has(suffix)) {
                    this.wordsEndingWith.set(suffix, []);
                }
                this.wordsEndingWith.get(suffix)!.push(w);
            }

            // Index all prefixes of this word (for suffix lookup)
            // If dict has "helpful", we need to find that "help" → suffix "ful"
            for (let i = 1; i <= w.length; i++) {
                const prefix = w.slice(0, i);
                if (!this.wordsStartingWith.has(prefix)) {
                    this.wordsStartingWith.set(prefix, []);
                }
                this.wordsStartingWith.get(prefix)!.push(w);
            }
        }
    }

    /** Check if a word exists in the dictionary */
    check(word: string): boolean {
        return this.wordSet.has(word.toLowerCase().trim());
    }

    /**
     * Find all prefixes that can be prepended to form a valid word.
     * 
     * Example: findValidPrefixes("help") → ["un"]
     *   because "un" + "help" = "unhelp" is in the dictionary.
     */
    findValidPrefixes(word: string): string[] {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord.length === 0) return [];

        const prefixes = new Set<string>();

        // Look up all dictionary words that end with our word
        const candidates = this.wordsEndingWith.get(cleanWord) ?? [];
        for (const dictWord of candidates) {
            if (dictWord.length > cleanWord.length && dictWord.endsWith(cleanWord)) {
                const prefix = dictWord.slice(0, -cleanWord.length);
                if (prefix.length > 0) {
                    prefixes.add(prefix);
                }
            }
        }

        return Array.from(prefixes).sort((a, b) => a.length - b.length);
    }

    /**
     * Find all suffixes that can be appended to form a valid word.
     * 
     * Example: findValidSuffixes("help") → ["ful", "less", "ing", "er"]
     *   because "help" + "ful" = "helpful" is in the dictionary.
     */
    findValidSuffixes(word: string): string[] {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord.length === 0) return [];

        const suffixes = new Set<string>();

        // Look up all dictionary words that start with our word
        const candidates = this.wordsStartingWith.get(cleanWord) ?? [];
        for (const dictWord of candidates) {
            if (dictWord.length > cleanWord.length && dictWord.startsWith(cleanWord)) {
                const suffix = dictWord.slice(cleanWord.length);
                if (suffix.length > 0) {
                    suffixes.add(suffix);
                }
            }
        }

        return Array.from(suffixes).sort((a, b) => a.length - b.length);
    }

    get wordCount(): number {
        return this.wordSet.size;
    }
}

// ============================================================
// SOWPODS DICTIONARY — Full Scrabble wrapper
// ============================================================

class ScrabbleDictionary {
    private dict: BiDirectionalPrefixDictionary;
    private anagramEngine: AnagramEngine;

    constructor(words: string[]) {
        this.dict = new BiDirectionalPrefixDictionary(words);
        this.anagramEngine = new AnagramEngine();
        this.anagramEngine.build(words);
    }

    /** Check if a word exists */
    check(word: string): boolean {
        return this.dict.check(word);
    }

    /** Find prefixes that combine with this word */
    findValidPrefixes(word: string): string[] {
        return this.dict.findValidPrefixes(word);
    }

    /** Find suffixes that combine with this word */
    findValidSuffixes(word: string): string[] {
        return this.dict.findValidSuffixes(word);
    }

    /** Find anagrams (with optional blank/wildcard support) */
    findAnagrams(pattern: string): Array<{ word: string; blanks: number }> {
        return this.anagramEngine.suggest(pattern);
    }

    /** Check if pattern has any anagram matches */
    hasAnagrams(pattern: string): boolean {
        return this.anagramEngine.search(pattern).length > 0;
    }

    get wordCount(): number {
        return this.dict.wordCount;
    }
}

// Singleton instance
export const SowpodsDictionary = new ScrabbleDictionary(SOWPODS_WORDS);
export default SowpodsDictionary
