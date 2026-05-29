import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { BiDirectionalPrefixDictionary } from '../dict/dict';
import "../css/WordAnalyzer.css";
import { SowpodsDictionary } from '../dict/scrabbledicts';

const dictionary = SowpodsDictionary;

// ==========================================================
// TYPE DEFINITIONS
// ==========================================================
interface AffixResult {
  affix: string;         // The prefix or suffix text
  combinedWord: string;  // The full dictionary word formed
  affixLength: number;   // Length of the affix
}

enum DisplayMode {
  ALL = 'all',
  PREFIXES_ONLY = 'prefixes',
  SUFFIXES_ONLY = 'suffixes'
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
        <>
          <span className="affix-preview">
            <span className="affix-highlight">{prefixPart}</span>
            <span className="affix-base">{wordPart}</span>
          </span>
          <span className="affix-arrow">→</span>
          <span className="affix-word">{combinedWord}</span>
        </>
      ) : (
        <>
          <span className="affix-preview">
            <span className="affix-base">{wordPart}</span>
            <span className="affix-highlight">{suffixPart}</span>
          </span>
          <span className="affix-arrow">→</span>
          <span className="affix-word">{combinedWord}</span>
        </>
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
}> = ({ inputLength, prefixCount, suffixCount, totalCombinations, wordExists }) => {
  return (
    <div className="stats-summary">
      {inputLength > 0 && (
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
            In dictionary: <strong>{wordExists ? '✅ Yes' : '❌ No'}</strong>
          </span>
        </>
      )}
      {inputLength === 0 && (
        <span className="stat-item hint">Type a word to see what prefixes and suffixes can be added</span>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ type: 'prefixes' | 'suffixes' }> = ({ type }) => {
  return (
    <div className="empty-state">
      <span className="empty-icon">{type === 'prefixes' ? '↪' : '↩'}</span>
      <span className="empty-text">No valid {type} found</span>
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
  // Group by affix length
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

// ==========================================================
// VISUALIZATION: Show how input breaks into affixes
// ==========================================================

const InputVisualization: React.FC<{
  input: string;
  prefixes: AffixResult[];
  suffixes: AffixResult[];
}> = ({ input, prefixes, suffixes }) => {
  const cleanInput = input.toLowerCase().trim();

  const prefixChars = new Set<number>();
  const suffixChars = new Set<number>();

  // Mark which character indices are part of a prefix
  prefixes.forEach(p => {
    const prefixText = p.affix;
    for (let i = 0; i < prefixText.length; i++) {
      prefixChars.add(i);
    }
  });

  // Mark which character indices are part of a suffix (counting from end)
  suffixes.forEach(s => {
    const suffixText = s.affix;
    for (let i = 0; i < suffixText.length; i++) {
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
              const isPrefix = prefixChars.has(index);
              const isSuffix = suffixChars.has(index);

              let className = 'highlight-char';
              if (isPrefix && isSuffix) {
                className += ' both';
              } else if (isPrefix) {
                className += ' prefix';
              } else if (isSuffix) {
                className += ' suffix';
              }

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

// ==========================================================
// MAIN COMPONENT
// ==========================================================

const WordAnalyzer: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.ALL);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [debouncedInput, setDebouncedInput] = useState<string>('');
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Compute results from dictionary
  const results = useMemo(() => {
    if (!debouncedInput || debouncedInput.trim().length === 0) {
      return {
        prefixes: [] as AffixResult[],
        suffixes: [] as AffixResult[],
        wordExists: false,
        totalCombinations: 0
      };
    }

    const cleanInput = debouncedInput.toLowerCase().trim();

    // Check if the input itself is in the dictionary
    const wordExists = dictionary.check(cleanInput);

    // Find prefixes (words we can prepend to the input)
    // e.g., "un" + "help" = "unhelp" → prefix "un"
    const prefixStrings = dictionary.findValidPrefixes(cleanInput);
    const prefixes: AffixResult[] = prefixStrings.map(prefix => ({
      affix: prefix,
      combinedWord: prefix + cleanInput,
      affixLength: prefix.length
    }));

    // Find suffixes (words we can append to the input)
    // e.g., "help" + "ful" = "helpful" → suffix "ful"
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

  const showPrefixes = displayMode === DisplayMode.ALL || displayMode === DisplayMode.PREFIXES_ONLY;
  const showSuffixes = displayMode === DisplayMode.ALL || displayMode === DisplayMode.SUFFIXES_ONLY;

  return (
    <div className="word-analyzer">
      {/* Header */}
      <div className="analyzer-header">
        <h1>🔤 Word Builder</h1>
        <p className="subtitle">
          See what prefixes and suffixes can be added before and after your word
        </p>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a word (e.g., help, act, test)..."
            className="word-input"
            autoFocus
            spellCheck={false}
          />
          {input && (
            <button
              className="clear-button"
              onClick={() => {
                setInput('');
                setDebouncedInput('');
              }}
              title="Clear input"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${displayMode === DisplayMode.ALL ? 'active' : ''}`}
            onClick={() => setDisplayMode(DisplayMode.ALL)}
          >
            All ({results.totalCombinations})
          </button>
          <button
            className={`filter-btn ${displayMode === DisplayMode.PREFIXES_ONLY ? 'active' : ''}`}
            onClick={() => setDisplayMode(DisplayMode.PREFIXES_ONLY)}
          >
            Prefixes ({results.prefixes.length})
          </button>
          <button
            className={`filter-btn ${displayMode === DisplayMode.SUFFIXES_ONLY ? 'active' : ''}`}
            onClick={() => setDisplayMode(DisplayMode.SUFFIXES_ONLY)}
          >
            Suffixes ({results.suffixes.length})
          </button>
        </div>

        {/* Stats */}
        <StatsSummary
          inputLength={debouncedInput.length}
          prefixCount={results.prefixes.length}
          suffixCount={results.suffixes.length}
          totalCombinations={results.totalCombinations}
          wordExists={results.wordExists}
        />
      </div>

      {/* Visualization */}
      {/* {debouncedInput.length > 0 && (
        <InputVisualization
          input={input}
          prefixes={results.prefixes}
          suffixes={results.suffixes}
        />
      )} */}

      {/* Results Section */}
      <div className="results-section">
        <div className="affix-columns">
          {/* Prefixes Column */}
          <div className={`affix-column ${!showPrefixes ? 'hidden' : ''}`}>
            <div className="column-header">
              <span className="column-icon">↪</span>
              <span className="column-title">Prefixes</span>
              <span className="column-subtitle">Add before</span>
              <span className="column-count">{results.prefixes.length}</span>
            </div>
            <div className="column-body">
              <GroupedAffixList
                items={results.prefixes}
                isPrefix={true}
                isLoading={isAnalyzing}
              />
            </div>
          </div>

          {/* Divider */}
          {displayMode === DisplayMode.ALL && results.totalCombinations > 0 && (
            <div className="affix-divider" />
          )}

          {/* Suffixes Column */}
          <div className={`affix-column ${!showSuffixes ? 'hidden' : ''}`}>
            <div className="column-header">
              <span className="column-icon">↩</span>
              <span className="column-title">Suffixes</span>
              <span className="column-subtitle">Add after</span>
              <span className="column-count">{results.suffixes.length}</span>
            </div>
            <div className="column-body">
              <GroupedAffixList
                items={results.suffixes}
                isPrefix={false}
                isLoading={isAnalyzing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordAnalyzer;
