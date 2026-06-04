// src/components/WordAnalyzer.tsx

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  AVAILABLE_DICTIONARIES,
  DictionaryInfo,
  SowpodsDictionary,
  Csw22Dictionary,
  Twl06Dictionary
} from '../dict/scrabbledicts';
import "../css/WordAnalyzer.css";

// ==========================================================
// TYPE DEFINITIONS
// ==========================================================
interface AffixResult {
  affix: string;
  combinedWord: string;
  affixLength: number;
}

interface AnagramResult {
  word: string;
  blanks: number;
}

// ==========================================================
// SUB-COMPONENTS
// ==========================================================

const AffixChip: React.FC<{
  affix: string;
  combinedWord: string;
  isPrefix: boolean;
}> = ({ affix, combinedWord, isPrefix }) => {
  const [prefixPart, wordPart, suffixPart] = isPrefix
    ? [affix, combinedWord.slice(affix.length), '']
    : ['', combinedWord.slice(0, combinedWord.length - affix.length), affix];

  return (
    <div
      className={`affix-chip ${isPrefix ? 'prefix-chip' : 'suffix-chip'}`}
      title={`${isPrefix ? 'Prefix' : 'Suffix'}: "${affix}" → "${combinedWord}"`}
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
  );
};

const StatsSummary: React.FC<{
  inputLength: number;
  prefixCount: number;
  suffixCount: number;
  totalCombinations: number;
  wordExists: boolean;
  blankCount: number;
  activeTab: 'affixes' | 'anagrams';
  anagramCount: number;
}> = ({ inputLength, prefixCount, suffixCount, totalCombinations, wordExists, blankCount, activeTab, anagramCount }) => {
  return (
    <div className="stats-summary">
      {inputLength > 0 && activeTab === 'affixes' && (
        <>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Length: <strong>{inputLength}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Prefixes: <strong>{prefixCount}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Suffixes: <strong>{suffixCount}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Total combos: <strong>{totalCombinations}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            In dict: <strong>{wordExists ? '✅ Yes' : '❌ No'}</strong>
          </span>
        </>
      )}
      {inputLength > 0 && activeTab === 'anagrams' && (
        <>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Length: <strong>{inputLength}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Blanks: <strong>{blankCount > 0 ? `?×${blankCount}` : '0'}</strong>
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            Matches: <strong>{anagramCount}</strong>
          </span>
        </>
      )}
      {inputLength === 0 && (
        <span className="stat-item hint">
          Type a word to search — use <code>?</code> for blank tiles
        </span>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ type: 'prefixes' | 'suffixes' | 'anagrams'; hasBlanks?: boolean }> = ({ type, hasBlanks }) => {
  const icons: Record<string, string> = { prefixes: '↪', suffixes: '↩', anagrams: '🔄' };
  const messages: Record<string, string> = {
    prefixes: 'No valid prefixes found',
    suffixes: 'No valid suffixes found',
    anagrams: hasBlanks ? 'No words match that pattern' : 'No exact anagrams found',
  };
  return (
    <div className="empty-state">
      <span className="empty-icon">{icons[type]}</span>
      <span className="empty-text">{messages[type]}</span>
    </div>
  );
};

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <span>Searching dictionary...</span>
    </div>
  );
};

const GroupedAffixList: React.FC<{
  items: AffixResult[];
  isPrefix: boolean;
  isLoading?: boolean;
  inputLength?: number;
}> = ({ items, isPrefix, isLoading = false, inputLength = 0 }) => {
  const { groups, totalFiltered, totalOriginal } = useMemo(() => {
    // When input is only 1 character, only show 1 and 2 length affixes
    let filteredItems = items;
    const totalOriginal = items.length;

    if (inputLength === 1) {
      filteredItems = items.filter(
        item => item.affixLength === 1 || item.affixLength === 2
      );
    }

    const groups: { [key: number]: AffixResult[] } = {};
    filteredItems.forEach(item => {
      const len = item.affixLength;
      if (!groups[len]) groups[len] = [];
      groups[len].push(item);
    });

    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([length, affixes]) => ({
        length: Number(length),
        affixes: affixes.sort((a, b) => a.affix.localeCompare(b.affix))
      }));

    return {
      groups: sortedGroups,
      totalFiltered: filteredItems.length,
      totalOriginal
    };
  }, [items, inputLength]);

  if (isLoading) return <LoadingSpinner />;
  if (groups.length === 0) return <EmptyState type={isPrefix ? 'prefixes' : 'suffixes'} />;

  return (
    <div className="grouped-affix-list">
      {groups.map(group => (
        <div key={group.length} className="affix-group">
          <div className="affix-group-header">
            {group.length} character{group.length !== 1 ? 's' : ''} ({group.affixes.length})
          </div>
          <div className="affix-group-content">
            {group.affixes.map(item => (
              <AffixChip
                key={item.combinedWord}
                affix={item.affix}
                combinedWord={item.combinedWord}
                isPrefix={isPrefix}
              />
            ))}
          </div>
        </div>
      ))}
      {inputLength === 1 && totalFiltered < totalOriginal && (
        <div className="affix-filter-note">
          Showing only 1–2 character affixes ({totalFiltered} of {totalOriginal} total)
        </div>
      )}
    </div>
  );
};


