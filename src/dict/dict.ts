/**
 * BiDirectionalPrefixDictionary — Array-based version
 * 
 * Stores words in arrays organized by length:
 *   - forwardWords[length] = string[]  (all words of that length, sorted)
 *   - reverseWords[length] = string[]  (all words reversed, sorted by reversed form)
 * 
 * This allows efficient prefix and suffix lookup without a trie.
 */

export class BiDirectionalPrefixDictionary {
    private forwardWords: Map<number, string[]>;  // length → sorted words
    private reverseWords: Map<number, string[]>;  // length → reversed words
    private wordSet: Set<string>;
    public wordCount: number;

    constructor(wordlist: string[] = []) {
        this.forwardWords = new Map();
        this.reverseWords = new Map();
        this.wordSet = new Set();
        this.wordCount = 0;
        this.insertWords(wordlist);
    }

    insertWords(wordlist: string[]) {
        for (const word of wordlist) {
            this.insert(word);
        }
    }

    insert(word: string): boolean {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();

        if (this.wordSet.has(normalizedWord)) {
            return false;
        }

        this.wordSet.add(normalizedWord);

        // Store in forward array by length
        const len = normalizedWord.length;
        if (!this.forwardWords.has(len)) {
            this.forwardWords.set(len, []);
        }
        this.forwardWords.get(len)!.push(normalizedWord);

        // Store reversed in reverse array by length
        const reversed = normalizedWord.split('').reverse().join('');
        if (!this.reverseWords.has(len)) {
            this.reverseWords.set(len, []);
        }
        this.reverseWords.get(len)!.push(reversed);

        this.wordCount++;
        return true;
    }

    /**
     * Must be called after all inserts to sort the arrays for binary search.
     */
    finalize(): void {
        for (const [len, words] of this.forwardWords) {
            words.sort();
            this.forwardWords.set(len, words);
        }
        for (const [len, words] of this.reverseWords) {
            words.sort();
            this.reverseWords.set(len, words);
        }
    }

