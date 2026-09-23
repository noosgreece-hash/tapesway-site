#!/usr/bin/env bash
# Build a browser-ready frame sequence (2x2 WebP atlases + manifest) from a clip.
#
#   tools/build-sequence.sh <input.mp4> <desktop|mobile> [width] [quality] [crop-filter]
#
# Examples
#   COLS=2 ROWS=1 tools/build-sequence.sh ../source/tapesway-original-16x9.mp4 desktop 1920 80
#   tools/build-sequence.sh ../source/tapesway-reframe-9x16.mp4 mobile 720 72
#
# Writes into media/<variant>.new/, checks it, then swaps it in for media/<variant>/.
# Each atlas holds 4 consecutive frames (left-to-right, top-to-bottom), which keeps
# the request count low; the page reads the layout from manifest.json.
set -euo pipefail
IN="$1"; VARIANT="$2"; W="${3:-1600}"; Q="${4:-70}"; CROP="${5:-}"
FPS=24; COLS="${COLS:-2}"; ROWS="${ROWS:-2}"
cd "$(dirname "$0")/.."
OUT="media/${VARIANT}.new"; rm -rf "$OUT"; mkdir -p "$OUT"
# Convert to RGB before WebP: handing libwebp BT.709 YUV directly washes the colours out.
VF="fps=${FPS}"; [ -n "$CROP" ] && VF="$VF,$CROP"; VF="$VF,scale=${W}:-2:flags=lanczos,format=bgra"
COUNT=$(ffmpeg -v error -i "$IN" -an -vf "fps=${FPS}" -f framemd5 - | grep -vc "^#")
ffmpeg -v error -i "$IN" -an -vf "$VF,tile=${COLS}x${ROWS}" -c:v libwebp -preset photo -quality "$Q" -start_number 0 "$OUT/atlas-%03d.webp"
ffmpeg -v error -i "$IN" -an -vf "$VF" -frames:v 1 -c:v libwebp -preset photo -quality 88 "$OUT/poster.webp"
python3 - "$OUT" "$VARIANT" "$IN" "$FPS" "$COLS" "$ROWS" "$COUNT" <<'PY'
import json, os, subprocess, sys, glob
out, variant, src, fps, cols, rows = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
tiles = sorted(glob.glob(out + "/atlas-*.webp"))
def dims(f):
    w, h = subprocess.check_output(["ffprobe","-v","error","-select_streams","v","-show_entries","stream=width,height","-of","csv=p=0",f]).decode().strip().split(",")
    return int(w), int(h)
pw, ph = dims(out + "/poster.webp")
count = int(sys.argv[7])
aw, ah = dims(tiles[0])
assert aw == pw * cols and ah == ph * rows, ("atlas size mismatch", aw, ah, pw, ph)
assert len(tiles) == -(-count // (cols * rows)), ("tile count mismatch", len(tiles), count)
sizes = [os.path.getsize(t) for t in tiles]
m = {"variant": variant, "source": os.path.basename(src), "fps": fps, "count": count,
     "width": pw, "height": ph, "layout": {"cols": cols, "rows": rows},
     "pattern": "atlas-{n}.webp", "digits": 3, "start": 0, "tiles": len(tiles),
     "poster": "poster.webp", "focalX": 0.5, "focalY": 0.5,
     "totalBytes": sum(sizes) + os.path.getsize(out + "/poster.webp"), "maxTileBytes": max(sizes)}
json.dump(m, open(out + "/manifest.json", "w"), indent=2)
print(json.dumps(m))
PY
rm -rf "media/${VARIANT}.old"; [ -d "media/${VARIANT}" ] && mv "media/${VARIANT}" "media/${VARIANT}.old"
mv "$OUT" "media/${VARIANT}"; rm -rf "media/${VARIANT}.old"
echo "media/${VARIANT} ready"
