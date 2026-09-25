/*
  tapesway site content
  ---------------------
  Every word on the page lives here. Edit the text, save and reload.
  You never need to touch index.html or app.js to change copy.

  Writing conventions:
  - "title" can be one line or a list of lines: ["Line one.", "Line two."]
  - "text" is a list of paragraphs. Inside a paragraph, **word** makes it bold
    and a line break ("\n") starts a new line without a gap.
  - Buttons are { label, href }. An href starting with # jumps to a section:
    #intro, #offer, #approach, #languages, #work, #process, #time, #value, #contact.
*/
window.TAPESWAY_CONTENT = {
  meta: {
    // Search results show about 60 characters of the title and 150 of the description.
    // Keep index.html's <title> and description in step with these (tools/prerender.js does it).
    title: "tapesway · Περιεχόμενο social media για επιχειρήσεις στα νησιά",
    description: "Reels, TikTok και posts κάθε εβδομάδα για ξενοδοχεία, εστιατόρια και επιχειρήσεις στα ελληνικά νησιά, στα αγγλικά, γερμανικά, ιταλικά και γαλλικά. Έδρα η Μύκονος."
  },

  brand: {
    name: "tapesway",
    tagline: "Content with intention.",
    logo: "brand/logo-mark-white.svg" // your mark in white, for the dark header, menu and footer (black version and PNGs in brand/)
  },

  nav: [
    { label: "Τι προσφέρουμε", href: "#offer" },
    { label: "Η προσέγγισή μας", href: "#approach" },
    { label: "Παραδείγματα", href: "#work" },
    { label: "Επικοινωνία", href: "#contact" }
  ],
  navCta: { label: "Ξεκινήστε μαζί μας", href: "#contact" },

  /*
    The same invitation repeated down the page, so there is always a next step:
    a button with a short reassurance under the hero buttons and after the
    sections listed in "after", plus a bar at the bottom of phone screens
    from the first section after the hero (hidden while the contact form is in view).
  */
  cta: {
    label: "Ξεκινήστε μαζί μας",
    href: "#contact",
    note: "Χωρίς δεσμεύσεις. Απαντάμε συνήθως εντός 24 ωρών.",
    after: ["offer", "work", "process", "time"]
  },

  /* Small interface wording: menu, accessibility labels and form messages. */
  ui: {
    skipToContent: "Μετάβαση στο περιεχόμενο",
    homeLabel: "tapesway, επιστροφή στην αρχή",
    mainNav: "Κύρια πλοήγηση",
    footerNav: "Σύνδεσμοι",
    menu: "Μενού",
    openMenu: "Άνοιγμα μενού",
    closeMenu: "Κλείσιμο μενού",
    storyLabel: "Η ιστορία της tapesway",
    backToTop: "Επιστροφή στην αρχή",
    optional: "(προαιρετικό)",
    emailLabel: "Email",
    basedInLabel: "Έδρα",
    formInvalid: "Συμπληρώστε το όνομά σας, ένα έγκυρο email και ένα σύντομο μήνυμα.",
    formSending: "Αποστολή…",
    formSent: "Ευχαριστούμε. Το μήνυμά σας στάλθηκε και θα επικοινωνήσουμε μαζί σας σύντομα.",
    formError: "Το μήνυμα δεν στάλθηκε. Γράψτε μας απευθείας στο {email}.",
    mailtoNote: "Το κουμπί ανοίγει την εφαρμογή email σας με το μήνυμα έτοιμο προς αποστολή.",
    mailtoOpened: "Θα πρέπει να άνοιξε η εφαρμογή email σας με το μήνυμα έτοιμο. Πατήστε αποστολή εκεί για να σταλεί. Αν δεν άνοιξε, γράψτε μας στο {email}.",
    mailSubject: "Νέο μήνυμα από το tapesway.com"
  },

  /*
    Scroll story. The film plays with no text over it. "skipLabel" is only
    shown to keyboard users, who can jump past the story.
  */
  story: {
    skipLabel: "Παράλειψη της ιστορίας",
    skipHref: "#intro",
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
    is a still hold. However fast a scroll, the page stops once at the end of
    "open-hold" (and of any beats named in app.js STORY_STOPS), so the first
    screen is never skipped by accident. The film plays faster than the page.
  */
  pacing: {
    desktop: [
      { id: "open-hold",  vh: 0.3,  from: 0.0,  to: 0.0 },
      { id: "push-in",    vh: 0.95, from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 0.4,  from: 3.0,  to: 4.15 },
      { id: "film-strip", vh: 1.45, from: 4.15, to: 7.9 },
      { id: "pull-out",   vh: 0.45, from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 0.8,  from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.25, from: 12.0, to: 12.0 }
    ],
    mobile: [
      { id: "open-hold",  vh: 0.25, from: 0.0,  to: 0.0 },
      { id: "push-in",    vh: 0.75, from: 0.0,  to: 3.0 },
      { id: "inside",     vh: 0.33, from: 3.0,  to: 4.15 },
      { id: "film-strip", vh: 1.15, from: 4.15, to: 7.9 },
      { id: "pull-out",   vh: 0.4,  from: 7.9,  to: 9.25 },
      { id: "reveal",     vh: 0.65, from: 9.25, to: 12.0 },
      { id: "final-hold", vh: 0.2,  from: 12.0, to: 12.0 }
    ]
  },

  /* Image sequences. The page picks one before requesting any frames. */
  media: {
    desktop: { manifest: "media/desktop/manifest.json" },
    mobile: { manifest: "media/mobile/manifest.json" },
    // Stills used for reduced motion, slow connections and load failures (images only, no text).
    stills: {
      hero: { src: "media/stills/open", alt: "Μια vintage φωτογραφική μηχανή σε λευκή βεράντα στο ηλιοβασίλεμα, με θέα τη θάλασσα." },
      frame: { src: "media/stills/terrace", alt: "Ένα φιλμ με βεράντα εστιατορίου, στρωμένα τραπέζια και βουκαμβίλιες." },
      finale: { src: "media/stills/oia", alt: "Η φωτογραφική μηχανή στη βεράντα, με την Οία και την καλντέρα στο σούρουπο." }
    }
  },

  hero: {
    eyebrow: "Περιεχόμενο με σκοπό.",
    title: ["Δεν αρκεί να σας βλέπουν.", "Πρέπει να θέλουν να έρθουν."],
    text: [
      "Δημιουργούμε περιεχόμενο για τα social media ξενοδοχείων, εστιατορίων και τουριστικών επιχειρήσεων στα ελληνικά νησιά. Περιεχόμενο που παρουσιάζει την επιχείρησή σας με τρόπο αυθεντικό, σύγχρονο και ουσιαστικό.",
      "Γιατί ο επισκέπτης δεν επιλέγει μόνο αυτό που βλέπει. Επιλέγει αυτό που πιστεύει ότι θα ζήσει."
    ],
    highlight: "Η σωστή εικόνα μπορεί να γίνει η αρχή μιας πραγματικής εμπειρίας.",
    actions: [
      { label: "Ξεκινήστε μαζί μας", href: "#contact", style: "primary" },
      { label: "Τι προσφέρουμε", href: "#offer", style: "ghost" }
    ]
  },

  // Section 01
  offer: {
    eyebrow: "Τι προσφέρουμε",
    title: ["Δεν δημιουργούμε απλώς περιεχόμενο.", "Δημιουργούμε λόγους για να σας επιλέξουν."],
    text: [
      "Η παρουσία μιας επιχείρησης στα social media δεν χρειάζεται να είναι απλώς όμορφη.",
      "Χρειάζεται να έχει λόγο ύπαρξης.",
      "Από Reels και TikTok videos μέχρι carousels, posts και φωτογραφικό περιεχόμενο, κάθε δημιουργικό στοιχείο έχει συγκεκριμένο σκοπό."
    ],
    items: [
      {
        number: "01", label: "Προσοχή",
        title: "Κάντε τον επισκέπτη να σταματήσει.",
        text: [
          "Ο επισκέπτης σας βλέπει δεκάδες επιχειρήσεις κάθε μέρα.",
          "Σύντομο, ξεκάθαρο περιεχόμενο που ξεχωρίζει χωρίς να υπερβάλλει, ώστε σε λίγα δευτερόλεπτα να καταλάβει ποιοι είστε."
        ]
      },
      {
        number: "02", label: "Επιθυμία",
        title: "Δείξτε του πώς είναι να βρίσκεται εκεί.",
        text: [
          "Το καλό περιεχόμενο δείχνει. Το καλύτερο κάνει τον θεατή να φαντάζεται τον εαυτό του εκεί.",
          "Αναδεικνύουμε την ατμόσφαιρα, τους ανθρώπους και τις στιγμές που σας κάνουν ξεχωριστούς."
        ]
      },
      {
        number: "03", label: "Εμπιστοσύνη",
        title: "Κάντε τους να σας γνωρίσουν πριν έρθουν.",
        text: [
          "Πριν κλείσει ή σας επισκεφθεί, ο επισκέπτης θέλει να ξέρει τι να περιμένει.",
          "Σας παρουσιάζουμε με φυσικό, αυθεντικό τρόπο: την ατμόσφαιρα, την ποιότητα και τους ανθρώπους σας."
        ]
      },
      {
        number: "04", label: "Συνέπεια",
        title: "Μείνετε στη σκέψη του.",
        text: [
          "Μία καλή δημοσίευση δεν αρκεί. Η συνέπεια χτίζει αναγνωρισιμότητα.",
          "Κάθε εβδομάδα νέο περιεχόμενο για Instagram, TikTok και Facebook, ώστε να είστε εκεί όταν ο επισκέπτης σχεδιάζει το επόμενο ταξίδι του."
        ]
      }
    ]
  },

  // Section 02
  approach: {
    eyebrow: "Η προσέγγισή μας",
    title: ["Οι περισσότεροι δείχνουν την επιχείρησή τους.", "Εμείς δείχνουμε την εμπειρία."],
    statements: [
      "Ένα ξενοδοχείο δεν είναι μόνο ένα δωμάτιο.",
      "Ένα εστιατόριο δεν είναι μόνο ένα τραπέζι.",
      "Μια βόλτα με σκάφος δεν είναι μόνο μια διαδρομή."
    ],
    text: [
      "Πριν δημιουργήσουμε οποιοδήποτε περιεχόμενο, προσπαθούμε πρώτα να καταλάβουμε τι κάνει τη δική σας επιχείρηση διαφορετική."
    ],
    questions: [
      "Τι θα θυμηθεί ο επισκέπτης;",
      "Τι θα τον κάνει να μιλήσει γι’ αυτό;",
      "Τι θα τον κάνει να θέλει να επιστρέψει;"
    ],
    closing: "Εκεί βρίσκεται το περιεχόμενο που αξίζει να δημιουργηθεί."
  },

  // Section 03
  languages: {
    eyebrow: "Για ένα διεθνές κοινό",
    title: ["Η γλώσσα αλλάζει.", "Η επιθυμία όχι."],
    text: [
      "Οι επισκέπτες σας έρχονται από διαφορετικές χώρες, με διαφορετικές συνήθειες και διαφορετικούς τρόπους να αναζητούν την επόμενη εμπειρία τους.",
      "Δημιουργούμε περιεχόμενο με ανθρώπους που επικοινωνούν στα **αγγλικά, γερμανικά, ιταλικά και γαλλικά**, ώστε το μήνυμά σας να ακούγεται φυσικό και οικείο στο κοινό που θέλετε να προσεγγίσετε.",
      "Δεν μεταφράζουμε απλώς τις λέξεις."
    ],
    closing: "Μεταφέρουμε την εμπειρία.",
    codes: ["EN", "DE", "IT", "FR"] // decorative, one per language above
  },

  // Section 04
  work: {
    eyebrow: "Παραδείγματα",
    title: "Μερικά πράγματα είναι καλύτερο να τα δείχνεις.",
    text: [
      "Κάθε επιχείρηση έχει κάτι που την κάνει ξεχωριστή.",
      "Η δουλειά μας είναι να το ανακαλύψουμε και να το μετατρέψουμε σε περιεχόμενο που αξίζει να δει ο κόσμος."
    ],
    /*
      PLACEHOLDER: until real project photos exist, this section shows one
      frame: the camera from the film. Replace "image" with a picture path
      (a name like "media/stills/open" uses its -800/-1600 versions; a full
      file name such as "work/villa.webp" is used as-is).
    */
    image: "media/stills/open",
    imageAlt: "Μια vintage φωτογραφική μηχανή σε λευκή βεράντα στο ηλιοβασίλεμα, με θέα τη θάλασσα."
  },

  // Section 05
  process: {
    eyebrow: "Η διαδικασία",
    title: ["Τρία βήματα.", "Μία σταθερή παρουσία για την επιχείρησή σας."],
    text: [
      "Κρατάμε τη διαδικασία απλή.",
      "Εσείς γνωρίζετε καλύτερα την επιχείρησή σας. Εμείς γνωρίζουμε πώς να μετατρέψουμε αυτή τη γνώση σε περιεχόμενο που λειτουργεί online."
    ],
    steps: [
      {
        number: "01", label: "Κατανοούμε",
        title: "Πρώτα ακούμε.",
        text: [
          "Τι προσφέρετε;\nΤι σας κάνει διαφορετικούς;\nΠοιον θέλετε να προσεγγίσετε;\nΤι θέλετε να αισθανθεί ο επισκέπτης;"
        ]
      },
      {
        number: "02", label: "Δημιουργούμε",
        title: "Μετατρέπουμε την εμπειρία σας σε περιεχόμενο.",
        text: [
          "Εικόνα, γλώσσα, ρυθμός, άνθρωποι και ιστορία, με τρόπο που ταιριάζει σε εσάς.",
          "Τίποτα δεν γίνεται απλώς για να υπάρχει ένα ακόμη post."
        ]
      },
      {
        number: "03", label: "Παραδίδουμε",
        title: "Εσείς συνεχίζετε τη δουλειά σας. Εμείς φροντίζουμε το περιεχόμενό σας.",
        text: [
          "Κάθε εβδομάδα λαμβάνετε νέο περιεχόμενο, έτοιμο προς δημοσίευση.",
          "Εσείς το δημοσιεύετε."
        ]
      }
    ]
  },

  // Section 06
  time: {
    eyebrow: "Περισσότερη ουσία. Λιγότερη ταλαιπωρία.",
    title: ["Εσείς έχετε μια επιχείρηση να τρέξετε.", "Το περιεχόμενο δεν θα έπρεπε να σας παίρνει όλη την ημέρα."],
    text: ["Η δημιουργία σταθερού και ποιοτικού περιεχομένου απαιτεί χρόνο."],
    tasks: ["Ιδέες.", "Σενάρια.", "Οργάνωση.", "Άνθρωποι.", "Γυρίσματα.", "Γλώσσες.", "Επεξεργασία.", "Προγραμματισμός."],
    tasksAfter: "Και όλα αυτά, ξανά και ξανά.",
    highlight: "Με την tapesway, το μεγαλύτερο μέρος αυτής της διαδικασίας γίνεται αυτοματοποιημένα και οργανωμένα, χωρίς να βαραίνει εσάς.",
    items: [
      {
        title: "Λιγότερος χρόνος στην αναζήτηση ιδεών",
        text: [
          "Δεν χρειάζεται να αναρωτιέστε κάθε εβδομάδα τι θα ανεβάσετε. Εμείς βρίσκουμε τις ιδέες και τις κάνουμε περιεχόμενο."
        ]
      },
      {
        title: "Χωρίς συνεχή οργάνωση παραγωγών",
        text: [
          "Εμείς οργανώνουμε γυρίσματα, χώρους και ανθρώπους, ώστε η καθημερινή σας λειτουργία να επιβαρύνεται όσο το δυνατόν λιγότερο."
        ]
      },
    ],
    result: {
      kicker: "Το αποτέλεσμα;",
      lines: [
        "Περισσότερος χρόνος για την επιχείρησή σας.",
        "Λιγότερος χρόνος πίσω από την οθόνη.",
        "Σταθερό περιεχόμενο, χωρίς όλη η διαδικασία να περνά από εσάς."
      ]
    }
  },

  // Section 07
  value: {
    eyebrow: "Η αξία για την επιχείρησή σας",
    title: "Περισσότερα από περιεχόμενο.",
    items: [
      { title: "Περισσότερη ορατότητα", text: "Παρουσία εκεί όπου οι επισκέπτες αναζητούν την επόμενη εμπειρία τους." },
      { title: "Περισσότερη εμπιστοσύνη", text: "Μια εικόνα της επιχείρησής σας που βοηθά τον επισκέπτη να ξέρει τι να περιμένει." },
      { title: "Περισσότερη αναγνωρισιμότητα", text: "Συνεπής παρουσία που βοηθά το όνομά σας να μένει στη μνήμη." },
      { title: "Περισσότερος χρόνος για εσάς", text: "Εσείς επικεντρώνεστε στην επιχείρησή σας. Εμείς αναλαμβάνουμε το περιεχόμενο και τη διαδικασία πίσω από αυτό." }
    ]
  },

  // Section 08
  contact: {
    eyebrow: "Ξεκινήστε μαζί μας",
    title: ["Πείτε μας την ιστορία σας.", "Εμείς θα τη βοηθήσουμε να φτάσει στους σωστούς ανθρώπους."],
    text: [
      "Πείτε μας λίγα λόγια για την επιχείρησή σας, το νησί όπου δραστηριοποιείστε και τους στόχους σας.",
      "Θα γνωρίσουμε την επιχείρησή σας, θα κατανοήσουμε τι την κάνει ξεχωριστή και θα σας παρουσιάσουμε μια ξεκάθαρη πρόταση για το πώς μπορούμε να αναδείξουμε την παρουσία της online.",
      "Χωρίς περίπλοκες διαδικασίες.\nΧωρίς δεσμεύσεις."
    ],
    email: "hello@tapesway.com",
    location: "Mykonos, Greece",
    // Shown in the contact details and the footer, and listed for search engines in index.html.
    instagram: { handle: "@tapesway", url: "https://www.instagram.com/tapesway/" },
    /*
      Leave formEndpoint empty to have the form open the visitor's email app
      with the message filled in and addressed to "email" above (nothing is
      sent by the website itself). Set it to a URL that accepts POST to send
      messages directly; success is only shown when it answers OK.

      It points at the tapesway console's lead endpoint: each message lands
      in the console's Leads inbox and the owner gets an email. The console
      must list this website's address in its ALLOWED_ORIGINS setting (see
      console/README.md). If the console can't be reached, visitors are told
      the message was not sent and are shown the email address instead.
    */
    formEndpoint: "https://console.tapesway.com/api/leads",
    fields: {
      name: "Όνομα",
      business: "Επιχείρηση",
      email: "Email",
      island: "Νησί",
      type: "Τύπος επιχείρησης",
      message: "Μήνυμα"
    },
    messagePlaceholder: "Πείτε μας λίγα περισσότερα για την επιχείρησή σας και τι θα θέλατε να πετύχετε.",
    submitLabel: "Στείλτε το μήνυμά σας",
    note: "Απαντάμε συνήθως εντός 24 ωρών.",
    // Shown under the form: what the details are used for and how to have them deleted.
    privacy: "Χρησιμοποιούμε τα στοιχεία σας μόνο για να απαντήσουμε στο αίτημά σας. Για να τα διαγράψουμε, γράψτε μας στο {email}."
  },

  footer: {
    tagline: "Content with intention.",
    copyright: "© 2026 tapesway. All rights reserved. Thank you."
  }
};
