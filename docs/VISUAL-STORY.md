# Visual Story

Source: `source/tapesway-original-16x9.mp4`, 12.04 s at 24 fps (289 frames), 1920×1080, supplied by the client. No story footage was generated; the pacing below is fitted to that clip.

The film plays with no text over it (changed at the client's request on 2026-09-23). The page's copy starts in the sections after the story.

| Scene | Visual story | Website copy |
|---|---|---|
| 01 — Opening | A vintage folding camera sits on a white terrace at sunset, the sea behind it. A small scroll cue sits at the bottom and fades as soon as the film moves. | None |
| Transition — Push in | The camera moves toward the lens until the glass fills the frame and the terrace falls away. | None |
| Transition — Inside the camera | Darkness and plum lens glow. Film threads through the body. | None |
| 02 — Film strip | The strip slides past: a terrace set for dinner, bougainvillea over the Aegean, the caldera, an amphora and a candlelit room. | None |
| Transition — Pull out | The film recedes and the camera pulls back out through the lens. | None |
| 03 — Resolution | The camera pulls back to show Oia on the cliff at dusk. On the held last frame, TAPESWAY inks itself onto the tabletop in front of the camera, letter by letter, in perspective, with the camera's shadow falling across it. It stays on the table as the page scrolls on into the sections. | TAPESWAY (lettering on the table) |

## How the scenes connect

It is one continuous shot. The camera is the subject throughout: we go into it, see what it has recorded, and come back out to where it stands. That lets the whole story run on one pinned stage, with no seams to hide. After a short final hold, the stage releases and the page flows into ordinary sections.

## Scroll pacing plan

Distances are active pinned scroll in viewport heights (vh), counted separately from the 1-viewport stage itself. Frame ranges are in seconds of the clip, so they apply to both the landscape and portrait sequences. The plan lives in `content.js` (`pacing`).

| Beat | In view | Desktop | Phone |
|---|---|---|---|
| Opening hold | Camera on terrace | 0.15 | 0.1 |
| Push in | Camera grows to fill the frame (0–3.0 s) | 1.2 | 0.8 |
| Inside the camera | Lens interior, film appears (3.0–4.15 s) | 0.5 | 0.35 |
| Film strip | Terrace, view and room frames (4.15–7.9 s) | 1.9 | 1.25 |
| Pull out | Back out through the lens (7.9–9.25 s) | 0.6 | 0.45 |
| Reveal | Camera pulls back to show Oia (9.25–12.0 s) | 1.05 | 0.7 |
| Final hold | Camera and Oia; TAPESWAY writes onto the table | 0.6 | 0.45 |
| **Total** | | **6.0** | **4.1** |

The first version was 10.1 (desktop) and 6.3 (phone), with holds for text. Without text, the holds are short and the motion itself runs about 1.5 times faster.

Measured with ordinary mouse-wheel scrolling in headless Chromium at 1440×900: 5,400 px of pinned travel, and the frame advanced steadily through all 289 frames (samples every 1,000 px: 0, 37, 100, 150, 205, 279).

The lettering only appears on the held last frame, because the camera is still moving slightly until then and lettering on a moving table would slide.
