"""Make assets/brand/logo-light.png, the logo for the cream (light) theme.

    python tools/make_logo_light.py

The original logo (assets/brand/logo.png) is a pale neon glyph with an aqua glow on a transparent
background, so it vanishes on cream. This keeps its shape and alpha and recolours it with the light
theme's colours: the bright core becomes ink (#38291F) and the glow becomes orange (#F28A29).
The pages swap the two files with the existing data-light-src mechanism (js/core.js).
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "brand" / "logo.png"
DST = ROOT / "assets" / "brand" / "logo-light.png"
INK = (0x38, 0x29, 0x1F)
GLOW = (0xF2, 0x8A, 0x29)


def smoothstep(lo, hi, x):
    t = max(0.0, min(1.0, (x - lo) / (hi - lo)))
    return t * t * (3 - 2 * t)


def main():
    src = Image.open(SRC).convert("RGBA")
    out = Image.new("RGBA", src.size)
    px_in, px_out = src.load(), out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = px_in[x, y]
            if a == 0:
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            core = smoothstep(0.72, 0.93, lum)  # 1 on the bright glyph, 0 in the halo
            color = tuple(round(GLOW[i] + (INK[i] - GLOW[i]) * core) for i in range(3))
            alpha = round(a * (0.45 + 0.55 * core))
            px_out[x, y] = (*color, alpha)
    out.save(DST, optimize=True)
    print(f"wrote {DST.relative_to(ROOT)} ({DST.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
