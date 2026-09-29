# Reading content format

Each book file (referenced by `file` in `data/config.js`'s `READING_CONFIG`) is a JSON array of verse objects:

```json
[
  { "ref": "1 John 1:1", "text": "Ὃ ἦν ἀπ’ ἀρχῆς..." },
  { "ref": "1 John 1:2", "text": "..." }
]
```

The reading module slices this array into fixed-size chunks (`versesPerSitting` in config — 5 for Greek, 3 for Hebrew) and tracks how far you've gotten per language in the browser's local storage. "Mark as Read & Continue" advances to the next chunk, or the next book once the current one is finished.

Text should come from a real critical text / your own reading software export, not generated — this scaffold is empty until you add it.
