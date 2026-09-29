# Biblical Languages Study App

Personal Greek/Hebrew study tool: vocab flashcards (spaced repetition), grammar reference, and a paced reading progression through the GNT and Hebrew OT.

## Status

Framework scaffold — engine works, content is empty. See `content/grammar/README.md` and `content/readings/README.md` for how to add real content, and `data/config.js` for the two things that need filling in:

1. **Vocab:** Google Sheet CSV URLs (Greek + Hebrew tabs, published to web). See below.
2. **Reading plan:** book order is partially filled in (from Ron's stated progression); extend as decided.

## Running it locally

No build step. Needs to be served over http (not opened as a `file://` path) so the Google Sheets fetch and local JSON fetches work:

```bash
cd "biblical-languages-app"
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Vocab source (Google Sheets)

One spreadsheet, two tabs: `Greek` and `Hebrew`, each with `Word` and `Translation` columns (header row required, more columns can be added freely).

To publish a tab as a fetchable CSV:
1. File → Share → Publish to web
2. Select the specific tab, format: CSV
3. Publish, copy the URL
4. Paste it into `data/config.js` under `VOCAB_SOURCES.greek.csvUrl` / `.hebrew.csvUrl`

Repeat per tab (each has its own URL/gid).

## Reading progression (current plan)

- **Greek:** 1 John → John → Mark → *(TBD)* → Hebrews (hardest last)
- **Hebrew:** Ruth → Genesis (opening chapters) → *(TBD)*

5 verses/sitting in Greek, 3 in Hebrew. Progress and SRS review state are stored in the browser's localStorage (per-browser, not synced).

## Fonts

Greek and Hebrew text anywhere in the app automatically renders in the SBL Greek / SBL Hebrew fonts (`css/fonts/`), via `unicode-range`-scoped `@font-face` rules in `css/style.css` — no per-element markup needed. These fonts are from the Society of Biblical Literature (sbl-site.org/resources/fonts/), designed by John Hudson/Tiro Typeworks, and are free for personal/non-commercial scholarly use per the SBL Font User Agreement (commercial use requires a separate license).
