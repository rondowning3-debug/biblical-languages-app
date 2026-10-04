// Central configuration. Fill in the two CSV URLs once the Google Sheet
// tabs ("Greek" and "Hebrew") are published to web as CSV
// (File -> Share -> Publish to web -> select tab -> CSV).
export const VOCAB_SOURCES = {
  greek: {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRoUH7TdZ7W71PsT0OxGb3jajBm-9hV8PWF_gaWtd5A6_rhgcaqJhMGVSAQpKDpskmn_6meV1XM6ysX/pub?gid=0&single=true&output=csv",
  },
  hebrew: {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRoUH7TdZ7W71PsT0OxGb3jajBm-9hV8PWF_gaWtd5A6_rhgcaqJhMGVSAQpKDpskmn_6meV1XM6ysX/pub?gid=841375702&single=true&output=csv",
  },
};

// Reading module: fixed verses-per-sitting, and book order from easiest to
// hardest. Order is a starting point per Ron's decisions and can be
// extended/reordered at any time by editing this array.
export const READING_CONFIG = {
  greek: {
    versesPerSitting: 5,
    // Each entry needs a matching content/readings/greek/<file>.json
    // (see content/readings/greek/README.md for the format).
    bookOrder: [
      { label: "1 John", file: "1-john.json" },
      { label: "John", file: "john.json" },
      { label: "Mark", file: "mark.json" },
      // TBD: books between Mark and Hebrews not yet decided
      { label: "Hebrews", file: "hebrews.json" },
    ],
  },
  hebrew: {
    versesPerSitting: 3,
    bookOrder: [
      { label: "Ruth", file: "ruth.json" },
      { label: "Genesis (opening chapters)", file: "genesis-opening.json" },
      // TBD: remainder of progression not yet decided
    ],
  },
};

// Word-by-word parsing for the Reading tab. One Google Sheet per book, one
// tab per chapter, each tab published to web as CSV (File -> Share -> Publish
// to web -> pick the tab -> CSV). Paste each chapter tab's URL below under the
// book label used in the reading config. Generate a chapter's pre-filled rows
// (Verse, Pos, Word) with tools/parsing_template.py. Chapters not listed here
// simply have no clickable words.
export const PARSING_SOURCES = {
  greek: {
    "1 John": {
      1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzoys20_PMJb7rrAmjknUlN8e3RG3hwEbTUeZ2MyrjjplkgZmkR7B73vy4Rz_LEoMqZ1CaeT0LOf1-/pub?gid=0&single=true&output=csv",
    },
  },
};

// Flashcard pacing. Words are ordered by the sheet's optional "frequency"
// column (highest first) and unlocked in batches of like frequency. A new
// batch only opens once enough of the previous batch is mastered.
export const PACING_CONFIG = {
  newPerDay: 10,          // max new words introduced per language per day
  minBatchSize: 20,       // adjacent frequency values merge until a batch has at least this many words
  masteryInterval: 7,     // a card counts as "mastered" once its review interval is this many days or more
  unlockThreshold: 0.8,   // fraction of the previous batch that must be mastered to open the next
};

// Family pacing (root + derivatives), used when a language's sheet tab has a
// "Cognate" column. Rows are entered in book order: a row marked with anything
// in Cognate heads a family; unmarked rows below it are its derivatives (a row
// with no head above it is treated as a head of its own). Cognates are paced
// as the primary stream (batches by frequency, mastery gate counts cognates
// only). A derivative is introduced only when its root is mastered AND its own
// frequency is at or above the floor of the latest opened cognate band, using
// whatever daily slots the cognates leave. Nothing below minFrequency is ever
// introduced. Languages not listed (or tabs without a Cognate column) use the
// flat pacing above.
export const FAMILY_PACING = {
  hebrew: { minFrequency: 50 },
};

// Words above a frequency cutoff are presumed already known: unless the
// sheet's "Star" column is filled for that word, its card is created as
// mastered, with its first review scattered randomly over the next
// `interval` days so they surface rarely. Starred words go through normal
// pacing. Languages not listed here have no presumed-known words.
export const PRESUMED_KNOWN = {
  greek: { minFrequency: 75, interval: 30 },
  // Hebrew is inverted: every word is presumed unknown, and a filled "Star"
  // cell means "I already know this" - seeded as mastered with its first
  // review scattered over the next `interval` days.
  hebrew: { starredOnly: true, interval: 30 },
};
