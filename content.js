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
    Scroll story. Each chapter's copy is tied to a beat of the pacing plan
    below. "mobileTitle" / "mobileText" replace the desktop words on phones;
    leave them out to reuse the desktop copy, or set to "" to hide.
  */
  story: {
    skipLabel: "Skip the story",
    skipHref: "#services",
    hero: {
      eyebrow: "Photo & film · Cyclades",
      title: "Every place has a golden hour.",
      mobileTitle: "Every place has a golden hour.",
      text: "We photograph and film hotels, restaurants and villas across the Cyclades, so guests fall for the place before they book.",
      mobileText: "",
      primary: { label: "Book a shoot", href: "#contact" },
      secondary: { label: "What we make", href: "#services" },
      scrollCue: "Scroll to roll the film"
    },
    frames: [
      {
        index: "01 / 03",
        title: "Terraces, set for dinner.",
        text: "Tables, linen and low sun, photographed the way guests will find them at eight.",
        mobileText: ""
      },
      {
        index: "02 / 03",
        title: "The view they book for.",
        text: "Caldera, sea and bougainvillea, framed from the tables that face them.",
        mobileText: ""
      },
      {
        index: "03 / 03",
        title: "Rooms by candlelight.",
        text: "Interiors shot in the warm hour, lit to feel like arriving.",
        mobileText: ""
      }
    ],
    finale: {
      eyebrow: "Shot on location",
      title: "Your place, on film.",
      text: "Stills, short films and scroll stories like this one, delivered ready for your website, booking pages and social.",
      mobileText: "Stills, films and scroll stories, ready for your site and bookings.",
      primary: { label: "Book a shoot", href: "#contact" },
      secondary: { label: "What we deliver", href: "#services" }
    }
  },

  /*
    Scroll pacing, in viewport heights of scrolling per beat.
    "from"/"to" are seconds in the source clip, so the same plan works for the
    landscape and portrait sequences. A beat where from === to is a still hold.
    "copy" names which story copy is on screen during that beat.
  */
  pacing: {
    desktop: [
      { id: "open-hold",  vh: 0.7, from: 0.0,  to: 0.0,  copy: "hero" },
      { id: "push-in",    vh: 1.5, from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 1.0, from: 3.0,  to: 4.15 },
      { id: "frame-1",    vh: 1.2, from: 4.15, to: 5.3,  copy: "frame-0" },
      { id: "frame-2",    vh: 1.2, from: 5.3,  to: 6.55, copy: "frame-1" },
      { id: "frame-3",    vh: 1.2, from: 6.55, to: 7.9,  copy: "frame-2" },
      { id: "pull-out",   vh: 1.0, from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 1.4, from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.9, from: 12.0, to: 12.0, copy: "finale" }
    ],
    mobile: [
      { id: "open-hold",  vh: 0.35, from: 0.0,  to: 0.0,  copy: "hero" },
      { id: "push-in",    vh: 0.9,  from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 0.55, from: 3.0,  to: 4.15 },
      { id: "frame-1",    vh: 0.8,  from: 4.15, to: 5.3,  copy: "frame-0" },
      { id: "frame-2",    vh: 0.8,  from: 5.3,  to: 6.55, copy: "frame-1" },
      { id: "frame-3",    vh: 0.8,  from: 6.55, to: 7.9,  copy: "frame-2" },
      { id: "pull-out",   vh: 0.6,  from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 1.0,  from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.5,  from: 12.0, to: 12.0, copy: "finale" }
    ]
  },

  /* Image sequences. The page picks one before requesting any frames. */
  media: {
    desktop: { manifest: "media/desktop/manifest.json" },
    mobile: { manifest: "media/mobile/manifest.json" },
    // Composed stills used for reduced motion, slow connections and load failures.
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
