#!/usr/bin/env python3
"""
Track the tabletop through the opening and the ending of the clip, so the
TAPESWAY lettering stays glued to the table while the camera moves.

The camera sits on the table in both shots, and the shot moves straight
toward it (opening) or away from it (ending). So in each frame the table
around the camera is the reference frame scaled about a fixed centre. This
script measures the camera's base (a dark object on a white table) in every
frame, fits that centre, and writes, for every frame where the table shows,
the scale and offset that carry the reference frame onto it.

Usage (needs ffmpeg and Pillow):
  python3 tools/track-table.py source/clip.mp4 desktop
  python3 tools/track-table.py source/clip.mp4 mobile --crop-x "656 + (min(1, (n - 215) / 73) * 40 if n > 215 else 0)"

--crop-x is the left edge, in source pixels, of the crop a variant was cut
from, as a Python expression of the frame number n (must match the crop
used by build-sequence.sh). Writes media/<variant>/table.json.
"""
import argparse, json, os, subprocess, sys, tempfile
from PIL import Image

SEGMENTS = [  # (reference frame, first frame, last frame): where the table is in view
    (0, 0, 30),
    (288, 237, 288),
]


def measure(path):
    """Bottom edge (y) and left/right extent (x) of the camera base."""
    im = Image.open(path).convert("L"); W, H = im.size; px = im.load(); cx = W // 2
    ys = []
    for x in range(cx - 60, cx + 61, 20):
        y = H - 1
        while y > 300 and px[x, y] > 70: y -= 1
        ys.append(y)
    yb = sorted(ys)[len(ys) // 2]
    if yb >= H - 2: return None
    row = yb - 6
    dark = lambda x: px[x, row] < 90
    l = cx
    while l > 6 and (dark(l) or dark(l - 1) or dark(l - 6)): l -= 1
    r = cx
    while r < W - 7 and (dark(r) or dark(r + 1) or dark(r + 6)): r += 1
    return yb, l, r


def smooth(v, k=2):
    # centred moving average whose window shrinks at the ends, so end frames keep their measured value
    out = []
    for i in range(len(v)):
        r = min(k, i, len(v) - 1 - i)
        out.append(sum(v[i - r:i + r + 1]) / (2 * r + 1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip"); ap.add_argument("variant")
    ap.add_argument("--crop-x", default="0")
    a = ap.parse_args()
    crop_x = lambda n: float(eval(a.crop_x, {"min": min, "max": max}, {"n": n}))
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-i", a.clip, "-vf", "fps=24,format=gray", os.path.join(tmp, "f%03d.png")], check=True)
        count = len(os.listdir(tmp))
        frames = [None] * count
        for ref, f0, f1 in SEGMENTS:
            m = {n: measure(os.path.join(tmp, "f%03d.png" % (n + 1))) for n in range(f0, f1 + 1)}
            if any(v is None for v in m.values()): sys.exit("camera base not found in frames %d-%d" % (f0, f1))
            yb0, l0, r0 = m[ref]
            # Scale from the base's width; centre (cx, cy) fitted by least squares over the segment.
            s = {n: (m[n][2] - m[n][1]) / (r0 - l0) for n in m}
            num_x = num_y = den = 0.0
            for n in m:
                k = 1 - s[n]
                if abs(k) < 1e-3: continue
                num_x += k * (m[n][1] - s[n] * l0) + k * (m[n][2] - s[n] * r0); num_y += k * (m[n][0] - s[n] * yb0); den += k * k
            cx, cy = num_x / (2 * den), num_y / den
            ns = list(range(f0, f1 + 1)); ss = smooth([s[n] for n in ns])
            for n, sc in zip(ns, ss):
                # source coords: p_n = c + sc * (p_ref - c); variant coords subtract that frame's crop offset
                tx = cx * (1 - sc) + sc * crop_x(ref) - crop_x(n)
                ty = cy * (1 - sc)
                frames[n] = [ref, round(sc, 5), round(tx, 2), round(ty, 2)]
            err = max(abs(cy + s[n] * (yb0 - cy) - m[n][0]) for n in m)
            print("frames %d-%d: centre (%.0f, %.0f), scale %.3f-%.3f, worst base error %.1f px" % (f0, f1, cx, cy, min(ss), max(ss), err))
    out = os.path.join("media", a.variant, "table.json")
    with open(out, "w") as fh:
        json.dump({"note": "per frame: [reference frame, scale, x offset, y offset] or null; see tools/track-table.py", "frames": frames}, fh, separators=(",", ":"))
    print("wrote", out)


if __name__ == "__main__":
    main()
