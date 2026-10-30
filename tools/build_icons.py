"""Icon sprite builder (stdlib only).  Run from anywhere:  python tools/build_icons.py [--fetch] [--check]

Every icon lives in tools/icons/NAME.svg as ONE single-colour <path> in a 24x24 box (no fill colour: pages
colour it with CSS). tools/icons/brands.json records the brand colour and the source of each icon.

Default run: scan each HTML page for  href="#i-NAME"  (in the page itself and in the local scripts it loads),
then rewrite that page's sprite, the block between  <!-- icons:start -->  and  <!-- icons:end -->  at the top
of <body>, so it holds exactly the <symbol>s the page uses. Running it twice changes nothing.

  --fetch   download every icon again from its pinned source in brands.json (needs the network), normalise it
            to 24x24 and rewrite tools/icons/*.svg. Only needed when adding or updating an icon.
  --check   change nothing; exit 1 if a page's sprite is out of date.

Add an icon: add an entry to brands.json, run --fetch, use <use href="#i-NAME"/> in the HTML, run again.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "tools" / "icons"
PAGES = ["index.html", "projects.html", "hidden-me.html", "contact.html", "404.html", "admin.html"]
START, END = "<!-- icons:start -->", "<!-- icons:end -->"
USE_RX = re.compile(r"""href=["']#i-([a-z0-9-]+)["']""")
SCRIPT_RX = re.compile(r"""<script[^>]+src=["']([^"'?#:]+)""")
SIZE = 24
CRLF, LF = chr(13) + chr(10), chr(10)
SOURCES = {  # how brands.json "source" values turn into download URLs
    "simple-icons": "https://cdn.jsdelivr.net/npm/simple-icons@{version}/icons/{slug}.svg",
    "devicon": "https://cdn.jsdelivr.net/npm/devicon@{version}/icons/{slug}/{slug}-{variant}.svg",
}


def load_brands():
    return json.loads((ICONS / "brands.json").read_text(encoding="utf-8"))["icons"]


# ---------------------------------------------------------------- path scaling (for non-24x24 sources)
NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
ARGS = {"m": 2, "l": 2, "t": 2, "h": 1, "v": 1, "c": 6, "s": 4, "q": 4, "a": 7, "z": 0}


def fmt(n):
    s = f"{n:.3f}".rstrip("0").rstrip(".")
    s = s.replace("-0", "-") if s.startswith("-0.") else s
    if s.startswith("0."):
        s = s[1:]
    return "0" if s in ("", "-") else s


def scale_path(d, scale, tx, ty):
    """Return path data d scaled by `scale` and shifted by (tx, ty), as absolute-start path data."""
    out, pos, first = [], 0, True
    tok = re.compile(r"\s*,?\s*([MmLlHhVvCcSsQqTtAaZz])|\s*,?\s*(" + NUM + ")")
    cmd, nums = None, []

    def flush():
        nonlocal first
        if cmd is None:
            return
        c = cmd.lower()
        n = ARGS[c]
        if n == 0:
            out.append("z")
            return
        rel = cmd.islower()
        for i in range(0, len(nums) - n + 1, n):
            a = nums[i:i + n]
            # the very first moveto of a path is absolute whatever its case
            r = False if (first and c == "m" and i == 0) else rel
            dx, dy = (0, 0) if r else (tx, ty)
            if c == "a":
                txt = [fmt(a[0] * scale), fmt(a[1] * scale), fmt(a[2]), str(int(a[3])), str(int(a[4])),
                       fmt(a[5] * scale + dx), fmt(a[6] * scale + dy)]
            elif c == "h":
                txt = [fmt(a[0] * scale + dx)]
            elif c == "v":
                txt = [fmt(a[0] * scale + dy)]
            else:
                txt = [fmt(v * scale + (dx if j % 2 == 0 else dy)) for j, v in enumerate(a)]
            if c == "m":  # later pairs after a moveto are implicit linetos
                letter = ("m" if r else "M") if i == 0 else ("l" if r else "L")
            else:
                letter = cmd
            out.append(letter + " ".join(txt))
        first = False

    while pos < len(d):
        m = tok.match(d, pos)
        if not m:
            break
        if m.group(1):
            flush()
            cmd, nums = m.group(1), []
            pos = m.end()
            if cmd.lower() == "a":  # arc flags may be glued to the next number: "a5 5 0 015.6 4"
                nums, pos = read_arc_args(d, pos)
        else:
            nums.append(float(m.group(2)))
            pos = m.end()
    flush()
    return re.sub(r" (?=-)", "", "".join(out))


def read_arc_args(d, pos):
    """Read all argument sets of an arc command starting at pos; handles glued flags."""
    nums = []
    num = re.compile(r"\s*,?\s*(" + NUM + ")")
    flag = re.compile(r"\s*,?\s*([01])")
    while True:
        saved, group = pos, []
        for i in range(7):
            m = (flag if i in (3, 4) else num).match(d, pos)
            if not m:
                break
            group.append(float(m.group(1)))
            pos = m.end()
        if len(group) < 7:
            return nums, saved
        nums += group


def normalise(svg_text, source):
    """Single path, 24x24. Simple Icons are already 24x24 and kept untouched."""
    vb = re.search(r'viewBox="([^"]+)"', svg_text)
    x0, y0, w, h = (float(v) for v in vb.group(1).replace(",", " ").split())
    paths = re.findall(r'<path\b[^>]*?\sd="([^"]+)"', svg_text)
    if not paths:
        raise ValueError("no <path> found")
    if (x0, y0, w, h) == (0, 0, SIZE, SIZE):
        return "".join(paths)
    s = SIZE / max(w, h)
    tx, ty = (SIZE - w * s) / 2 - x0 * s, (SIZE - h * s) / 2 - y0 * s
    return "".join(scale_path(p, s, tx, ty) for p in paths)


def fetch_all():
    brands = load_brands()
    for name, info in sorted(brands.items()):
        url = SOURCES[info["source"]].format(**info)
        raw = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")
        d = normalise(raw, info["source"])
        (ICONS / f"{name}.svg").write_text(icon_file(name, info["title"], d), encoding="utf-8", newline="\n")
        print(f"fetched {name:<14} {info['source']}@{info['version']}")


def icon_file(name, title, d):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">'
            f'<title>{title}</title><path d="{d}"/></svg>\n')


