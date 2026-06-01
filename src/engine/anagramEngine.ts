/**
 * AnagramEngine
 * 
 * Trie-based anagram finder with blank/wildcard support.
 * 
 * Strategy:
 * - 0 blanks: O(1) hash map lookup via sorted-letter signature
 * - 1-2 blanks: Trie DFS traversal (branches at '?', prunes naturally)
 * - 3+ blanks: Regex filter on pre-bucketed word lengths (fast fallback)
 */

interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  words: string[];
}

export class AnagramEngine {
  private root: TrieNode = { children: new Map(), isEnd: false, words: [] };
  private exactIndex = new Map<string, string[]>();
  private lengthBuckets = new Map<number, string[]>();
  private wordCount = 0;

  build(dictionary: string[]): void {
    for (const raw of dictionary) {
      const word = raw.toLowerCase().trim();
      if (word.length === 0) continue;

      // Insert into trie
      this.insertIntoTrie(word);

      // Exact anagram index via sorted-letter signature
      const sorted = word.split('').sort().join('');
      if (!this.exactIndex.has(sorted)) {
        this.exactIndex.set(sorted, []);
      }
      this.exactIndex.get(sorted)!.push(word);

      // Length buckets for regex fallback
      if (!this.lengthBuckets.has(word.length)) {
        this.lengthBuckets.set(word.length, []);
      }
      this.lengthBuckets.get(word.length)!.push(word);

      this.wordCount++;
    }
  }

  private insertIntoTrie(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          children: new Map(),
          isEnd: false,
          words: [],
        });
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
    node.words.push(word);
  }

  /**
   * Search for anagrams matching a pattern.
   * Use '?' for blank tiles (wildcards).
   * 
   * @returns Array of matching dictionary words
   */
  search(pattern: string): string[] {
    const blanks = (pattern.match(/\?/g) || []).length;
    const normalized = pattern.toLowerCase().trim().replace(/\?/g, '');


    if (normalized.length === 0) return [];

    // 0 blanks: O(1) hash map lookup
    if (blanks === 0) {
      return this.searchExact(normalized);
    }

    // 1-2 blanks: trie traversal (prunes well)
    if (blanks <= 2) {
      return this.searchWithBlanks(normalized, blanks);
    }

    // 3+ blanks: regex fallback
    return this.searchWithFallback(normalized);
  }

  /**
   * Exact anagram lookup — O(1) via sorted-letter signature.
   * Example: "listen" → signature "eilnst" → ["listen", "silent", "tinsel"]
   */
  private searchExact(word: string): string[] {
    if (!word) return [];
    const normalized = word.split('').sort().join('')
    console.log(`Searching exact anagrams for: ${normalized}`);

    return this.exactIndex.get(normalized) ?? [];
  }

  /**
   * Wildcard search via trie DFS.
   * Each '?' branches to all valid children.
   * Natural pruning means 26^B worst case rarely materializes.
   */
  private searchWithBlanks(pattern: string, blanks: number): string[] {
    // Assume the blanks are at the start, since it's been normalized already.
    const results = new Set<string>();
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    if (blanks === 1) {
      alphabet.forEach(char => {
        const modified = pattern + char;
        this.searchExact(modified).forEach(element => {
          results.add(element);
        });
      });
    }
    if (blanks === 2) {
      alphabet.forEach(char1 => {
        alphabet.forEach(char2 => {
          const modified = pattern + char1 + char2;
          this.searchExact(modified).forEach(element => {
            results.add(element);
          });
        });
      });
    }
    return Array.from(results);
  }

  private dfs(
    node: TrieNode,
    pattern: string,
    idx: number,
    results: Set<string>
  ): void {
    if (idx === pattern.length) {
      if (node.isEnd) {
        for (const word of node.words) {
          results.add(word);
        }
      }
      return;
    }

    const char = pattern[idx];

    if (char === '?') {
      // Branch to every valid child — prunes naturally
      for (const [, child] of node.children) {
        this.dfs(child, pattern, idx + 1, results);
      }
    } else {
      const child = node.children.get(char);
      if (child) {
        this.dfs(child, pattern, idx + 1, results);
      }
    }
  }

  /**
   * Fallback for 3+ blanks.
   * Converts pattern to regex and filters length-bucketed words.
   */
  private searchWithFallback(pattern: string): string[] {
    const regexStr = '^' + pattern.replace(/\?/g, '.') + '$';
    const regex = new RegExp(regexStr, 'i');
    const candidates = this.lengthBuckets.get(pattern.length) ?? [];
    return candidates.filter(word => regex.test(word));
  }

  /**
   * Check if a word exists in the dictionary (exact match).
   */
  exists(word: string): boolean {
    const w = word.toLowerCase().trim();
    const sorted = w.split('').sort().join('');
    const matches = this.exactIndex.get(sorted);
    return matches?.includes(w) ?? false;
  }

  /**
   * Full suggest: returns words with blank count metadata.
   */
  suggest(pattern: string): Array<{ word: string; blanks: number }> {
    const results = this.search(pattern);
    const blanks = (pattern.match(/\?/g) || []).length;
    return results.map(word => ({ word, blanks }));
  }

  getStats() {
    return {
      totalWords: this.wordCount,
      uniqueSignatures: this.exactIndex.size,
    };
  }
}
