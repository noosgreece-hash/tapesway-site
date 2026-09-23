# TapesWay site

A cinematic scroll-story website for TapesWay. A camera on a Santorini terrace carries the visitor into the lens, along a film strip of island venues, and back out to Oia at dusk. Then the page continues into services, a contact sheet, the process and a booking form.

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it
```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
Any static host works (GitHub Pages, Netlify, Cloudflare Pages, S3). Opening `index.html` straight from disk loads the page, but browsers block the frame requests from `file://`, so the page falls back to the still version.

- `index.html`: the website
- `style-tile.html`: the design board (logo, palette, type, buttons, card, imagery)
- `?motion=off` on the URL previews the reduced-motion version

## Edit the content
Everything visitors read is in **`content.js`**: headlines, story captions, services, process, contact details and form labels. Edit the text, save and reload. Items marked `PLACEHOLDER` are assumptions to confirm before going live, including the email address and the location.

- **Different words on phones:** set `mobileTitle` / `mobileText` on a story item. Use `""` to hide a line on phones.
- **Scroll pacing:** `pacing.desktop` and `pacing.mobile` list each beat's scroll distance (`vh`, in viewport heights) and the stretch of the clip it plays (`from`/`to`, in seconds). A beat with `from` equal to `to` is a still hold. `copy` says which caption shows during the beat.
- **Contact form:** by default it opens the visitor's email app, addressed to `contact.email`. To receive submissions directly, set `contact.formEndpoint` to a form service URL that accepts POST, such as Formspree.

## Logo
The site shows `brand/logo-mark-white.svg` on the dark header, menu and footer (set in `content.js` as `brand.logo`). Use `logo-mark-black.*` on light backgrounds. The mark is sized by height in `styles.css` (`.brand img`: 36 px, 32 px on phones, 40 px in the footer).

## Replace the animation
The story reads frame atlases (several frames per WebP: 2×1 on desktop, 2×2 on phones) listed in `media/<variant>/manifest.json`. Desktop uses `media/desktop/`; phones and portrait tablets use `media/mobile/`. The page chooses one before requesting frames. To rebuild from a new clip (needs ffmpeg):
```sh
COLS=2 ROWS=1 tools/build-sequence.sh source/new-clip.mp4 desktop 1920 90
COLS=2 ROWS=2 tools/build-sequence.sh source/new-clip-9x16.mp4 mobile 720 90
```
The script writes to a fresh folder, checks tile count and sizes, writes the manifest and poster, and only then swaps the folder in.

## Structure
```
index.html, styles.css, app.js   page, design tokens + layout, rendering + scroll story
content.js                       all copy, pacing and media paths
style-tile.html                  design board built from the same tokens
media/desktop, media/mobile      frame atlases, manifest.json, poster.webp
media/stills                     posters for reduced motion + film-frame crops
brand/                           your logo: white and black SVG + PNG, favicon, home-screen icon
fonts/                           self-hosted Fraunces, Inter Tight, IBM Plex Mono (OFL)
source/                          original client clip
docs/VISUAL-STORY.md             storyboard, scene connections, pacing plan
docs/PRODUCTION-NOTES.md         direction, assumptions, provenance, checks, limits
tools/build-sequence.sh          clip → frame atlases + manifest
```
