# Grammar content format

Each language folder (`greek/`, `hebrew/`) has:

- `index.json` — an array of topics: `[{ "title": "Government & Concord", "file": "government-and-concord.html" }, ...]`
- One `.html` file per topic (plain HTML fragment, not a full page) containing the actual notes content, rendered directly into the topic viewer.

The Grammar tab shows one random topic at a time, with a "Show Another" button to swap in a different one — there's no browsable list in the UI (see `content/paradigms/README.md` for the sibling Paradigms tab, same format).

Content here should come from Ron's own resources (Goetchius, Ross, etc.), not generated — this file structure is just the scaffold.
