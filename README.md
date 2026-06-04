# Scrabble Word Analyzer (Scrabble Lookup)

A React-based dictionary tool for Scrabble players that analyzes words for valid **prefixes**, **suffixes**, and **anagrams** — including support for blank/wildcard tiles (`?`).

## Features

### 🔤 Affix Analyzer
Type any word to instantly discover every valid prefix and suffix that can be added to it according to the official Scrabble (SOWPODS) dictionary.

- **Prefixes** — all valid letter combinations that can be prepended to form a new word
- **Suffixes** — all valid letter combinations that can be appended to form a new word
- **Visual highlights** — each character in your input is color-coded to show whether a prefix, suffix, or both can attach at that position
- **Grouped by length** — results are organized by affix length for easy scanning
- **Smart filtering** — when entering a single-character input, only 1- and 2-letter affixes are shown to prevent overwhelming results

### 🔀 Anagram Finder
Find every anagram of your letters using 3 different wordlists.

- **Exact anagrams** — words using exactly your letters with no blanks
- **Wildcard support** — use `?` to represent blank tiles (matches any single letter)
- **Result grouping** — exact matches and wildcard matches are displayed in separate groups, with wildcard results further grouped by number of blanks used
- **Blank count badges** — each wildcard match shows how many `?` tiles were needed

### 🎯 Interactive UI
- **Debounced input** — results update automatically as you type (200ms delay)
- **Toggle between modes** — single-click slider switches between Affix and Anagram modes
- **Clear button** — quickly reset your search
- **Empty states** — helpful tips shown when no results match
- **Stats bar** — shows length, match counts, blank counts, and dictionary status

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React** (functional components) | UI framework |
| **TypeScript** | Type safety |
| **SOWPODS dictionary** | Official Scrabble word list (UK & international tournament standard) |
| **CSS** | Custom styling (no framework dependency) |
| **React hooks** (`useState`, `useMemo`, `useCallback`, `useRef`, `useEffect`) | State management and performance |

## Getting Started

### Prerequisites
- Node.js (v14 or newer)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd scrabble-lookup

# Install dependencies
npm install

# Start the development server
npm start
