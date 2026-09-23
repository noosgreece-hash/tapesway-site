/*
  TapesWay site content
  ---------------------
  Edit the words, links and media paths here. Every section of the page is
  rendered from this object, so you never need to touch index.html or app.js
  to change copy. Save the file and reload the page to see the change.

  Items marked PLACEHOLDER are assumptions made while building the draft.
  Replace them with real details before publishing.
*/
window.TAPESWAY_CONTENT = {
  brand: {
    name: "TapesWay",
    tagline: "Photo & film for island hospitality", // PLACEHOLDER: confirm positioning
    logo: "brand/logo-mark-white.svg", // your mark in white, for the dark header, menu and footer (black version and PNGs in brand/)
    logoAlt: "TapesWay"
  },

  nav: [
    { label: "Story", href: "#story" },
    { label: "What we make", href: "#services" },
    { label: "How it works", href: "#process" },
    { label: "Contact", href: "#contact" }
  ],
  navCta: { label: "Book a shoot", href: "#contact" },

  /*
    Scroll story. The film plays with no text over it. "skipLabel" is only
    shown to keyboard users, who can jump past the story.
  */
  story: {
    skipLabel: "Skip the story",
    skipHref: "#services",
    /*
      Lettering that lies on the table whenever the table is in view: in the
      opening shot and in the closing shot, where it stays as the page scrolls
      on. For each sequence, "opening" and "ending" give its four corners in
      pixels of the first and last frame (far-left, far-right, near-right,
      near-left), drawn in the table's perspective. media/<variant>/table.json
      (made by tools/track-table.py) carries it through the moving frames.
      Measure again and re-run the tracker if the clip changes.
    */
    tableTitle: {
      text: "TAPESWAY",
      desktop: {
        opening: [[367, 960], [1487, 960], [1577, 1035], [277, 1035]],
        ending: [[307, 850], [1613, 850], [1770, 985], [150, 985]]
      },
      mobile: {
        opening: [[120, 975], [482, 975], [510, 1040], [100, 1040]],
        ending: [[85, 955], [519, 955], [540, 1010], [70, 1010]]
      }
    }
  },

  /*
    Scroll pacing, in viewport heights of scrolling per beat. Smaller numbers
    play faster. "from"/"to" are seconds in the source clip, so the same plan
    works for the landscape and portrait sequences. A beat where from === to
    is a still hold.
  */
  pacing: {
    desktop: [
      { id: "open-hold",  vh: 0.15, from: 0.0,  to: 0.0 },
      { id: "push-in",    vh: 1.2,  from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 0.5,  from: 3.0,  to: 4.15 },
      { id: "film-strip", vh: 1.9,  from: 4.15, to: 7.9 },
      { id: "pull-out",   vh: 0.6,  from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 1.05, from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.3,  from: 12.0, to: 12.0 }
    ],
    mobile: [
      { id: "open-hold",  vh: 0.1,  from: 0.0,  to: 0.0 },
      { id: "push-in",    vh: 0.8,  from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 0.35, from: 3.0,  to: 4.15 },
      { id: "film-strip", vh: 1.25, from: 4.15, to: 7.9 },
      { id: "pull-out",   vh: 0.45, from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 0.7,  from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.2,  from: 12.0, to: 12.0 }
    ]
  },

  /* Image sequences. The page picks one before requesting any frames. */
  media: {
    desktop: { manifest: "media/desktop/manifest.json" },
    mobile: { manifest: "media/mobile/manifest.json" },
    // Stills used for reduced motion, slow connections and load failures (images only, no text).
    stills: {
      hero: { src: "media/stills/open", alt: "A vintage folding camera on a white terrace at sunset, facing the sea." },
      frame: { src: "media/stills/terrace", alt: "A strip of film showing a restaurant terrace dressed with white tablecloths under bougainvillea." },
      finale: { src: "media/stills/oia", alt: "The camera on a white terrace with Oia and the caldera behind it at dusk." }
    }
  },

  services: {
    eyebrow: "What we make",
    title: "Pictures that do the booking work.",
    intro: "One shoot, planned around your light, gives you the stills, the films and the web story. Everything is delivered sized and ready for where it will live.",
    items: [
      {
        title: "Photography",
        text: "Rooms, terraces, tables and details, shot through golden and blue hour.",
        points: ["Edited stills for web and booking platforms", "Print-resolution masters", "Detail and food sets"],
        image: "media/stills/frame-terrace.webp",
        imageAlt: "Terrace tables under pink bougainvillea."
      },
      {
        title: "Film",
        text: "Short brand films and cut-downs that carry the mood of a stay or a dinner.",
        points: ["Hero film for your homepage", "Vertical cut-downs for social", "Ambient loops without sound"],
        image: "media/stills/frame-sea.webp",
        imageAlt: "The caldera and the Aegean under a clear evening sky."
      },
      {
        title: "Scroll stories",
        text: "Cinematic web sequences like this page, built from your own footage.",
        points: ["Desktop and mobile versions", "Editable text over the motion", "Fast, still-image fallbacks"],
        image: "media/stills/frame-room.webp",
        imageAlt: "A candlelit dining room with a terracotta amphora."
      }
    ]
  },

  process: {
    eyebrow: "How it works",
    title: "One plan, built around the light.",
    steps: [
      { label: "Scout", text: "We walk the venue with you, note where the sun falls and plan each shot around it." },
      { label: "Shoot", text: "We shoot through golden hour, blue hour and service, planned around your guests." },
      { label: "Deliver", text: "You get edited stills, films and web-ready sequences, named and sized for each use." }
    ],
    note: "Every venue gets its own plan and schedule."
  },

  contactSheet: {
    eyebrow: "Contact sheet",
    title: "Frames from the reel.",
    items: [
      { image: "media/stills/frame-terrace.webp", alt: "A whitewashed restaurant terrace set for dinner.", caption: "Terrace, before service" },
      { image: "media/stills/frame-bloom.webp", alt: "Bougainvillea over a sea view.", caption: "Bougainvillea, 7 pm" },
      { image: "media/stills/frame-room.webp", alt: "A warm dining room with an amphora.", caption: "Dining room, candlelight" },
      { image: "media/stills/frame-sea.webp", alt: "The caldera cliffs over a deep blue sea.", caption: "Caldera, from the terrace" }
    ]
  },

  contact: {
    eyebrow: "Book a shoot",
    title: "Tell us about your place.",
    text: "Share the venue, the island and the season you have in mind. We reply with a light plan and dates.",
    email: "hello@tapesway.example", // PLACEHOLDER: replace with the real inbox
    location: "Santorini · Cyclades", // PLACEHOLDER: confirm base
    /*
      Leave formEndpoint empty to have the form open the visitor's email app
      with the details filled in (nothing is sent by the website itself).
      Set it to a form service URL that accepts POST (for example a Formspree
      endpoint) to send submissions directly; success is only shown when that
      service answers OK.
    */
    formEndpoint: "",
    submitLabel: "Send request",
    mailtoSubmitLabel: "Open email to send",
    mailtoNote: "This opens your email app with your details filled in. Nothing is sent until you press send there.",
    fields: {
      name: "Your name",
      venue: "Venue name",
      email: "Email",
      island: "Island",
      when: "Preferred month",
      message: "What would you like to show?"
    }
  },

  footer: {
    note: "Draft site. Copy and contact details are placeholders until confirmed.",
    copyright: "© 2026 TapesWay"
  }
};
