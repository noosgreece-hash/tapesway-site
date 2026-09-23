# Visual Story

Source: `source/tapesway-original-16x9.mp4`, 12.04 s at 24 fps (289 frames), 1920×1080, supplied by the client. No story footage was generated; the pacing below is fitted to that clip.

| Scene | Visual story | Website copy |
|---|---|---|
| 01 — Opening | A vintage folding camera sits on a white terrace at sunset, the sea behind it. Held still so the page can be read. On desktop, copy sits in the sky and sea to the left of the camera. On phones, the headline sits in a soft sky wash above it, with the button below. | **Every place has a golden hour.** We photograph and film hotels, restaurants and villas across the Cyclades, so guests fall for the place before they book. **Book a shoot** · What we make |
| Transition — Push in | The camera moves toward the lens until the glass fills the frame and the terrace falls away. | No copy — let the motion lead |
| Transition — Inside the camera | Darkness and plum lens glow. Film threads through the body, and only the camera interior is on screen. | No copy — let the motion lead |
| 02 — Development: Terraces | The strip slides past. The first frames show a whitewashed restaurant terrace under bougainvillea, set for dinner. | 01 / 03 **Terraces, set for dinner.** Tables, linen and low sun, photographed the way guests will find them at eight. |
| 02 — Development: The view | The next frames show bougainvillea against the Aegean, then the caldera. | 02 / 03 **The view they book for.** Caldera, sea and bougainvillea, framed from the tables that face them. |
| 02 — Development: Rooms | Interior frames show an amphora and a candlelit dining room. | 03 / 03 **Rooms by candlelight.** Interiors shot in the warm hour, lit to feel like arriving. |
| Transition — Pull out | The film recedes and the camera pulls back out through the lens. | No copy — let the motion lead |
| 03 — Resolution | The camera pulls back to show Oia on the cliff at dusk. It ends small and centred with the village beside it, then holds. | Shot on location. **Your place, on film.** Stills, short films and scroll stories like this one, delivered ready for your website, booking pages and social. **Book a shoot** · What we deliver |

## How the scenes connect

It is one continuous shot. The camera is the subject throughout: we go into it, see what it has recorded, and come back out to where it stands. That lets the whole story run on one pinned stage, with no seams to hide. The three "hero sections" are chapters inside that one stage. Readable HTML fades in over the dark bands above and below the film strip, never over the frames. It holds while those frames pass and fades before the next chapter. The opening and closing copy sit where the camera leaves room: the sky and sea on its left on desktop, or above and below it on phones. After the final hold, the stage releases and the page flows into ordinary sections.

## Scroll pacing plan

Distances are active pinned scroll in viewport heights (vh), counted separately from the 1-viewport stage itself. Frame ranges are in seconds of the clip, so they apply to both the landscape and portrait sequences. The plan lives in `content.js` (`pacing`).

| Beat | In view / framing | Desktop | Phone | Motion |
|---|---|---|---|---|
| Opening hold | Camera on terrace, copy readable | 0.7 | 0.35 | Still-frame hold on 0.0 s |
| Push in | Camera grows to fill the frame (0–3.0 s) | 1.5 | 0.9 | Continuous, ~48 frames/vh |
| Inside the camera | Lens interior, film appears (3.0–4.15 s) | 1.0 | 0.55 | Slower, isolated |
| Terraces | Film strip, terrace frames (4.15–5.3 s) | 1.2 | 0.8 | Continuous, copy held |
| The view | Bougainvillea and caldera frames (5.3–6.55 s) | 1.2 | 0.8 | Continuous, copy held |
| Rooms | Interior frames (6.55–7.9 s) | 1.2 | 0.8 | Continuous, copy held |
| Pull out | Back out through the lens (7.9–9.25 s) | 1.0 | 0.6 | Continuous |
| Reveal | Camera pulls back to show Oia (9.25–12.0 s) | 1.4 | 1.0 | Continuous |
| Final hold | Camera and Oia, closing copy | 0.9 | 0.5 | Still-frame hold on 12.0 s |
| **Total** | | **10.1** | **6.3** | |

Phones compress every beat, especially the holds and the dark "inside" transition, so the story moves with normal thumb swipes. Copy fades take about a quarter of a viewport height, and faded copy drops out of the tab order.

Measured with ordinary mouse-wheel scrolling in headless Chromium at 1440×900: 9,090 px of pinned travel, and the frame advanced steadily through all 289 frames (samples every 1,000 px: 0, 25, 73, 106, 131, 159, 189, 226, 273, 288).
