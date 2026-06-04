// src/components/WordResultChip.tsx

import React, { useState, useRef, useCallback } from 'react';
import { DictionaryTooltip } from './DictionaryTooltip';

// ==========================================================
// AFFIX CHIP — renders a single prefix/suffix result
// ==========================================================

export const AffixChip: React.FC<{
    affix: string;
    combinedWord: string;
    isPrefix: boolean;
}> = ({ affix, combinedWord, isPrefix }) => {
    const [hovered, setHovered] = useState(false);
    const chipRef = useRef<HTMLDivElement>(null);

    const [prefixPart, wordPart, suffixPart] = isPrefix
        ? [affix, combinedWord.slice(affix.length), '']
        : ['', combinedWord.slice(0, combinedWord.length - affix.length), affix];

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    return (
        <>
            <div
                ref={chipRef}
                className={`affix-chip ${isPrefix ? 'prefix-chip' : 'suffix-chip'}`}
                title={`${isPrefix ? 'Prefix' : 'Suffix'}: "${affix}" → "${combinedWord}"`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {isPrefix ? (
                    <span className="affix-preview">
                        <span className="affix-highlight">{prefixPart}</span>
                        <span className="affix-base">{wordPart}</span>
                    </span>
                ) : (
                    <span className="affix-preview">
                        <span className="affix-base">{wordPart}</span>
                        <span className="affix-highlight">{suffixPart}</span>
                    </span>
                )}
            </div>
            <DictionaryTooltip
                word={combinedWord}
                anchorRef={chipRef}
                visible={hovered}
            />
        </>
    );
};

// ==========================================================
// ANAGRAM CHIP — renders a single anagram result
// ==========================================================

export const AnagramChip: React.FC<{
    word: string;
    blanks: number;
}> = ({ word, blanks }) => {
    const [hovered, setHovered] = useState(false);
    const chipRef = useRef<HTMLDivElement>(null);
    const isExact = blanks === 0;

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    return (
        <>
            <div
                ref={chipRef}
                className={`anagram-chip ${isExact ? 'exact' : 'wildcard'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {word}
                {!isExact && <span className="blank-badge">?{blanks}</span>}
            </div>
            <DictionaryTooltip
                word={word}
                anchorRef={chipRef}
                visible={hovered}
            />
        </>
    );
};
