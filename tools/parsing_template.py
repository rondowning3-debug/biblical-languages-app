#!/usr/bin/env python3
"""Generate a pre-filled parsing tab (tab-separated, paste-ready for Google Sheets)
for one chapter of a reading file.

    python3 tools/parsing_template.py greek 1-john 1 [-o out.tsv] [--copy]

Rows are one per word occurrence: Verse, Pos, Word filled in; the rest blank for
Ron to parse. Tokenizing must match js/parsing.js: split on whitespace, then strip
surrounding punctuation (the elision mark ’ is kept)."""
import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STRIP = ",.·;:!?·;()[]“”\"—\u05C3\u05C0"
HEADER = ["Verse", "Pos", "Word", "Type", "Translation", "Lexical Form",
          "Case", "Person", "Number", "Gender", "Tense", "Voice", "Mood", "Notes"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lang"); ap.add_argument("book_file"); ap.add_argument("chapter", type=int)
    ap.add_argument("-o", "--out"); ap.add_argument("--copy", action="store_true")
    a = ap.parse_args()
    path = ROOT / "content" / "readings" / a.lang / (a.book_file + ".json")
    verses = json.load(open(path, encoding="utf-8"))
    rows = [HEADER]
    for v in verses:
        m = re.match(r"^(.*\S)\s+(\d+):(\d+)$", v["ref"])
        if not m or int(m[2]) != a.chapter: continue
        for pos, tok in enumerate(v["text"].split(), 1):
            w = tok.strip(STRIP)
            if w: rows.append([m[3], str(pos), w] + [""] * (len(HEADER) - 3))
    if len(rows) == 1: sys.exit(f"no verses found for chapter {a.chapter}")
    tsv = "\n".join("\t".join(r) for r in rows) + "\n"
    if a.out: Path(a.out).write_text(tsv, encoding="utf-8")
    if a.copy: subprocess.run(["pbcopy"], input=tsv.encode("utf-8"), check=True)
    if not a.out and not a.copy: sys.stdout.write(tsv)
    print(f"{len(rows)-1} words", file=sys.stderr)

main()