    check(word: string): boolean {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }
        return this.wordSet.has(word.toLowerCase().trim());
    }

    getWordCount(): number {
        return this.wordCount;
    }

    getAllWords(): string[] {
        const words: string[] = [];
        const sortedLengths = Array.from(this.forwardWords.keys()).sort((a, b) => a - b);
        for (const len of sortedLengths) {
            words.push(...this.forwardWords.get(len)!);
        }
        return words;
    }

    /**
     * Finds all prefixes that can be prepended to the given word
     * to form a valid dictionary word.
     * 
     * Uses the reverse-word arrays: a word ending with our input
     * means the reversed word starts with the reversed input.
     */
    findValidPrefixes(word: string): string[] {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const reversedWord = normalizedWord.split('').reverse().join('');
        const prefixes: string[] = [];

        // Search through lengths longer than our word
        for (const [len, revWords] of this.reverseWords) {
            if (len <= normalizedWord.length) continue;

            // We need reversed words that START with reversedWord
            // Since revWords is sorted, binary search the range
            const start = this.lowerBound(revWords, reversedWord);
            const end = this.upperBound(revWords, this.nextPrefix(reversedWord));

            for (let i = start; i < end; i++) {
                const revDictWord = revWords[i];
                // The forward version of this dictionary word
                const forwardWord = revDictWord.split('').reverse().join('');
                const prefix = forwardWord.slice(0, forwardWord.length - normalizedWord.length);
                prefixes.push(prefix);
            }
        }

        return [...new Set(prefixes)].sort();
    }

    /**
     * Finds all suffixes that can be appended to the given word
     * to form a valid dictionary word.
     * 
     * Uses the forward-word arrays: a word starting with our input
     * is a suffix candidate.
     */
    findValidSuffixes(word: string): string[] {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const suffixes: string[] = [];

        // Search through lengths longer than our word
        for (const [len, words] of this.forwardWords) {
            if (len <= normalizedWord.length) continue;

            // We need forward words that START with normalizedWord
            const start = this.lowerBound(words, normalizedWord);
            const end = this.upperBound(words, this.nextPrefix(normalizedWord));

            for (let i = start; i < end; i++) {
                const dictWord = words[i];
                const suffix = dictWord.slice(normalizedWord.length);
                suffixes.push(suffix);
            }
        }

        return [...new Set(suffixes)].sort();
    }

    /**
     * Finds all anagrams of the given letters (with ? wildcard support)
     */
    findAnagrams(letters: string): Array<{ word: string; blanks: number }> {
        if (typeof letters !== 'string') {
            return [];
        }

        const normalizedLetters = letters.toLowerCase().trim();
        if (normalizedLetters.length === 0) return [];
        if (!/^[a-z?]+$/.test(normalizedLetters)) return [];

        const results: Array<{ word: string; blanks: number }> = [];

        // Count available letters
        const letterCount = this.countLetters(normalizedLetters);
        const blankCount = normalizedLetters.split('?').length - 1;
        const inputLength = normalizedLetters.length;

        // Only check words of the same length
        const candidateWords = this.forwardWords.get(inputLength);
        if (!candidateWords) return results;

        for (const dictWord of candidateWords) {
            const usedBlanks = this.canFormWord(dictWord, letterCount, blankCount);
            if (usedBlanks !== -1) {
                results.push({ word: dictWord, blanks: usedBlanks });
            }
        }

        return results;
    }

    // ======== Helper methods ========

    private lowerBound(sortedArray: string[], target: string): number {
        let lo = 0;
        let hi = sortedArray.length;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (sortedArray[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    private upperBound(sortedArray: string[], target: string): number {
        let lo = 0;
        let hi = sortedArray.length;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (sortedArray[mid] <= target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    private nextPrefix(s: string): string {
        // Returns the string immediately after all strings starting with s
        // in lexicographic order (e.g., "abc" → "abd")
        const chars = s.split('');
        for (let i = chars.length - 1; i >= 0; i--) {
            if (chars[i] < 'z') {
                chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
                return chars.join('');
            }
        }
        // All characters are 'z', return a sentinel past-z string
        return s + 'z';
    }

    private countLetters(s: string): Map<string, number> {
        const counts = new Map<string, number>();
        for (const ch of s) {
            if (ch === '?') continue;
            counts.set(ch, (counts.get(ch) || 0) + 1);
        }
        return counts;
    }

    private canFormWord(word: string, letterCount: Map<string, number>, blankCount: number): number {
        const available = new Map(letterCount);
        let blanksUsed = 0;

        for (const ch of word) {
            const count = available.get(ch) || 0;
            if (count > 0) {
                available.set(ch, count - 1);
            } else if (blanksUsed < blankCount) {
                blanksUsed++;
            } else {
                return -1; // Cannot form this word
            }
        }

        return blanksUsed;
    }

    getWordsStartingWith(prefix: string): string[] {
        const normalizedPrefix = prefix.toLowerCase().trim();
        const result: string[] = [];

        // Search forward arrays for words starting with prefix
        for (const [, words] of this.forwardWords) {
            const start = this.lowerBound(words, normalizedPrefix);
            const end = this.upperBound(words, this.nextPrefix(normalizedPrefix));
            for (let i = start; i < end; i++) {
                result.push(words[i]);
            }
        }

        return result;
    }

    getWordsEndingWith(suffix: string): string[] {
        const normalizedSuffix = suffix.toLowerCase().trim();
        const reversedSuffix = normalizedSuffix.split('').reverse().join('');
        const result: string[] = [];

        // Search reverse arrays for reversed words starting with reversed suffix
        for (const [, revWords] of this.reverseWords) {
            const start = this.lowerBound(revWords, reversedSuffix);
            const end = this.upperBound(revWords, this.nextPrefix(reversedSuffix));
            for (let i = start; i < end; i++) {
                const revWord = revWords[i];
                result.push(revWord.split('').reverse().join(''));
            }
        }

        return result;
    }
}
