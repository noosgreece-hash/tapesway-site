# Production notes

## Direction
**Golden hour, on film.** The supplied clip suggested the positioning: a camera on a Santorini terrace, a film strip of island venues, then Oia at dusk. The site treats it as a darkroom and a white terrace. Since 2026-09-23 (client's request) the page is black, cool greys and a premium navy (#1C2B4A accent, #0F1A2E dark sections), with brass #C79A5B as the one warm note; the earlier bougainvillea pink was replaced by navy. Frames on the page are presented as film: sprocket edges, ink borders and mono frame labels. Type (since the Greek copy, 2026-09-23): Noto Serif Display for headings, Inter Tight for body and labels, Fraunces for the wordmark, table lettering and numerals, Noto Sans Mono for small Latin details. All are self-hosted (SIL OFL, licences in `fonts/`).

## Assumptions (replace when confirmed)
- **Copy:** all section copy is the client's own Greek text (supplied 2026-09-23): a weekly social-media content service for businesses on the Greek islands, main action "Ξεκινήστε μαζί μας". Email hello@tapesway.gr, based in Mykonos, Greece. Interface wording the copy did not cover (menu and accessibility labels, form messages, image descriptions, the "Έδρα" label) was written to match and lives in `content.js` under `ui`.
- **Examples section:** the copy marks it `[PORTFOLIO / WORK SHOWCASE]`. Until real project work exists it shows one frame, the camera from the supplied film. At the client's request (2026-09-23) no other stills from the film appear in the sections.
- **No invented credibility:** the site has no clients, testimonials, prices, counts or awards.
- **Contact form:** it opens the visitor's email app with the details filled in, and says so on the page. Setting `contact.formEndpoint` in `content.js` to a form service sends submissions directly. The page shows success only when that service answers OK.

## Asset provenance
| Asset | Origin | Notes |
|---|---|---|
| `source/tapesway-original-16x9.mp4` | Supplied by the client | HEVC 1920×1080, 24 fps, 12.04 s, 21.1 MB. Kept unmodified. |
| `media/desktop/` | Extracted from the original | 289 frames at full 1920×1080, packed 2×1 into 145 WebP atlases (q90, photo preset), 21.9 MB |
| `media/mobile/` | **Interim:** 608×1080 centre crop of the original | 289 frames, 73 atlases (q90, photo preset), 9.7 MB. The crop drifts 40 px right over 9–12 s to keep the camera centred. To be replaced by the Higgsfield 9:16 reframe. |
| `media/stills/` | Extracted from the original | Full-frame stills (open, terrace, bloom, room, oia) at 800/1600 px (q85/q88), plus four single film frames cropped at native size for cards and the contact sheet (q90) |
| `brand/logo-mark-*.png` | Supplied by the client | Official TapesWay mark (PNG, 1275×1233, transparent). White and black versions made from its own transparency, trimmed with 2% padding; 64 px favicon and 180 px home-screen icon (white mark on ink). Shapes not redrawn. |
| `brand/logo-mark-*.svg` | Traced from the client's PNG | Single-path vector trace, used on the site so the mark stays sharp at any size. Checked against the supplied PNG: 99.5% pixel overlap after aligning bounds. |

### Higgsfield jobs (account credits used: 3 logo images + 111 for the reframe)
| Job | Model | Status | Result |
|---|---|---|---|
| `20add5e3-f5e6-4f75-9d94-260bfa0f7370` | recraft_v4_1 · vector · 1:1 · 2k | done | Concept A, Aperture reel (SVG) |
| `9078dad5-7f81-4f4f-8fec-660cafee81fb` | recraft_v4_1 · vector · 1:1 · 2k | done | Concept B, Film path (SVG) |
| `aa1b6fdc-bb10-427f-9ded-8fba89e218c6` | recraft_v4_1 · vector · 1:1 · 2k | done | Concept C, Sunset frame (SVG) |
| `995b177a-a7fd-47f1-a931-980c65666d08` | reframe · 9:16 · 1080p · source media `d83415ed-1096-4b31-8fbf-df98b47a8526` | done | Portrait version of the supplied clip: H.264 1080×1920, 24 fps, 289 frames, 12.04 s, 10.3 MB, frame-for-frame with the original. A brightness check in Higgsfield's sandbox found no black or empty bands at 0, 1.5, 5.9 or 11.9 s. Not yet visually inspected. |

The three logo concepts were superseded when the client supplied their own logo (see `brand/`). They stay on Higgsfield's CDN and are not used.

Logo prompts (Recraft V4.1, `model_type: vector`, background `#F6EFE4`):
- **A:** "Minimal vector logo for "TapesWay", a photo and film studio in the Greek islands. Symbol: a circular camera lens aperture whose six blades form a spiral that doubles as a film reel … wordmark "TapesWay" set in an elegant high-contrast serif with a subtle italic W. Near-black #141215 on warm cream #F6EFE4, one small brass #C79A5B accent …"
- **B:** "… a single strip of 35mm film with sprocket holes that bends into a gentle S-curve like a winding cliffside path … wordmark "TAPESWAY" in widely letter-spaced geometric sans-serif capitals … one bougainvillea magenta #C8246C sprocket accent …"
- **C:** "… a rounded-corner camera viewfinder frame (four corner brackets) enclosing a half sun setting on a straight horizon line … wordmark "TapesWay" in a refined modern serif. Deep aegean blue #1E3A4C on warm cream, sun in brass #C79A5B …"

Why reframe for mobile: it recomposes the same footage to 9:16, so camera geometry, lighting, timing and every seam stay identical to desktop. Frames extracted from it drop straight into the same pacing plan, because the pacing is written in seconds.

## Remaining steps
1. Download the reframe result, from an environment that can reach `d8j0ntlcm91z4.cloudfront.net`.
2. Download the reframe (`.../hf_20260923_193316_995b177a-a7fd-47f1-a931-980c65666d08.mp4` on the same host). Check it (sky and table extended, no seams, camera fully in frame, readable top and bottom space), save it as `source/tapesway-reframe-9x16.mp4`, then run
   `COLS=2 ROWS=2 tools/build-sequence.sh source/tapesway-reframe-9x16.mp4 mobile 720 90`.
   Re-check the phone screenshots. With real sky above the camera, the mobile hero wash in `styles.css` (`.hero-wash`) can probably be lightened.

## Measurements
- Desktop sequence: 21.9 MB over 145 requests.
- Mobile sequence: 9.7 MB over 73 requests.
- Memory: decoded atlases are capped at about 170 MB (10 desktop atlases, which is 20 frames; 16 mobile atlases). The tiles within 2 of the current one are kept, and the least recently used of the rest are closed.
- Playback: the drawn position follows the scroll position on a critically damped spring (`OMEGA` 6.5 in `app.js`), and native scrolling is untouched. When scrolling stops, the film keeps gliding and slows to rest over about a second, without overshooting. Measured after a quick burst of wheel scrolling: 2–3 frames per screen refresh, easing to 1, at rest after about 0.8 s (desktop) and 1.1 s (phone). Every drawn picture is one whole frame of the clip, never a blend of two, and it is scaled with the browser's high-quality filter. Jumps of more than one viewport height in a single frame, such as anchor links or the End key, cut straight to the new position. Up to six atlases ahead in the scroll direction are decoded ahead of time. Measured with steady 100 px wheel notches in headless Chromium, playback advanced at most 2 frames per screen refresh on desktop and 3 on a phone, with 2–3 decode misses per full pass.
- Fonts: 330 KB total, two of them preloaded.

## Loading
A loading screen (the logo and a brass progress line) covers the page while the film downloads. Atlases stream in playback order, six at a time. The screen lifts once all of them are in and the first four are decoded, or after 12 seconds, whichever comes first. With throttled connections in headless Chromium: 50 Mbit/s desktop lifted after 4.7 s, 20 Mbit/s phone after 4.8 s, and a full wheel scroll straight afterwards had no missing frames. At 4 Mbit/s on a phone it lifted at the 12-second cap with 42 of 73 atlases in, so the second half of the story can still stutter briefly on very slow connections. The screen is not shown for reduced motion or for deep links such as `#contact`, and it hides itself after 20 s even if the script fails.

## Picture quality
The first build looked washed out and soft. Two causes, both fixed: the clip is 10-bit HEVC, and encoding WebP straight from its YUV lost colour (converting to RGB first, `format=bgra`, restores it; red-channel PSNR against the source went from 37 dB to 43 dB); and blending neighbouring frames left ghosting at rest. A frame captured from the page at 1920×1080 matches the source frame at 41 dB PSNR, against 19 dB for the frames either side, so no neighbouring frame bleeds in.

## Checks performed (headless Chromium via Playwright)
- Desktop 1440×900 and 1280×720, tablet 1024×768 and 820×1180, phones 390×844 and 360×640. Screenshots were taken at every beat plus each section. No horizontal overflow and no console errors.
- Each viewport requested only its own sequence (desktop: 73 desktop atlases, 0 mobile; phone: the reverse). Resizing across the breakpoint aborted and freed the old sequence and loaded only the new one.
- Reduced motion: no manifest or frame requests, and the static story is shown. A failing manifest, or failing frames, falls back to the static story.
- Menu: opens with focus on Close, Tab cycles inside it, Escape closes it and returns focus to the menu button, and a link closes it and lands below the fixed header. The header stays fixed after the story ends.
- Ordinary wheel scrolling forward through the whole story advanced frames steadily (see `VISUAL-STORY.md`). Scrolling back with the wheel from the end, at 1280×720, only ever decreased the frame (288 → 0) and returned to the opening frame.

## Not verified
- Real-device smoothness (iOS Safari, Android Chrome), the mobile URL-bar resize behaviour, and actual load speed on real networks. File sizes above are not speed measurements.
- The mobile sequence is the interim crop, so the final portrait composition is not reviewed yet.
