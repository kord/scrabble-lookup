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
import { TWL_06_WORDS } from './twl06';
import { BiDirectionalPrefixDictionary } from './dict';
import { CSW_22_WORDS } from './CSW22';

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
export const Twl06Dictionary = new ScrabbleDictionary(TWL_06_WORDS);
export const Csw22Dictionary = new ScrabbleDictionary(CSW_22_WORDS);
