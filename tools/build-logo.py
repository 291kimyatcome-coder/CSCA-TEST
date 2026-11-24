"""Build the CSCA 2026 logo files in logo/ (SVG with text as outlines, plus PNGs).

Fonts come from the embedded woff2 data in css/fonts.css, so the logo uses the
same IBM Plex type as the site. Needs: pip install fonttools brotli uharfbuzz
PNGs are rendered with Playwright (Chromium) via node.
"""
import base64, io, os, re, subprocess, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "logo")

def load_fonts():
    css = open(os.path.join(ROOT, "css", "fonts.css")).read()
    fonts = {}
    for m in re.finditer(r"font-family:'([^']*)';font-style:normal;font-weight:(\d+);[^}]*?"
                         r"base64,([A-Za-z0-9+/=]+)", css):
        fonts[(m.group(1), int(m.group(2)))] = base64.b64decode(m.group(3))
    return fonts

FONTS = load_fonts()

class Face:
    def __init__(self, family, weight):
        data = FONTS[(family, weight)]
        self.tt = TTFont(io.BytesIO(data))
        self.upem = self.tt["head"].unitsPerEm
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.hbfont = hb.Font(hb.Face(hb.Blob(self.tt_bytes())))

    def tt_bytes(self):
        b = io.BytesIO(); self.tt.flavor = None; self.tt.save(b); return b.getvalue()

    def shape(self, text, size, tracking=0.0):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, {"kern": True, "liga": True})
        s = size / self.upem
        out, x = [], 0.0
        for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
            out.append((self.order[info.codepoint], x + pos.x_offset * s, pos.y_offset * s))
            x += pos.x_advance * s + (size * tracking if i < len(buf.glyph_infos) - 1 else 0)
        return out, x, s

    def ink_bounds(self, text, size):
        """Left side bearing of first glyph and right side bearing of the last, in px."""
        from fontTools.pens.boundsPen import BoundsPen
        glyphs, width, s = self.shape(text, size)
        bp = BoundsPen(self.glyphs); self.glyphs[glyphs[0][0]].draw(bp)
        lsb = bp.bounds[0] * s
        bp = BoundsPen(self.glyphs); self.glyphs[glyphs[-1][0]].draw(bp)
        last_adv = self.glyphs[glyphs[-1][0]].width * s
        rsb = last_adv - bp.bounds[2] * s
        return lsb, rsb, width

    def path(self, text, size, x, y, tracking=0.0, anchor="start"):
        glyphs, width, s = self.shape(text, size, tracking)
        if anchor == "middle": x -= width / 2
        elif anchor == "end": x -= width
        pen = SVGPathPen(self.glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        for name, gx, gy in glyphs:
            tp = TransformPen(pen, (s, 0, 0, -s, x + gx, y - gy))
            self.glyphs[name].draw(tp)
        return pen.getCommands(), width

COND = Face("IBM Plex Sans Condensed", 700)
SANS = Face("IBM Plex Sans", 500)

# Palette: the site's own tokens (index.html :root and dark mode)
LIGHT = dict(ink="#16203a", muted="#5a6479", tile="#16203a", ring="#8ea8ff", pick="#d4553a", year="#d4553a")
DARK  = dict(ink="#e6e9f1", muted="#9ba4b7", tile="#2446a6", ring="#c9d5ff", pick="#f0896c", year="#f0896c")

def mark(x, y, size, c):
    """Rounded tile with a 2x2 grid of answer-sheet bubbles; one is filled in.
    The four bubbles are the four syllabus modules / the A-B-C-D choices."""
    r = size * 0.215
    g = size / 240
    cx = [x + 80 * g, x + 160 * g]; cy = [y + 80 * g, y + 160 * g]
    rad, sw = 27 * g, 9 * g
    parts = [f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="{r:.1f}" fill="{c["tile"]}"/>']
    for j, yy in enumerate(cy):
        for i, xx in enumerate(cx):
            if (i, j) == (1, 0):
                parts.append(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="{rad + sw/2:.1f}" fill="{c["pick"]}"/>')
            else:
                parts.append(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="{rad:.1f}" fill="none" '
                             f'stroke="{c["ring"]}" stroke-width="{sw:.1f}"/>')
    return "\n  ".join(parts)

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">\n'
            f'  <title>{title}</title>\n  {body}\n</svg>\n')

def horizontal(c, bg=None):
    pad, tile = 24, 252
    tx = pad + tile + 56                  # text column x
    size = 150
    base1 = pad + 146                     # baseline of "CSCA 2026"
    csca_lsb, _, _ = COND.ink_bounds("CSCA", size)
    x0 = tx - csca_lsb                    # align ink edge of C with text column
    d1, w1 = COND.path("CSCA", size, x0, base1)
    gap = size * 0.16
    d2, w2 = COND.path("2026", size, x0 + w1 + gap, base1)
    _, rsb, _ = COND.ink_bounds("2026", size)
    right = x0 + w1 + gap + w2 - rsb      # ink right edge of line 1
    # Line 2: full name, tracked so it spans exactly the width of line 1
    name, nsize = "CHINA SCHOLASTIC COMPETENCY ASSESSMENT", 23.5
    lsb2, rsb2, nat = SANS.ink_bounds(name, nsize)
    span = right - tx
    tracking = (span - (nat - lsb2 - rsb2)) / (len(name) - 1) / nsize
    d3, _ = SANS.path(name, nsize, tx - lsb2, pad + tile - 28, tracking)
    rule_y = base1 + 30
    w, h = right + pad + 8, tile + 2 * pad
    body = []
    if bg: body.append(f'<rect width="100%" height="100%" fill="{bg}"/>')
    body.append(mark(pad, pad, tile, c))
    body.append(f'<path d="{d1}" fill="{c["ink"]}"/>')
    body.append(f'<path d="{d2}" fill="{c["year"]}"/>')
    body.append(f'<rect x="{tx}" y="{rule_y:.1f}" width="{span:.1f}" height="4" fill="{c["ink"]}" opacity=".18"/>')
    body.append(f'<path d="{d3}" fill="{c["muted"]}"/>')
    return svg(w, h, "\n  ".join(body), "CSCA 2026")

def icon(c, bg=None):
    s = 512
    body = [mark(0, 0, s, c)]
    return svg(s, s, "\n  ".join(body), "CSCA 2026")

def write(name, text):
    p = os.path.join(OUT, name); open(p, "w").write(text); return p

def main():
    os.makedirs(OUT, exist_ok=True)
    files = [
        write("csca-2026-logo.svg", horizontal(LIGHT)),
        write("csca-2026-logo-dark.svg", horizontal(DARK, bg="#0e121a")),
        write("csca-2026-icon.svg", icon(LIGHT)),
    ]
    if "--no-png" not in sys.argv:
        js = r"""
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ deviceScaleFactor: 2 });
  for (const f of process.argv.slice(1)) {
    const svg = fs.readFileSync(f, 'utf8');
    const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); const w = +m[1], h = +m[2];
    await pg.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
    await pg.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
    await pg.locator('svg').screenshot({ path: f.replace(/\.svg$/, '.png'), omitBackground: true });
  }
  await b.close();
})();"""
        subprocess.run(["node", "-e", js, *files], check=True)
    print("\n".join(files))

if __name__ == "__main__":
    main()
