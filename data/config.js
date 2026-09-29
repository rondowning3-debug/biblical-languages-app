// Central configuration. Fill in the two CSV URLs once the Google Sheet
// tabs ("Greek" and "Hebrew") are published to web as CSV
// (File -> Share -> Publish to web -> select tab -> CSV).
export const VOCAB_SOURCES = {
  greek: {
    csvUrl: "", // e.g. https://docs.google.com/spreadsheets/d/e/XXX/pub?gid=0&single=true&output=csv
  },
  hebrew: {
    csvUrl: "",
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
