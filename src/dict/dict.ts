class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map<string, TrieNode>();
        this.isEndOfWord = false;
    }
}

export class BiDirectionalPrefixDictionary {
    private forwardTrie: TrieNode;
    private wordCount: number;

    constructor(wordlist: string[] = []) {
        this.forwardTrie = new TrieNode();
        this.wordCount = 0;
        this.insertWords(wordlist);
    }

    insertWords(wordlist: string[]) {
        for (const word of wordlist) {
            this.insert(word);
        }
    }

    /**
     * Inserts a word into the dictionary
     */
    insert(word: string): boolean {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();

        if (this.check(normalizedWord)) {
            return false;
        }

        let currentNode = this.forwardTrie;
        for (const char of normalizedWord) {
            if (!currentNode.children.has(char)) {
                currentNode.children.set(char, new TrieNode());
            }
            currentNode = currentNode.children.get(char)!;
        }

        currentNode.isEndOfWord = true;
        this.wordCount++;
        return true;
    }

    /**
     * Checks if a word exists in the dictionary
     */
    check(word: string): boolean {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const node = this.traverseForward(normalizedWord);
        return node !== null && node.isEndOfWord;
    }

    /**
     * Gets the total number of words in the dictionary
     */
    getWordCount(): number {
        return this.wordCount;
    }

    /**
     * Gets all words in the dictionary
     */
    getAllWords(): string[] {
        const words: string[] = [];
        this.collectWords(this.forwardTrie, '', words);
        return words;
    }

    // =========================================================
    // NEW METHODS: Finding prefixes and suffixes as extra chars
    // =========================================================

    /**
     * Finds all dictionary words that can be formed by PREPENDING a prefix
     * to the given word. Returns the prefixes (extra chars added before).
     * 
     * Example: word="help", dictionary has "helpful", "helping", "helpless"
     *   → finds words "helpful", "helping", "helpless" 
     *   → returns prefixes ["ful", "ing", "less"]
     * 
     * @param word The base word to find prefix extensions for
     * @returns Array of prefix strings that can be prepended to form valid words
     */
    findValidPrefixes(word: string): string[] {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const prefixes: string[] = [];

        // Find all dictionary words that END with the given word.
        // To do this efficiently, we check if the word itself is a path in the trie,
        // then look for any word that continues from there (those are words that START with our word)
        // Wait - we need words that END with our word. Let's use a different approach.

        // Approach: Search the entire trie for words that end with our input
        // For each complete word in the dictionary, if it ends with our input,
        // the prefix is the part before the input.

        const allWords = this.getAllWords();
        for (const dictWord of allWords) {
            if (dictWord.length > normalizedWord.length && dictWord.endsWith(normalizedWord)) {
                const prefix = dictWord.slice(0, dictWord.length - normalizedWord.length);
                prefixes.push(prefix);
            }
        }

        return [...new Set(prefixes)].sort();
    }

    /**
     * Finds all dictionary words that can be formed by APPENDING a suffix
     * to the given word. Returns the suffixes (extra chars added after).
     * 
     * Example: word="help", dictionary has "helpful", "helping", "helpless"
     *   → finds words "helpful", "helping", "helpless"
     *   → returns suffixes ["ful", "ing", "less"]
     * 
     * @param word The base word to find suffix extensions for
     * @returns Array of suffix strings that can be appended to form valid words
     */
    findValidSuffixes(word: string): string[] {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const suffixes: string[] = [];

        // Traverse to the node representing our word
        const wordNode = this.traverseForward(normalizedWord);

        if (!wordNode) {
            // The word itself isn't in the dictionary, so no words start with it
            return [];
        }

        // Now collect all words that continue from this node (they all start with our word)
        const completions: string[] = [];
        this.collectWords(wordNode, normalizedWord, completions);

        // For each completion, the suffix is what was added after our word
        for (const completion of completions) {
            if (completion.length > normalizedWord.length) {
                const suffix = completion.slice(normalizedWord.length);
                suffixes.push(suffix);
            }
        }

        return [...new Set(suffixes)].sort();
    }

    /**
     * Finds all dictionary words that can be formed by adding BOTH a prefix AND
     * a suffix to the given word.
     * 
     * Example: word="help", dictionary has "unhelpful"
     *   → prefix: "un", suffix: "ful", result: "un" + "help" + "ful" = "unhelpful"
     * 
     * @param word The base word to find affix combinations for
     * @returns Array of {prefix, suffix, word} objects
     */
    findValidAffixCombinations(word: string): Array<{ prefix: string; suffix: string; word: string }> {
        if (typeof word !== 'string' || word.trim().length === 0) {
            throw new Error('Word must be a non-empty string');
        }

        const normalizedWord = word.toLowerCase().trim();
        const combinations: Array<{ prefix: string; suffix: string; word: string }> = [];

        const allWords = this.getAllWords();
        for (const dictWord of allWords) {
            if (dictWord.length > normalizedWord.length) {
                const index = dictWord.indexOf(normalizedWord);
                if (index > 0 && index + normalizedWord.length < dictWord.length) {
                    const prefix = dictWord.slice(0, index);
                    const suffix = dictWord.slice(index + normalizedWord.length);
                    combinations.push({ prefix, suffix, word: dictWord });
                }
            }
        }

        return combinations;
    }

    /**
     * Gets all dictionary words that start with a given prefix
     * (words where the prefix is prepended to something else)
     */
    getWordsStartingWith(prefix: string): string[] {
        const normalizedPrefix = prefix.toLowerCase().trim();
        const node = this.traverseForward(normalizedPrefix);
        if (!node) return [];

        const words: string[] = [];
        this.collectWords(node, normalizedPrefix, words);
        return words;
    }

    /**
     * Gets all dictionary words that end with a given suffix
     * (words where the suffix is appended to something else)
     */
    getWordsEndingWith(suffix: string): string[] {
        const normalizedSuffix = suffix.toLowerCase().trim();
        const words: string[] = [];

        const allWords = this.getAllWords();
        for (const word of allWords) {
            if (word.endsWith(normalizedSuffix)) {
                words.push(word);
            }
        }

        return words;
    }

    // Private methods

    private traverseForward(prefix: string): TrieNode | null {
        let currentNode = this.forwardTrie;
        for (const char of prefix) {
            if (!currentNode.children.has(char)) {
                return null;
            }
            currentNode = currentNode.children.get(char)!;
        }
        return currentNode;
    }

    private collectWords(node: TrieNode, prefix: string, words: string[]): void {
        if (node.isEndOfWord) {
            words.push(prefix);
        }
        for (const [char, childNode] of node.children) {
            this.collectWords(childNode, prefix + char, words);
        }
    }
}
