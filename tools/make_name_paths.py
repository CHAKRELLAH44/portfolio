"""Print the SVG outlines of the hero name letters (I M A N E), taken from the site's own font.

The hero draws a line that runs around each letter (css/hero.css, .trace). It needs the real glyph outlines, which
CSS cannot give, so this reads assets/fonts/Archivo-Italic-latin.woff2, fixes it at the weight and width the hero
uses (800, 125%) and prints one <svg> per letter in font units, y flipped so the baseline is at y = 0.

    python tools/make_name_paths.py            # print the markup
    python tools/make_name_paths.py --info     # print the font metrics only
"""
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "assets/fonts/Archivo-Italic-latin.woff2"
LETTERS = "IMANE"
WEIGHT, WIDTH = 800, 125


def load():
    font = TTFont(FONT)
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in font["fvar"].axes}
    pins = {tag: v for tag, v in (("wght", WEIGHT), ("wdth", WIDTH)) if tag in axes}
    return instancer.instantiateVariableFont(font, pins), axes


def main():
    font, axes = load()
    upem = font["head"].unitsPerEm
    hhea, os2 = font["hhea"], font["OS/2"]
    if "--info" in sys.argv:
        print("axes", axes)
        print("upem", upem, "hhea", hhea.ascent, hhea.descent, hhea.lineGap, "typo", os2.sTypoAscender, os2.sTypoDescender,
              "win", os2.usWinAscent, os2.usWinDescent, "useTypo", bool(os2.fsSelection & 128))
        return
    asc, desc = hhea.ascent, -hhea.descent  # the viewBox covers the line box the browser uses
    glyphs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    print(f"<!-- upem {upem}, viewBox top {-asc}, height {asc + desc} -->")
    for i, ch in enumerate(LETTERS):
        name = cmap[ord(ch)]
        adv = hmtx[name][0]
        pen = SVGPathPen(glyphs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))  # flip y: baseline stays at 0, up is negative
        print(f'<!-- {ch}: advance {adv} -->')
        print(f'<svg class="trace" viewBox="0 {-asc} {adv} {asc + desc}" aria-hidden="true" focusable="false"><path pathLength="1" d="{pen.getCommands()}"/></svg>')


if __name__ == "__main__":
    main()
