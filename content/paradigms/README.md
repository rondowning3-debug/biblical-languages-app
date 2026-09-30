# Paradigm content format

Same format as `content/grammar/` — each language folder (`greek/`, `hebrew/`) has:

- `index.json` — an array of entries: `[{ "title": "Present Active Indicative — λύω", "file": "pai-luo.html" }, ...]`
- One `.html` file per entry (plain HTML fragment, not a full page) containing the actual paradigm table/notes, rendered directly into the viewer.

The Grammar and Paradigms tabs both show one random entry at a time, with a "Show Another" button to swap in a different one — there's no browsable list in the UI.

Content here should come from Ron's own resources (Mounce, Goetchius, Ross, etc.), not generated — this file structure is just the scaffold.
