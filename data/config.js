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

// Flashcard pacing. Words are ordered by the sheet's optional "frequency"
// column (highest first) and unlocked in batches of like frequency. A new
// batch only opens once enough of the previous batch is mastered.
export const PACING_CONFIG = {
  newPerDay: 10,          // max new words introduced per language per day
  minBatchSize: 20,       // adjacent frequency values merge until a batch has at least this many words
  masteryInterval: 7,     // a card counts as "mastered" once its review interval is this many days or more
  unlockThreshold: 0.8,   // fraction of the previous batch that must be mastered to open the next
};

// Words above a frequency cutoff are presumed already known: unless the
// sheet's "Star" column is filled for that word, its card is created as
// mastered, with its first review scattered randomly over the next
// `interval` days so they surface rarely. Starred words go through normal
// pacing. Languages not listed here have no presumed-known words.
export const PRESUMED_KNOWN = {
  greek: { minFrequency: 75, interval: 30 },
};
