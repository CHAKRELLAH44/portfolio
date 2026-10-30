"""Static checks for the portfolio. Run from anywhere:  python tools/check.py [--strict]

Errors (exit code 1):
  - a local src/href/url()/asset path that points to a missing file
  - an asset file that nothing references (see KEEP for deliberate exceptions)
Warnings (errors with --strict):
  - a page with no <main> or with more or fewer than one <h1>
  - an image without an alt attribute
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "projects.html", "hidden-me.html", "contact.html", "404.html", "admin.html"]
TEXT = {".html", ".css", ".js", ".md", ".xml", ".json", ".yml", ".webmanifest"}
# Assets kept on purpose although no page uses them yet.
KEEP = ("assets/projects/taxi/", "assets/projects/exams/")
ATTRS = ("src", "href", "poster", "data-light-src")
ASSET_RX = re.compile(r"assets/[A-Za-z0-9_\-./+]+")
URL_RX = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.h1, self.main, self.no_alt = [], 0, 0, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.h1 += tag == "h1"
        self.main += tag == "main"
        if tag == "img" and "alt" not in a:
            self.no_alt += 1
        for k in ATTRS:
            if a.get(k):
                self.refs.append(a[k])
        for s in (a.get("data-screenshots") or "").split(","):
            if s.strip():
                self.refs.append(s.strip())


def local(ref):
    ref = ref.split("#")[0].split("?")[0]
    if not ref or ref.startswith("/") or re.match(r"^[a-z][a-z0-9+.-]*:", ref, re.I):
        return None
    return ref


errors, warnings = [], []
referenced = set()

for name in PAGES:
    path = ROOT / name
    if not path.exists():
        errors.append(f"{name}: page is missing")
        continue
    p = Page()
    p.feed(path.read_text(encoding="utf-8"))
    for ref in p.refs:
        r = local(ref)
        if r and not (ROOT / r).exists():
            errors.append(f"{name}: missing file {ref}")
    if p.main != 1:
        warnings.append(f"{name}: {p.main} <main> elements (want 1)")
    # admin.html shows its lock screen and its dashboard one at a time, each with its own h1
    if p.h1 != 1 and name != "admin.html":
        warnings.append(f"{name}: {p.h1} <h1> elements (want 1)")
    if p.no_alt:
        warnings.append(f"{name}: {p.no_alt} <img> without alt")

for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in TEXT or {".git", "tools"} & set(path.relative_to(ROOT).parts):
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    rel = path.relative_to(ROOT).as_posix()
    for token in ASSET_RX.findall(text):
        token = token.rstrip(".")
        referenced.add(token)
        if not (ROOT / token).exists() and not token.endswith("/"):
            errors.append(f"{rel}: missing asset {token}")
    if path.suffix == ".css":
        for ref in URL_RX.findall(text):
            r = local(ref)
            if r and not (path.parent / r).exists():
                errors.append(f"{rel}: missing file in url() {ref}")

for asset in sorted((ROOT / "assets").rglob("*")):
    rel = asset.relative_to(ROOT).as_posix()
    if asset.is_file() and rel not in referenced and not rel.startswith(KEEP):
        errors.append(f"unreferenced asset {rel}")

strict = "--strict" in sys.argv
for w in warnings:
    print(("ERROR  " if strict else "warn   ") + w)
for e in errors:
    print("ERROR  " + e)
print(f"{len(errors) + (len(warnings) if strict else 0)} error(s), {0 if strict else len(warnings)} warning(s)")
sys.exit(1 if errors or (strict and warnings) else 0)