const AnagramList: React.FC<{
  items: AnagramResult[];
  isLoading?: boolean;
  hasBlanks?: boolean;
}> = ({ items, isLoading = false, hasBlanks = false }) => {
  if (isLoading) return <LoadingSpinner />;
  if (items.length === 0) return <EmptyState type="anagrams" hasBlanks={hasBlanks} />;

  const exactMatches = items.filter(i => i.blanks === 0);
  const wildcardMatches = items.filter(i => i.blanks > 0);

  return (
    <div className="anagram-list-container">
      {exactMatches.length > 0 && (
        <div className="anagram-group">
          <div className="anagram-group-header">
            Exact matches ({exactMatches.length})
          </div>
          <div className="anagram-group-content">
            {exactMatches.map(item => (
              <div key={item.word} className="anagram-chip exact">
                {item.word}
              </div>
            ))}
          </div>
        </div>
      )}
      {wildcardMatches.length > 0 && (
        <div className="anagram-group">
          <div className="anagram-group-header">
            Wildcard matches ({wildcardMatches.length})
          </div>
          <div className="anagram-group-content">
            {wildcardMatches.map(item => (
              <div key={item.word} className="anagram-chip wildcard">
                {item.word}
                <span className="blank-badge">?{item.blanks}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InputVisualization: React.FC<{
  input: string;
  prefixes: AffixResult[];
  suffixes: AffixResult[];
}> = ({ input, prefixes, suffixes }) => {
  const cleanInput = input.toLowerCase().trim();

  const prefixChars = new Set<number>();
  const suffixChars = new Set<number>();

  prefixes.forEach(p => {
    for (let i = 0; i < p.affix.length; i++) {
      prefixChars.add(i);
    }
  });

  suffixes.forEach(s => {
    for (let i = 0; i < s.affix.length; i++) {
      suffixChars.add(cleanInput.length - 1 - i);
    }
  });

  return (
    <div className="visualization-section">
      <div className="highlight-visualization">
        <div className="highlight-row">
          <span className="highlight-label">Your word:</span>
          <div className="highlight-text">
            {input.split('').map((char, index) => {
              const isPref = prefixChars.has(index);
              const isSuf = suffixChars.has(index);

              let className = 'highlight-char';
              if (isPref && isSuf) className += ' both';
              else if (isPref) className += ' prefix';
              else if (isSuf) className += ' suffix';

              return (
                <span key={index} className={className}>
                  {char}
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================================
// DICTIONARY SELECTOR COMPONENT
// ==========================================================

const DictionarySelector: React.FC<{
  dictionaries: DictionaryInfo[];
  activeId: string;
  onSelect: (id: string) => void;
  wordCounts: Record<string, number>;
}> = ({ dictionaries, activeId, onSelect, wordCounts }) => {
  return (
    <div className="dictionary-selector">
      {dictionaries.map(dict => (
        <button
          key={dict.id}
          className={`dict-btn ${dict.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(dict.id)}
          title={`${dict.name}: ${dict.description}`}
        >
          <span className="dict-btn-name">{dict.name}</span>
          <span className="dict-btn-count">
            {wordCounts[dict.id]?.toLocaleString() ?? '0'} words
          </span>
        </button>
      ))}
    </div>
  );
};

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const WordAnalyzer: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [debouncedInput, setDebouncedInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'affixes' | 'anagrams'>('affixes');
  const [activeDictionaryId, setActiveDictionaryId] = useState<string>('sowpods');
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map dictionary IDs to instances
  const dictionaryMap: Record<string, typeof SowpodsDictionary> = useMemo(() => ({
    sowpods: SowpodsDictionary,
    twl06: Twl06Dictionary,
    csw22: Csw22Dictionary,
  }), []);

  const activeDictionary = dictionaryMap[activeDictionaryId];

  // Track word counts for the selector display
  const wordCounts = useMemo(() => ({
    sowpods: SowpodsDictionary.getWordCount(),
    twl06: Twl06Dictionary.getWordCount(),
    csw22: Csw22Dictionary.getWordCount(),
  }), []);

  const blankCount = (input.match(/\?/g) || []).length;

  // Handle dictionary switch — clear input when switching
  const handleDictionaryChange = useCallback((newId: string) => {
    setActiveDictionaryId(newId);
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setIsAnalyzing(true);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedInput(value);
      setIsAnalyzing(false);
    }, 200);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Compute affix results from active dictionary
  const affixResults = useMemo(() => {
    if (!debouncedInput || debouncedInput.trim().length === 0) {
      return {
        prefixes: [] as AffixResult[],
        suffixes: [] as AffixResult[],
        wordExists: false,
        totalCombinations: 0
      };
    }

    const cleanInput = debouncedInput.toLowerCase().trim();

    const wordExists = activeDictionary.check(cleanInput);

    const prefixStrings = activeDictionary.findValidPrefixes(cleanInput);
    const prefixes: AffixResult[] = prefixStrings.map(prefix => ({
      affix: prefix,
      combinedWord: prefix + cleanInput,
      affixLength: prefix.length
    }));

    const suffixStrings = activeDictionary.findValidSuffixes(cleanInput);
    const suffixes: AffixResult[] = suffixStrings.map(suffix => ({
      affix: suffix,
      combinedWord: cleanInput + suffix,
      affixLength: suffix.length
    }));

    return {
      prefixes,
      suffixes,
      wordExists,
      totalCombinations: prefixes.length + suffixes.length
    };
  }, [debouncedInput, activeDictionary]);

  // Anagram search with proper ? wildcard handling
  const anagramResults = useMemo(() => {
    if (!debouncedInput || debouncedInput.trim().length === 0) {
      return [] as AnagramResult[];
    }

    const cleanInput = debouncedInput.toLowerCase().trim();

    // Don't search if input has characters other than letters and ?
    if (!/^[a-z?]+$/.test(cleanInput)) return [];

    const results = activeDictionary.findAnagrams(cleanInput);
    if (results && Array.isArray(results)) {
      results.sort((a, b) => {
        if (a.blanks !== b.blanks) return a.blanks - b.blanks;
        return a.word.localeCompare(b.word);
      });
      return results;
    }

    return [];
  }, [debouncedInput, activeDictionary]);

  const clearInput = useCallback(() => {
    setInput('');
    setDebouncedInput('');
  }, []);

  // Toggle between tabs — single click flips
  const toggleTab = useCallback(() => {
    setActiveTab(prev => prev === 'affixes' ? 'anagrams' : 'affixes');
  }, []);

  return (
    <div className="word-analyzer">
      {/* Header */}
      <div className="analyzer-header">
        <h1>🔤 Scrabble Helper</h1>
        <p className="subtitle">
          Word affix analyzer &amp; anagram finder
          {blankCount > 0 && (
            <span className="blank-indicator">
              {' '} {blankCount} blank{blankCount > 1 ? 's' : ''} (<code>?</code>)
            </span>
          )}
        </p>
      </div>

      {/* Dictionary Selector */}
      <div className="dictionary-selector-container">
        <DictionarySelector
          dictionaries={AVAILABLE_DICTIONARIES}
          activeId={activeDictionaryId}
          onSelect={handleDictionaryChange}
          wordCounts={wordCounts}
        />
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a word... use ? for blanks"
            className="word-input"
            autoFocus
            spellCheck={false}
          />
          {input && (
            <button
              className="clear-button"
              onClick={clearInput}
              title="Clear input"
            >
              ✕
            </button>
          )}
        </div>

        {/* Slider to toggle between Affixes and Anagram tabs */}
        <div className="tab-slider-container" onClick={toggleTab} title="Click to switch mode">
          <div className={`tab-slider-track ${activeTab === 'anagrams' ? 'anagram-active' : ''}`}>
            <div className="tab-slider-thumb"></div>
            <span className="tab-slider-label affix-label">Affixes</span>
            <span className="tab-slider-label anagram-label">Anagrams</span>
          </div>
        </div>

        {/* Stats */}
        {debouncedInput && (
          <StatsSummary
            inputLength={debouncedInput.length}
            prefixCount={affixResults.prefixes.length}
            suffixCount={affixResults.suffixes.length}
            totalCombinations={affixResults.totalCombinations}
            wordExists={affixResults.wordExists}
            blankCount={blankCount}
            activeTab={activeTab}
            anagramCount={anagramResults.length}
          />
        )}
      </div>

      {/* Affix Tab Content */}
      {activeTab === 'affixes' && (
        <>
          {debouncedInput.length > 0 && (
            <InputVisualization
              input={input}
              prefixes={affixResults.prefixes}
              suffixes={affixResults.suffixes}
            />
          )}

          <div className="results-section">
            <div className="affix-columns">
              {/* Prefixes Column */}
              <div className="affix-column">
                <div className="column-header">
                  <span className="column-icon">↪</span>
                  <span className="column-title">Prefixes</span>
                  <span className="column-subtitle">Add before</span>
                  <span className="column-count">
                    {debouncedInput.length === 1
                      ? affixResults.suffixes.filter(p => p.affixLength <= 2).length
                      : affixResults.suffixes.length
                    }</span>
                </div>
                <div className="column-body">
                  <GroupedAffixList
                    items={affixResults.prefixes}
                    isPrefix={true}
                    isLoading={isAnalyzing}
                    inputLength={debouncedInput.length}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="affix-divider" />

              {/* Suffixes Column */}
              <div className="affix-column">
                <div className="column-header">
                  <span className="column-icon">↩</span>
                  <span className="column-title">Suffixes</span>
                  <span className="column-subtitle">Add after</span>
                  <span className="column-count">
                    {debouncedInput.length === 1
                      ? affixResults.prefixes.filter(p => p.affixLength <= 2).length
                      : affixResults.prefixes.length
                    }
                  </span>
                </div>
                <div className="column-body">
                  <GroupedAffixList
                    items={affixResults.suffixes}
                    isPrefix={false}
                    isLoading={isAnalyzing}
                    inputLength={debouncedInput.length}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Anagram Tab Content */}
      {activeTab === 'anagrams' && (
        <div className="results-section">
          <div className="anagram-results-container">
            <div className="anagram-column">
              <div className="column-header">
                <span className="column-icon">🔄</span>
                <span className="column-title">Anagrams</span>
                <span className="column-subtitle">
                  {blankCount > 0 ? 'Wildcard matches' : 'Exact anagrams'}
                </span>
                <span className="column-count">{anagramResults.length}</span>
              </div>
              <div className="column-body">
                <AnagramList
                  items={anagramResults}
                  isLoading={isAnalyzing}
                  hasBlanks={blankCount > 0}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no input */}
      {!debouncedInput && (
        <div className="welcome-section">
          <div className="welcome-icon">🔍</div>
          <p className="welcome-text">
            Type a word above to see its valid affixes or find anagrams
          </p>
          <div className="welcome-examples">
            <p>Try: <code>help</code>, <code>act</code>, <code>test</code>, <code>listen</code></p>
            <p>Use <code>?</code> for blanks: <code>mdo?</code>, <code>c?t</code>, <code>??t</code>, <code>l?st?n</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordAnalyzer;
