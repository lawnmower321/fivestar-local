// Every string on the site lives here so you only edit this one file.
//
// TODO before pushing traffic:
// 1. Set up email forwarding for hello@fivestarlocal.pro (free via your
//    registrar or improvmx.com) so the mailto CTAs actually reach you.
// 2. When your Stripe payment links exist, paste them into pricing.tiers[].href
//    below (they currently fall back to mailto).
// 3. After the first real install, add the case study numbers to `proof`.
// 4. Set site.reviewUrl to your real Google review link — the hero demo will
//    then show an "open the real thing" link at the end of the simulation.
// 5. PLANNED: "Meet the team" section — photo of each founder + 2-sentence
//    bios (who you are, why you started this, that you install in person).
//    Expand the `team` block below into { title, body, members: [{ name,
//    role, photo, bio }] } once headshots exist.
// 6. Footer details: set site.location, site.phone, and site.social when you
//    want them public. Each renders only when non-null — leave them null
//    rather than guessing.

export const content = {
  site: {
    name: "FiveStar Local",
    email: "hello@fivestarlocal.pro",
    // Your real Google review link (e.g. https://g.page/r/XXXX/review). null hides it.
    reviewUrl: null as string | null,
    // Footer details. Each renders only when filled — leave null rather than
    // guessing, an unfilled field is invisible but a wrong one is a lie.
    location: null as string | null, // e.g. "Based in Norwalk, CT"
    phone: null as string | null,    // e.g. "(203) 555-0134"
    social: [] as { label: string; href: string }[],
  },
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "What you get", href: "#what-you-get" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  hero: {
    eyebrow: "NFC review cards · installed in person",
    headline: "Turn happy customers into 5-star Google reviews",
    highlight: "with one tap",
    subhead:
      "A small card on your counter. Your customer taps it with their phone, your Google review page opens, and the review happens before they're out the door. We come to you and set the whole thing up while you watch.",
    cta: "See pricing",
    ctaSecondary: "See how it works",
    tapHint: "Try it — click the stand",
    // Pinned to the hero's base — fills the measured ~250px dead zone and
    // gives the three most-asked questions a one-click path.
    quickLinks: [
      { label: "See pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
      { label: "What you get", href: "#what-you-get" },
    ],
  },
  // The copy actually printed on the physical counter stand in the hero.
  // The headline is two lines because that is how it reads on the real
  // product; where the break goes is layout, so the <br> lives in the
  // component and only the two lines live here.
  stand: {
    headlineLine1: "Leave us a",
    headlineLine2: "Google review",
    tapLabel: "Tap your phone here",
  },
  // The simulated review that plays when someone clicks the hero card
  demo: {
    author: "You",
    posting: "Posting publicly across Google",
    reviewText: "Tapped the card at the counter and I was done in fifteen seconds. Easiest review I've ever left.",
    posted: "Review posted",
    note: "This one's a demo — a real card opens your business's actual Google review page.",
    realLink: "Open our real review page",
  },
  steps: [
    {
      title: "Tap the card",
      body: "Your customer taps the card at checkout. Works with the NFC reader built into every modern phone — no app, no QR hunting.",
    },
    {
      title: "Leave a review",
      body: "Their phone opens your Google review page directly. Five stars takes about fifteen seconds.",
    },
    {
      title: "Climb the rankings",
      body: "Review count and recency are two of Google's strongest local ranking signals. More reviews, higher on the map, more walk-ins.",
    },
  ],
  showcase: {
    title: "One card. Every review.",
    body: "The moment a customer taps a FiveStar card, their phone opens that business's Google review page — ready for five stars.",
  },
  // Example businesses shown sliding through the scanner (illustration only)
  scanItems: [
    { name: "Bella's Bakery", type: "Bakery", rating: "4.9", reviews: 212 },
    { name: "T&J Auto Repair", type: "Auto Shop", rating: "4.8", reviews: 340 },
    { name: "Lotus Nail Studio", type: "Nail Salon", rating: "4.9", reviews: 187 },
    { name: "Riverside Barbershop", type: "Barbershop", rating: "5.0", reviews: 156 },
    { name: "Fresh Coat Painting", type: "Painting Contractor", rating: "4.8", reviews: 98 },
    { name: "Cedar Grill", type: "Restaurant", rating: "4.7", reviews: 421 },
  ],
  whatYouGet: {
    title: "Everything is set up before we leave",
    body: "This isn't a gadget in the mail with an instruction sheet. We program your cards to your exact Google review link, place them, and test them on a real phone in front of you.",
    items: [
      "NFC cards + a counter stand, programmed to your Google review link",
      "In-person setup — tested and working before we walk out",
      "QR code fallback printed on the stand for older phones",
      "Nothing for customers to install, nothing to charge, nothing to maintain",
      "Review replies written for you within 48 hours (Growth plan)",
      "A monthly report: new reviews, rating trend, where you rank (Growth plan)",
    ],
  },
  // Dropbox-style split: what winning the local search actually looks like
  reviewShowcase: {
    eyebrow: "Why reviews",
    title: "Your Google rating is your storefront",
    body: "Nearly 9 in 10 customers check Google reviews before choosing a local business — and most never look past the top result. A steady stream of fresh five-star reviews is what puts you there.",
    points: [
      "Rank higher in “near me” searches on Google Maps",
      "Win the customer before they ever compare you to anyone",
      "Recent reviews beat a big number from three years ago",
    ],
    cta: "See pricing",
    search: {
      query: "bakery near me",
      // `from` values are where the scrub starts; the plain rating/reviews
      // are where it lands. Only the tracked business animates.
      results: [
        {
          name: "Bella's Bakery",
          rating: "4.9",
          reviews: 212,
          fromRating: 3.9,
          fromReviews: 18,
          meta: "Bakery · Open now",
          top: true,
        },
        { name: "Corner Bakehouse", rating: "4.1", reviews: 37, meta: "Bakery · Closes 5 PM", top: false },
        { name: "Daily Loaf Co.", rating: "3.9", reviews: 18, meta: "Bakery · Closes 4 PM", top: false },
      ],
    },
  },
  pricing: {
    title: "Two ways to start",
    body: "No contracts on either. If you're not getting reviews, you can walk away and keep the cards.",
    // href: swap the mailto for your Stripe payment link when it exists
    tiers: [
      {
        name: "Starter",
        price: "$99",
        cadence: "one-time",
        blurb: "The hardware, installed. Yours forever.",
        features: [
          "2 NFC cards + counter stand",
          "Programmed to your review link",
          "In-person setup and staff walkthrough",
          "QR fallback for older phones",
          "No monthly anything, ever",
        ],
        cta: "Get Starter",
        href: null,
        featured: false,
      },
      {
        name: "Growth",
        price: "$29",
        cadence: "/month + $49 setup",
        blurb: "Cards included free — plus we manage your reviews for you.",
        features: [
          "Everything in Starter — cards free",
          "We reply to every Google review in your voice, within 48 hours",
          "An active, answered profile is a ranking signal on its own",
          "Monthly review report with your numbers",
          "Cancel anytime, keep the cards",
        ],
        cta: "Get Growth",
        href: null,
        featured: true,
      },
    ],
    finePrint: "Setup happens at your business — we come to you.",
    // States only what the tiers already promise — no refund language, which
    // has not been agreed to and would be an enforceable commitment.
    guarantee: {
      title: "No contracts, ever",
      body: "If it isn't bringing you reviews, walk away — and keep the cards.",
    },
  },
  // TODO #5 above: grow this into the full "Meet the team" section with photos
  team: {
    title: "Run by two people you'll actually meet",
    body: "FiveStar Local is a two-person local operation. We program every card ourselves, walk it into your business, and answer our own email. If something breaks, you talk to the people who set it up — not a ticket queue.",
  },
  faqs: [
    {
      q: "Do my customers need an app?",
      a: "No. Tapping the card uses the NFC reader built into every modern smartphone. Older phones can scan the QR code on the stand instead.",
    },
    {
      q: "Is this allowed by Google?",
      a: "Yes. The card opens your public review page — the same link Google gives every business. What Google prohibits is paying for reviews or only asking happy customers. We set you up to do it right: the card is there for everyone.",
    },
    {
      q: "What does it cost?",
      a: "Starter is $99 one-time for the cards, stand, and in-person setup. Growth is a $49 setup plus $29/month, which gets you the hardware free and we handle responding to your reviews. No contracts on either.",
    },
    {
      q: "Who writes the review replies on the Growth plan?",
      a: "We do — in your business's voice, within 48 hours of a review landing. You approve the tone once at setup and can change it anytime.",
    },
    {
      q: "How long does setup take?",
      a: "About 15 minutes. We program the cards to your Google Business Profile on the spot, place the stand, and test it on a real phone before we leave.",
    },
    {
      q: "What if I move or rebrand?",
      a: "Cards are re-linkable. If your Google profile changes, we update your card's destination for free.",
    },
    {
      q: "Does the card need charging?",
      a: "Never. NFC chips are passive — no battery, no charging, no maintenance. The same card works for years.",
    },
  ],
  finalCta: {
    title: "Want this on your counter this week?",
    body: "Email us your business name. We'll find you on Google, program a card to your review page, and bring it to you.",
    cta: "Email us",
  },
  intake: {
    title: "Tell us your business name",
    body: "We'll find you on Google, program a card to your review page, and bring it to you.",
    businessLabel: "Business name",
    businessPlaceholder: "Bella's Bakery",
    emailLabel: "Email",
    emailPlaceholder: "you@yourbusiness.com",
    noteLabel: "Anything we should know? (optional)",
    notePlaceholder: "Best time to stop by, what you sell, anything else.",
    submit: "Find me on Google",
    submitting: "Sending…",
    success: "Got it — we'll email you within a day.",
  },
} as const;
