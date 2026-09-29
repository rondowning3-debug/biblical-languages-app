# Grammar content format

Each language folder (`greek/`, `hebrew/`) has:

- `index.json` — an array of topics: `[{ "title": "Present Active Indicative", "file": "present-active-indicative.html" }, ...]`
- One `.html` file per topic (plain HTML fragment, not a full page) containing the actual paradigm/notes content, rendered directly into the topic viewer.

Content here should come from Ron's own resources (Goetchius, Ross, etc.), not generated — this file structure is just the scaffold.