# ---------------------------------------------------------------- sprite
def read_icon(name):
    text = (ICONS / f"{name}.svg").read_text(encoding="utf-8")
    return re.search(r'<path d="([^"]+)"', text).group(1)


def used_icons(page_path):
    text = read(page_path)
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), "", text, flags=re.S)
    names = set(USE_RX.findall(text))
    for src in SCRIPT_RX.findall(text):
        js = ROOT / src
        if js.is_file() and js.suffix == ".js":
            names |= set(re.findall(r"""#i-([a-z0-9-]+)""", read(js)))
    return sorted(names)


def sprite(names):
    lines = [START,
             '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">']
    for n in names:
        lines.append(f'<symbol id="i-{n}" viewBox="0 0 {SIZE} {SIZE}"><path d="{read_icon(n)}"/></symbol>')
    lines += ["</svg>", END]
    return "\n".join(lines)


BLOCK_RX = re.compile(r"[ \t]*" + re.escape(START) + r".*?" + re.escape(END) + r"\n?", re.S)
BODY_RX = re.compile(r"<body\b[^>]*>\n?", re.I)


def read(path):
    with open(path, encoding="utf-8", newline="") as f:
        return f.read()


def rebuild(page, check_only):
    path = ROOT / page
    if not path.exists():
        return False
    names = used_icons(path)
    html = read(path)
    eol = CRLF if CRLF in html else LF
    html = html.replace(CRLF, LF)
    missing = [n for n in names if not (ICONS / f"{n}.svg").exists()]
    if missing:
        print(f"{page}: no source icon for {', '.join(missing)}")
        return True
    if names:
        block = sprite(names) + "\n"
        if START in html:
            new = BLOCK_RX.sub(lambda _m: block, html, count=1)
        else:
            new = BODY_RX.sub(lambda m: m.group(0).rstrip("\n") + "\n" + block, html, count=1)
    else:
        new = BLOCK_RX.sub("", html, count=1)
    if new == html:
        return False
    if not check_only:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(new.replace(LF, eol))
    print(f"{page}: sprite {'is out of date' if check_only else 'updated'} ({len(names)} icons)")
    return True


def main():
    if "--fetch" in sys.argv:
        fetch_all()
    changed = [rebuild(p, "--check" in sys.argv) for p in PAGES]
    if "--check" in sys.argv and any(changed):
        sys.exit(1)
    if not any(changed):
        print("sprites are up to date")


if __name__ == "__main__":
    main()
