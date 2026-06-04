// src/components/DictionaryTooltip.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================================
// TYPES
// ==========================================================

interface DictionaryMeaning {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
}

interface DictionaryEntry {
    word: string;
    phonetic?: string;
    meanings: DictionaryMeaning[];
}

// ==========================================================
// DICTIONARY TOOLTIP
// ==========================================================

const HOVER_DELAY_MS = 400;

type CachedResult =
    | { type: 'entry'; entry: DictionaryEntry }
    | { type: 'error'; error: string };

const lookupCache = new Map<string, CachedResult>();

export const DictionaryTooltip: React.FC<{
    word: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    visible: boolean;
}> = ({ word, anchorRef, visible }) => {
    const [entry, setEntry] = useState<DictionaryEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch definition after a hover delay (with cache)
    useEffect(() => {
        if (!visible || !word) {
            setEntry(null);
            setError(null);
            return;
        }

        const cacheKey = word.toLowerCase();

        // Instant cache hit — no loading needed
        const cached = lookupCache.get(cacheKey);
        if (cached) {
            if (cached.type === 'entry') {
                setEntry(cached.entry);
                setError(null);
            } else {
                setEntry(null);
                setError(cached.error);
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        timerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cacheKey)}`
                );
                if (!res.ok) {
                    const msg = res.status === 404 ? 'No definition found' : 'Dictionary unavailable';
                    lookupCache.set(cacheKey, { type: 'error', error: msg });
                    setError(msg);
                    setEntry(null);
                } else {
                    const data: DictionaryEntry[] = await res.json();
                    const first = data[0] ?? null;
                    if (first) {
                        lookupCache.set(cacheKey, { type: 'entry', entry: first });
                    } else {
                        lookupCache.set(cacheKey, { type: 'error', error: 'No definition found' });
                    }
                    setEntry(first);
                    setError(first ? null : 'No definition found');
                }
            } catch {
                // Don't cache network errors — allow retry
                setError('Network error');
                setEntry(null);
            } finally {
                setLoading(false);
            }
        }, HOVER_DELAY_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, word]);

    // Reposition tooltip when visible / on scroll
    const updatePosition = useCallback(() => {
        if (!anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({
            top: rect.top - 8,       // 8px gap above chip
            left: rect.left + rect.width / 2,
        });
    }, [anchorRef]);

    useEffect(() => {
        if (!visible) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [visible, updatePosition]);

    // Recompute position when content changes (loading → loaded)
    useEffect(() => {
        if (visible) updatePosition();
    }, [visible, entry, loading, updatePosition]);

    if (!visible) return null;

    return (
        <div
            className="dictionary-tooltip"
            style={{ top: pos.top, left: pos.left }}
        >
            <div className="dict-tooltip-inner">
                {loading && (
                    <div className="dict-loading">
                        <div className="dict-spinner" />
                        <span>Looking up "{word}"…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="dict-error">{error}</div>
                )}

                {!loading && entry && (
                    <>
                        <div className="dict-word-row">
                            <span className="dict-word">{entry.word}</span>
                            {entry.phonetic && (
                                <span className="dict-phonetic">{entry.phonetic}</span>
                            )}
                        </div>
                        {entry.meanings.slice(0, 2).map((m, mi) => (
                            <div key={mi} className="dict-meaning">
                                <span className="dict-pos">{m.partOfSpeech}</span>
                                <ol className="dict-defs">
                                    {m.definitions.slice(0, 3).map((d, di) => (
                                        <li key={di}>
                                            {d.definition}
                                            {d.example && (
                                                <span className="dict-example">"{d.example}"</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </>
                )}
            </div>
            <div className="dict-tooltip-arrow" />
        </div>
    );
};
