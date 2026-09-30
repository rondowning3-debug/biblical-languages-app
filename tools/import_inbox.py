#!/usr/bin/env python3
"""Convert entries from the vault's Language Content Inbox (markdown) into the
app's content files: content/<grammar|paradigms>/<greek|hebrew>/<slug>.html
plus an index.json entry. Text is converted verbatim -- nothing is generated.

Usage: import_inbox.py <inbox.md> [--dry-run]
On success (and not --dry-run) the inbox is reset to its header only.
Entries whose title already exists in the index are skipped and reported,
never overwritten.
"""
import hashlib, html, json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEAD = re.compile(r"^##\s+(Grammar|Paradigm)\s*\|\s*(Greek|Hebrew)\s*\|\s*(.+?)\s*$", re.I)


def inline(text):
    t = html.escape(text, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"<em>\1</em>", t)
    return t


def table(lines):
    def cells(l):
        return [c.strip() for c in l.strip().strip("|").split("|")]
    head, body = cells(lines[0]), [cells(l) for l in lines[2:]]
    out = ["<table>", "<thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead>", "<tbody>"]
    for r in body:
        out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
    return out + ["</tbody>", "</table>"]


def body_to_html(lines):
    out, i = [], 0
    while i < len(lines):
        l = lines[i]
        if not l.strip():
            i += 1
        elif l.startswith("###"):
            out.append(f"<h3>{inline(l.lstrip('#').strip())}</h3>"); i += 1
        elif l.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", lines[i + 1]):
            j = i
            while j < len(lines) and lines[j].lstrip().startswith("|"): j += 1
            out += table(lines[i:j]); i = j
        elif l.startswith(">"):
            j = i
            while j < len(lines) and lines[j].startswith(">"): j += 1
            paras, cur = [], []
            for q in lines[i:j]:
                q = q[1:].strip()
                if q: cur.append(q)
                elif cur: paras.append(" ".join(cur)); cur = []
            if cur: paras.append(" ".join(cur))
            out.append("<blockquote>" + "".join(f"<p>{inline(p)}</p>" for p in paras) + "</blockquote>"); i = j
        elif re.match(r"^\s*[-*]\s+", l):
            j = i; items = []
            while j < len(lines) and re.match(r"^\s*[-*]\s+", lines[j]):
                items.append(re.sub(r"^\s*[-*]\s+", "", lines[j])); j += 1
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>"); i = j
        else:
            j = i; para = []
            while j < len(lines) and lines[j].strip() and not lines[j].startswith((">", "###")) and not lines[j].lstrip().startswith("|") and not re.match(r"^\s*[-*]\s+", lines[j]):
                para.append(lines[j].strip()); j += 1
            out.append(f"<p>{inline(' '.join(para))}</p>"); i = j
    return out


def parse(path):
    header, entries, cur, fence = [], [], None, False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("```"):
            fence = not fence
        m = None if fence else HEAD.match(line)
        if m:
            cur = {"kind": m[1].lower(), "lang": m[2].lower(), "title": m[3], "lines": []}
            entries.append(cur)
        elif cur is not None:
            cur["lines"].append(line)
        else:
            header.append(line)
    return header, entries


def slug(title):
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:50] or "entry-" + hashlib.md5(title.encode()).hexdigest()[:6]


def main():
    inbox = Path(sys.argv[1]); dry = "--dry-run" in sys.argv
    header, entries = parse(inbox)
    if not entries:
        print("No entries found in inbox."); return
    written, skipped = [], []
    for e in entries:
        section = "grammar" if e["kind"] == "grammar" else "paradigms"
        folder = ROOT / "content" / section / e["lang"]
        idx_path = folder / "index.json"
        index = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else []
        if any(x["title"] == e["title"] for x in index):
            skipped.append(f"{section}/{e['lang']}: {e['title']} (title already exists)"); continue
        lines = list(e["lines"])
        while lines and not lines[0].strip(): lines.pop(0)
        source = None
        if lines and re.match(r"^source:\s*", lines[0], re.I):
            source = re.sub(r"^source:\s*", "", lines.pop(0), flags=re.I).strip()
        # heading shown in the viewer is the title minus any trailing "(§...)" reference
        h2 = re.sub(r"\s*\([^)]*\)\s*$", "", e["title"]) if source else e["title"]
        parts = [f"<h2>{inline(h2)}</h2>"]
        if source: parts.append(f'<p class="source">{inline(source)}</p>')
        parts += body_to_html(lines)
        name = slug(e["title"]) + ".html"
        if (folder / name).exists(): name = slug(e["title"]) + "-" + hashlib.md5(e["title"].encode()).hexdigest()[:4] + ".html"
        written.append(f"{section}/{e['lang']}: {e['title']} -> {name}")
        if not dry:
            folder.mkdir(parents=True, exist_ok=True)
            (folder / name).write_text("\n".join(parts) + "\n", encoding="utf-8")
            index.append({"title": e["title"], "file": name})
            idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{'Would write' if dry else 'Wrote'} {len(written)} entr{'y' if len(written)==1 else 'ies'}:")
    for w in written: print("  +", w)
    for s in skipped: print("  SKIPPED", s)
    if not dry and not skipped:
        inbox.write_text("\n".join(header).rstrip() + "\n", encoding="utf-8")
        print("Inbox cleared.")
    elif not dry:
        print("Inbox NOT cleared because of skipped entries -- resolve them first.")


main()
