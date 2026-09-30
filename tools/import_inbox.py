#!/usr/bin/env python3
"""Convert entries from the vault's Language Content Inbox (markdown) into the
app's content files: content/<grammar|paradigms>/<greek|hebrew>/<slug>.html
plus an index.json entry. Text is converted verbatim -- nothing is generated.

Shorthand (e.g. `Goet.`, `ss.`) is read from `Language Content Shorthand.md`
next to the inbox and expanded in titles, Source lines, and bodies.

Usage: import_inbox.py <inbox.md> [--dry-run]
On success (and not --dry-run) the inbox is reset to its header only.
Entries whose title already exists in the index are skipped and reported,
never overwritten.
"""
import hashlib, html, json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEAD = re.compile(r"^##\s+(Grammar|Paradigms?|Readings?)\s*\|\s*(Greek|Hebrew)\s*\|\s*(.+?)\s*$", re.I)


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


ITEM = re.compile(r"^(\s*)([-*]|\d+\.|[a-z]\.)\s+(.*)$")


def is_item(l):
    m = ITEM.match(l)
    # letter markers (a.) only count when indented, so prose like "e.g." is never a list
    return bool(m) and (not re.fullmatch(r"[a-z]\.", m[2]) or bool(m[1]))


def indent(s):
    return len(s.expandtabs(4)) - len(s.expandtabs(4).lstrip())


def render_list(lines):
    """Nested list from markers (-, 1., a.) and indentation. Unmarked lines indented
    under an item become line breaks inside that item."""
    items = []  # (indent, marker, [text lines])
    for l in lines:
        m = ITEM.match(l) if is_item(l) else None
        if m:
            items.append([indent(l), m[2], [m[3]]])
        elif items:
            items[-1][2].append(l.strip())

    def build(pos, level):
        m = items[pos][1]
        tag, attr = ("ul", "") if m in "-*" else (("ol", ' type="a"') if m[0].isalpha() else ("ol", ""))
        html_out = [f"<{tag}{attr}>"]
        while pos < len(items) and items[pos][0] == level:
            html_out.append("<li>" + "<br>".join(inline(t) for t in items[pos][2]))
            pos += 1
            if pos < len(items) and items[pos][0] > level:
                sub, pos = build(pos, items[pos][0])
                html_out.append(sub)
            html_out.append("</li>")
        html_out.append(f"</{tag}>")
        return "".join(html_out), pos

    result, pos = "", 0
    while pos < len(items):
        chunk, pos = build(pos, items[pos][0])
        result += chunk
    return result


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
        elif is_item(l):
            j = i
            while j < len(lines) and lines[j].strip() and (is_item(lines[j]) or lines[j][:1] in " \t"):
                j += 1
            out.append(render_list(lines[i:j])); i = j
        else:
            j = i; para = []
            while j < len(lines) and lines[j].strip() and not lines[j].startswith((">", "###")) and not lines[j].lstrip().startswith("|") and not is_item(lines[j]):
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
            cur = {"kind": {"paradigms": "paradigm", "readings": "reading"}.get(m[1].lower(), m[1].lower()), "lang": m[2].lower(), "title": m[3], "lines": []}
            entries.append(cur)
        elif cur is not None:
            if not fence and re.fullmatch(r"-{3,}", line.strip()):
                continue  # horizontal rule between inbox entries, not content
            cur["lines"].append(line)
        else:
            header.append(line)
    return header, entries


def load_shorthand(path):
    """Bullet lines of the form `- abbr = expansion`; longest abbreviation wins."""
    pairs = []
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^-\s+(\S+)\s*=\s*(.+?)\s*$", line)
            if m: pairs.append((m[1], m[2]))
    return sorted(pairs, key=lambda p: -len(p[0]))


def expand(text, pairs):
    """Replace an abbreviation only when it starts a token (not mid-word).
    Expansions ending in a symbol (e.g. section signs) absorb following spaces."""
    for abbr, full in pairs:
        tail = r"[ \t]*" if full.endswith("\u00a7") else ""
        text = re.sub(r"(?<!\w)" + re.escape(abbr) + tail, lambda m: full, text)
    return text


def slug(title):
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:50] or "entry-" + hashlib.md5(title.encode()).hexdigest()[:6]


def split_verses(lines):
    """Split a passage with inline verse numbers ("1 text 2 text ...") into
    [(n, text, para)]. A blank line in the inbox starts a new paragraph; para is
    True on the first verse of each paragraph. Numbers must run 1..N in order
    or ValueError is raised."""
    blocks, cur = [], []
    for l in lines:
        if l.strip(): cur.append(l.strip())
        elif cur: blocks.append(" ".join(cur)); cur = []
    if cur: blocks.append(" ".join(cur))
    verses = []
    for block in blocks:
        parts = re.split(r"(?:(?<=\s)|^)(\d+)\s+", block)
        if parts[0].strip() or len(parts) < 3:
            raise ValueError("a paragraph does not begin with a verse number")
        for i in range(1, len(parts), 2):
            verses.append((int(parts[i]), parts[i + 1].strip(), i == 1))
    if [n for n, _, _ in verses] != list(range(1, len(verses) + 1)):
        raise ValueError("verse numbers are not sequential from 1: " + ", ".join(str(n) for n, _, _ in verses))
    return verses


def import_reading(e, dry, written, skipped):
    m = re.fullmatch(r"(.+?)\s+(\d+)", e["title"])
    if not m:
        skipped.append(f"readings/{e['lang']}: {e['title']} (title must be 'Book Chapter')"); return
    book, chap = m[1], int(m[2])
    try:
        verses = split_verses(e["lines"])
    except ValueError as err:
        skipped.append(f"readings/{e['lang']}: {e['title']} ({err})"); return
    path = ROOT / "content" / "readings" / e["lang"] / (slug(book) + ".json")
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    prefix = f"{book} {chap}:"
    if any(v["ref"].startswith(prefix) for v in data):
        skipped.append(f"readings/{e['lang']}: {e['title']} (chapter already exists)"); return
    data += [{"ref": f"{prefix}{n}", "text": t, **({"para": True} if para else {})} for n, t, para in verses]
    data.sort(key=lambda v: tuple(int(x) for x in re.search(r"(\d+):(\d+)$", v["ref"]).groups()))
    written.append(f"readings/{e['lang']}: {e['title']} -> {path.name} ({len(verses)} verses)")
    if not dry:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    inbox = Path(sys.argv[1]); dry = "--dry-run" in sys.argv
    header, entries = parse(inbox)
    pairs = load_shorthand(inbox.parent / "Language Content Shorthand.md")
    for e in entries:
        e["title"] = expand(e["title"], pairs)
        e["lines"] = [expand(l, pairs) for l in e["lines"]]
    if not entries:
        print("No entries found in inbox."); return
    written, skipped = [], []
    for e in entries:
        if e["kind"] == "reading":
            import_reading(e, dry, written, skipped); continue
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
