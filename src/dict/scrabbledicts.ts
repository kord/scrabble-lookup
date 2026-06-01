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
import { BiDirectionalDictionary } from './dict';
import { CSW_22_WORDS } from './CSW22';

// ============================================================
// Dictionary instances
// ============================================================
// These are populated lazily — you need to provide word lists
// and call `finalize()` after inserting all words.
//
// For production, import your actual word lists and pass them
// to the constructor, then call finalize().
//
// Example:
//   import { sowpodsWords } from './sowpods-wordlist';
//   const SowpodsDictionary = new BiDirectionalPrefixDictionary(sowpodsWords);
//   SowpodsDictionary.finalize();
//
// ============================================================

export const SowpodsDictionary = new BiDirectionalDictionary(SOWPODS_WORDS).finalize();
export const Twl06Dictionary = new BiDirectionalDictionary(TWL_06_WORDS).finalize();
export const Csw22Dictionary = new BiDirectionalDictionary(CSW_22_WORDS).finalize();

/**
 * Dictionary metadata for the selector UI
 */
export interface DictionaryInfo {
    id: 'sowpods' | 'twl06' | 'csw22';
    name: string;
    description: string;
    instance: BiDirectionalDictionary;
}

export const AVAILABLE_DICTIONARIES: DictionaryInfo[] = [
    {
        id: 'sowpods',
        name: 'SOWPODS',
        description: 'Int\'l tournament standard (OSW + TWL)',
        instance: SowpodsDictionary,
    },
    {
        id: 'twl06',
        name: 'TWL06',
        description: 'North American tournament list',
        instance: Twl06Dictionary,
    },
    {
        id: 'csw22',
        name: 'CSW22',
        description: '2022 Collins Scrabble Words (latest)',
        instance: Csw22Dictionary,
    },
];


// ============================================================
// SOWPODS DICTIONARY — Full Scrabble wrapper
// ============================================================

class ScrabbleDictionary {
    private dict: BiDirectionalDictionary;
    private anagramEngine: AnagramEngine;

    constructor(words: string[]) {
        this.dict = new BiDirectionalDictionary(words);
        this.dict.finalize();
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
