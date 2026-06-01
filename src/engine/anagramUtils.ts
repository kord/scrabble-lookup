
export interface AnagramResult {
    word: string;
    isWildcard: boolean;
    blanksUsed: number;
}

export { };

/**
 * Normalizes a string: lowercase, trim, remove spaces.
 */
function normalize(s: string): string {
    return s.toLowerCase().trim().replace(/\s+/g, '');
}

/**
 * Checks if a candidate word is an anagram of the query,
 * with `?` treated as a wildcard (matches any single letter).
 *
 * @param query  The user's input (e.g. "mdo?")
 * @param candidate  The dictionary word to check (e.g. "doom")
 * @returns true if candidate can be formed from query with ? as wildcard
 */
export function isAnagram(query: string, candidate: string): boolean {
    const q = normalize(query);
    const c = normalize(candidate);

    // Lengths must match exactly
    if (q.length !== c.length) {
        return false;
    }

    // Count letters in the query — ? counts as a wildcard
    const queryLetters = new Map<string, number>();
    let wildcards = 0;

    for (const ch of q) {
        if (ch === '?') {
            wildcards++;
        } else if (ch >= 'a' && ch <= 'z') {
            queryLetters.set(ch, (queryLetters.get(ch) || 0) + 1);
        } else {
            // Invalid character in query
            return false;
        }
    }

    // Try to match candidate letters against query letters
    // Use wildcards for any missing letters
    for (const ch of c) {
        if (ch < 'a' || ch > 'z') {
            return false; // Invalid character in candidate
        }

        const count = queryLetters.get(ch) || 0;
        if (count > 0) {
            // Use one instance of this letter
            queryLetters.set(ch, count - 1);
        } else if (wildcards > 0) {
            // Use a wildcard instead
            wildcards--;
        } else {
            // Can't match this letter
            return false;
        }
    }

    // All candidate letters matched (possibly with wildcards)
    // Any remaining wildcards are fine — they just mean the query had extras
    return true;
}

/**
 * Counts how many wildcards (?) are in the query.
 */
export function countWildcards(query: string): number {
    const q = normalize(query);
    let count = 0;
    for (const ch of q) {
        if (ch === '?') count++;
    }
    return count;
}

/**
 * Checks if a candidate is a full anagram with no unused wildcards
 * (i.e., every ? in the query was actually used to match a letter).
 *
 * For our purposes, we accept partial usage — any ? that wasn't needed
 * just means the query had more flexibility than needed.
 * But this function can help for strict "exact anagram" filtering.
 */
export function isExactAnagram(query: string, candidate: string): boolean {
    const q = normalize(query);
    const c = normalize(candidate);

    if (q.length !== c.length) return false;

    // Same logic as isAnagram but also checks that all wildcards were used
    const queryLetters = new Map<string, number>();
    let wildcards = 0;

    for (const ch of q) {
        if (ch === '?') {
            wildcards++;
        } else if (ch >= 'a' && ch <= 'z') {
            queryLetters.set(ch, (queryLetters.get(ch) || 0) + 1);
        } else {
            return false;
        }
    }

    for (const ch of c) {
        if (ch < 'a' || ch > 'z') return false;

        const count = queryLetters.get(ch) || 0;
        if (count > 0) {
            queryLetters.set(ch, count - 1);
        } else if (wildcards > 0) {
            wildcards--;
        } else {
            return false;
        }
    }

    // For "exact" anagram, require that all wildcards were used
    return wildcards === 0;
}

/**
 * Find all anagrams from a word list for a given query.
 * Results are sorted: exact matches first, then wildcard matches,
 * then alphabetically within each group.
 */
export function findAnagrams(
    query: string,
    wordList: string[]
): AnagramResult[] {
    const q = normalize(query);
    if (!q || q.length === 0) return [];

    const wildcardCount = countWildcards(q);

    const results: AnagramResult[] = [];

    for (const word of wordList) {
        const w = normalize(word);
        if (w.length !== q.length) continue;

        if (isAnagram(q, w)) {
            const blanksUsed = countBlanksUsed(q, w);
            results.push({
                word: w,
                isWildcard: blanksUsed > 0,
                blanksUsed
            });
        }
    }

    // Sort: exact matches first, then by blanksUsed (fewer first), then alphabetically
    results.sort((a, b) => {
        if (a.isWildcard !== b.isWildcard) {
            return a.isWildcard ? 1 : -1;
        }
        if (a.blanksUsed !== b.blanksUsed) {
            return a.blanksUsed - b.blanksUsed;
        }
        return a.word.localeCompare(b.word);
    });

    return results;
}

/**
 * Count how many wildcards (?) in the query were actually used
 * to match letters in the candidate word.
 */
function countBlanksUsed(query: string, candidate: string): number {
    const q = normalize(query);
    const c = normalize(candidate);

    const queryLetters = new Map<string, number>();
    let wildcards = 0;

    for (const ch of q) {
        if (ch === '?') {
            wildcards++;
        } else if (ch >= 'a' && ch <= 'z') {
            queryLetters.set(ch, (queryLetters.get(ch) || 0) + 1);
        }
    }

    let blanksUsed = 0;

    for (const ch of c) {
        const count = queryLetters.get(ch) || 0;
        if (count > 0) {
            queryLetters.set(ch, count - 1);
        } else if (wildcards > 0) {
            wildcards--;
            blanksUsed++;
        }
    }

    return blanksUsed;
}
