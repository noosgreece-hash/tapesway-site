# tapesway site

A cinematic scroll-story website for tapesway, in Greek. A camera on a Santorini terrace carries the visitor into the lens, along a film strip of island venues, and back out to Oia at dusk. Then the page continues into the client's copy: intro, what we offer, our approach, languages, examples, process, time, value and a contact form.

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
Everything visitors read is in **`content.js`**, in the order it appears on the page: the tab title, menu, intro, sections 01 to 08, the form and the footer, plus small interface wording (`ui`: menu labels, form messages). The scroll story itself has no text on it. Edit the text, save and reload.

- A `title` can be one line or a list of lines; each line starts on its own, and later lines are set in a quieter tone.
- `text` is a list of paragraphs. `**word**` makes a word bold and `\n` breaks a line inside a paragraph.
- Buttons and menu items are `{ label, href }`; `#offer`, `#approach`, `#languages`, `#work`, `#process`, `#time`, `#value` and `#contact` jump to those sections, `#intro` to the top of the copy.
- `work.image` is a `PLACEHOLDER`: the camera from the film stands in until real project photos are added. No other stills from the film appear in the sections.

- **Scroll pacing:** `pacing.desktop` and `pacing.mobile` list each beat's scroll distance (`vh`, in viewport heights) and the stretch of the clip it plays (`from`/`to`, in seconds). A beat with `from` equal to `to` is a still hold. Smaller `vh` numbers play faster.
- **Lettering on the table:** `story.tableTitle` sets the word and the four corners where it lies on the table in the first frame (`opening`) and the last frame (`ending`), for desktop and for phones. The corners follow the table's perspective. `media/<variant>/table.json` moves it with the table in between. If the clip changes, measure the corners again and re-run `tools/track-table.py` (the phone ones will need it when the portrait clip replaces the interim crop).
- **Contact form:** by default it opens the visitor's email app, addressed to `contact.email`. To receive submissions directly, set `contact.formEndpoint` to a form service URL that accepts POST, such as Formspree.

## Scrolling through the sections
The sections guide the eye rather than show everything at once. Each block arrives in reading order (eyebrow, then the title line by line, then the text, then cards, which rise in with a slight tilt) and then stays still. The four offer cards stack: each holds under the header while the next slides over it, and the one underneath settles back and fades. On wide screens the headings of Approach, Process, Time and Value hold still beside the content scrolling past. Short lists (the three statements, the eight tasks, the result lines) light up one line at a time as they scroll into view. The three questions in Approach and their answer hold at the centre of the screen for most of a screen's worth of scrolling, lighting up one by one, before the page moves on to Languages (only if they fit the screen).

The top bar stays hidden while the film plays and slides in as the story ends (`setupHeaderReveal`). A thin arrow at the top of the first screen shows that the page scrolls; it fades as the story starts. Below the story, wheel and trackpad scrolling ease into place instead of jumping (`setupSmoothWheel`, `TIME` sets how soft it feels); inside the story the film's own glide is left alone, and touch, keyboard, the scrollbar and links keep the browser's own scrolling.

Safety rules in `app.js`: anything that would be taller than the screen does not stick (it simply scrolls), so no text is ever hidden; with reduced motion everything is shown plainly and nothing moves. The code is `setupReveals` and `setupScrollFx`; the styles are under "Motion" in `styles.css`.

## Search engines, link previews and calls to action
- `index.html` carries the title, description, canonical address, link-preview tags (`brand/og-image.jpg`, 1200×630) and a JSON-LD description of the business (only facts stated on the page). `robots.txt` and `sitemap.xml` sit at the root.
- The section text is also written into `index.html` so search engines, link previews and visitors without JavaScript read the whole page. **After editing `content.js`, run `node tools/prerender.js`** (needs Playwright) to refresh it; it also copies `meta.title` and `meta.description` into the head. The live page renders from `content.js` either way.
- `content.js` → `cta` sets the button repeated under the hero and after the sections in `after`, with a short reassurance line, and the bar at the bottom of phone screens (`setupMobileCta`), shown from the first section after the hero until the contact form is on screen.

## Type
Headings use Noto Serif Display and body text Inter Tight, both with full Greek. Fraunces (Latin only) sets the tapesway wordmark, the lettering on the table and the numerals. Each family ships as separate Greek and Latin files, and the browser fetches only what a page uses. Labels are in sentence case on purpose, because upper-casing Greek misplaces accents in some browsers.

## Loading screen
When the film will play, a loading screen with the logo covers the page only until the first seconds of film are ready (the first 6 tiles, plus the rest if it would arrive within 4 seconds). `index.html` preloads the first tiles for the right screen size. It gives up after 3.5 seconds (`PRELOAD_MAX` in `app.js`), and the CSS failsafe lifts it after 8. The rest streams in behind the visitor: the tiles just ahead of the current frame first, then the rest in playback order, or coarse to fine (every 4th tile, then every 2nd) when the measured connection is slow. It is skipped for reduced motion.

Deployment: `vercel.json` sets browser caching (film and brand files for a day to a week, fonts for 30 days, code always revalidated) and `.vercelignore` keeps `source/` (the 21 MB original clip), `tools/` and `docs/` off the public site. If you replace the film, keep the new file names or expect returning visitors to see the old frames for up to a day.

The page always opens at the very top, before the story: a reload does not restore the previous scroll position, and a link such as `#contact` opens at the top too (the menu links still jump within the page).

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
fonts/                           self-hosted Noto Serif Display, Inter Tight, Noto Sans Mono (Greek + Latin) and Fraunces (OFL)
source/                          original client clip
docs/VISUAL-STORY.md             storyboard, scene connections, pacing plan
docs/PRODUCTION-NOTES.md         direction, assumptions, provenance, checks, limits
tools/build-sequence.sh          clip → frame atlases + manifest
tools/track-table.py             clip → table.json (keeps the lettering on the table)
```
