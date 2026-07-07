// PLACEHOLDER CONTENT — replace with real data before going live.
// Every string on the site lives here so you only edit this one file.

export const content = {
  site: {
    name: "FiveStar Local",
    email: "hello@fivestarlocal.com", // PLACEHOLDER — replace with real email
  },
  nav: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Benefits", href: "#benefits" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" },
  ],
  hero: {
    badge: "Trusted by local businesses",
    headline: "Turn happy customers into 5-star Google reviews",
    highlight: "with one tap",
    subhead:
      "FiveStar Local NFC cards make leaving a review effortless. Your customer taps the card, their phone opens your Google review page, and your rating climbs.",
    cta: "Get Started",
    ctaSecondary: "See how it works",
  },
  steps: [
    {
      title: "Tap the card",
      body: "Hand your customer the FiveStar card. One tap with any modern phone — no app, no QR hunting.",
    },
    {
      title: "Leave a review",
      body: "Their phone opens your Google review page instantly. Five stars takes about fifteen seconds.",
    },
    {
      title: "Climb the rankings",
      body: "More fresh reviews means better local search visibility — and more customers walking in.",
    },
  ],
  benefits: [
    { title: "More reviews, faster", body: "Businesses using tap cards collect reviews dramatically faster than asking alone." },
    { title: "Better local SEO", body: "Review volume and recency are key local ranking signals on Google." },
    { title: "No app required", body: "Works with the NFC reader built into every modern iPhone and Android." },
    { title: "Works on any phone", body: "QR code on the back covers older phones, so nobody is left out." },
    { title: "Unlimited taps", body: "One card, unlimited reviews. No subscriptions, no per-tap fees." },
    { title: "Set up in minutes", body: "We link your card to your Google Business Profile before it ships." },
  ],
  showcase: {
    title: "One card. Every review.",
    body: "A premium NFC card that lives at your counter. No batteries, no app, no fuss — just tap.",
    bullets: [
      "Premium matte finish with your branding",
      "NFC chip + QR fallback on the back",
      "No batteries, no charging, no maintenance",
      "Re-linkable if your Google profile changes",
    ],
  },
  // PLACEHOLDER testimonials — replace with real customer quotes
  testimonials: [
    { name: "Maria G.", business: "Bella's Bakery", quote: "We went from 40 reviews to over 200 in three months. Customers actually enjoy tapping the card." },
    { name: "James T.", business: "T&J Auto Repair", quote: "Simplest marketing money I've ever spent. We show up first on Google Maps in our area now." },
    { name: "Priya S.", business: "Lotus Nail Studio", quote: "My clients tap it at checkout without me even asking. Reviews just happen now." },
    { name: "Dan R.", business: "Riverside Barbershop", quote: "Setup took five minutes. The card looks great on the counter and it just works." },
    { name: "Kelly M.", business: "Fresh Coat Painting", quote: "We close more jobs because people see 5 stars before they even call us." },
    { name: "Omar H.", business: "Cedar Grill", quote: "Our rating went from 4.1 to 4.7. That half star changed our weekends completely." },
  ],
  // PLACEHOLDER stats — replace with real numbers
  // isRating: true renders value/10 as "4.9 ★" instead of a plain count
  stats: [
    { value: 2000, suffix: "+", label: "Businesses served", isRating: false },
    { value: 500000, suffix: "+", label: "Reviews collected", isRating: false },
    { value: 49, suffix: "", label: "Average rating", isRating: true },
  ],
  faqs: [
    { q: "Do my customers need an app?", a: "No. Tapping the card uses the NFC reader built into every modern smartphone. Older phones can scan the QR code on the back instead." },
    { q: "Is this allowed by Google?", a: "Yes. The card simply makes it easier for customers to reach your public review page — the same link Google gives every business. You should never offer incentives for reviews, and we'll guide you on best practices." },
    { q: "How long does setup take?", a: "Minutes. Tell us your business name, we link the card to your Google Business Profile, and it arrives ready to tap." },
    { q: "What if I move or rebrand?", a: "Cards are re-linkable. If your Google profile changes, we update your card's destination for free." },
    { q: "Does the card need charging?", a: "Never. NFC chips are passive — no battery, no charging, no maintenance. It works for years." },
    { q: "What does it cost?", a: "One flat price per card, no subscriptions and no per-tap fees. Contact us for current pricing and volume discounts." },
  ],
  finalCta: {
    title: "Ready to look like the obvious choice?",
    body: "Join local businesses turning everyday customers into a five-star reputation.",
    cta: "Get Started",
  },
} as const;
