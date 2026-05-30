import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SowpodsDictionary } from '../dict/scrabbledicts';
import "../css/WordAnalyzer.css";

const dictionary = SowpodsDictionary;

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
}> = ({ items, isPrefix, isLoading = false }) => {
  const grouped = useMemo(() => {
    const groups: { [key: number]: AffixResult[] } = {};
    items.forEach(item => {
      const len = item.affixLength;
      if (!groups[len]) groups[len] = [];
      groups[len].push(item);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([length, affixes]) => ({
        length: Number(length),
        affixes: affixes.sort((a, b) => a.affix.localeCompare(b.affix))
      }));
  }, [items]);

  if (isLoading) return <LoadingSpinner />;
  if (items.length === 0) return <EmptyState type={isPrefix ? 'prefixes' : 'suffixes'} />;

  return (
    <div className="grouped-affix-list">
      {grouped.map(group => (
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

  // Group by blank count (exact vs wildcard)
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
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color prefix"></span>
            Can have a prefix added
          </div>
          <div className="legend-item">
            <span className="legend-color suffix"></span>
            Can have a suffix added
          </div>
          <div className="legend-item">
            <span className="legend-color both"></span>
            Both possible
          </div>
        </div>
      </div>
    </div>
  );
};

const BlankHelp: React.FC = () => {
  return (
    <div className="blank-help">
      <div className="blank-help-title">💡 Blank tile tips</div>
      <ul>
        <li>Use <code>?</code> for a blank tile (matches any letter)</li>
        <li><code>c?t</code> → finds <em>cat</em>, <em>cot</em>, <em>cut</em>, etc.</li>
        <li><code>??t</code> → finds all 3-letter words ending in <em>t</em></li>
        <li><code>l?st?n</code> → finds <em>listener</em>, <em>listening</em></li>
      </ul>
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
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blankCount = (input.match(/\?/g) || []).length;

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

  // Compute affix results from dictionary
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

    const wordExists = dictionary.check(cleanInput);

    const prefixStrings = dictionary.findValidPrefixes(cleanInput);
    const prefixes: AffixResult[] = prefixStrings.map(prefix => ({
      affix: prefix,
      combinedWord: prefix + cleanInput,
      affixLength: prefix.length
    }));

    const suffixStrings = dictionary.findValidSuffixes(cleanInput);
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
  }, [debouncedInput]);

  // Compute anagram results
  const anagramResults = useMemo(() => {
    if (!debouncedInput || debouncedInput.trim().length === 0) {
      return [] as AnagramResult[];
    }

    const cleanInput = debouncedInput.toLowerCase().trim();

    // Don't search if input has characters other than letters and ?
    if (!/^[a-z?]+$/.test(cleanInput)) return [];

    return dictionary.findAnagrams(cleanInput);
  }, [debouncedInput]);

  const clearInput = useCallback(() => {
    setInput('');
    setDebouncedInput('');
  }, []);

  return (
    <div className="word-analyzer">
      {/* Header */}
      <div className="analyzer-header">
        <h1>🔤 Scrabble Lookup</h1>
        <p className="subtitle">
          Word affix analyzer &amp; anagram finder
          {blankCount > 0 && (
            <span className="blank-indicator">
              {' '}· {blankCount} blank{blankCount > 1 ? 's' : ''} (<code>?</code>)
            </span>
          )}
        </p>
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

        {/* Tab bar */}
        <div className="tab-bar">
          <button
            className={`tab-button ${activeTab === 'affixes' ? 'active' : ''}`}
            onClick={() => setActiveTab('affixes')}
          >
            🔤 Affixes
          </button>
          <button
            className={`tab-button ${activeTab === 'anagrams' ? 'active' : ''}`}
            onClick={() => setActiveTab('anagrams')}
          >
            🔄 Anagram Finder
            {blankCount > 0 && <span className="badge">?{blankCount}</span>}
          </button>
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
                  <span className="column-count">{affixResults.prefixes.length}</span>
                </div>
                <div className="column-body">
                  <GroupedAffixList
                    items={affixResults.prefixes}
                    isPrefix={true}
                    isLoading={isAnalyzing}
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
                  <span className="column-count">{affixResults.suffixes.length}</span>
                </div>
                <div className="column-body">
                  <GroupedAffixList
                    items={affixResults.suffixes}
                    isPrefix={false}
                    isLoading={isAnalyzing}
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
            {/* Blank help shown when input has ? */}
            {blankCount > 0 && (
              <BlankHelp />
            )}

            {/* Main anagram list */}
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
            <p>Use <code>?</code> for blanks: <code>c?t</code>, <code>??t</code>, <code>l?st?n</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordAnalyzer;