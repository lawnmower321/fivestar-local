// Single source of Cobalt & Honey for TS consumers — Motion configs, inline
// styles, and anything that needs a colour as a *value* rather than a class.
// The Tailwind-class side of the same palette lives in app/globals.css
// @theme. Both must stay in sync; globals.css is the one a designer edits.
//
// Provenance: docs/brand.md / docs/brand/fivestar-local-brand-kit.html.

export const BRAND = Object.freeze({
  ink: "#0f1b3d",      // dark ground, headlines
  cobalt: "#2749d6",   // structural: primary CTA, rules, active states, NFC rings
  honey: "#e8a317",    // deliberate accent: stars, "Top result", one CTA
  paper: "#fcfbf9",    // light ground, warmed off screen-white on purpose
  mist: "#f7f9fc",     // secondary light ground
  slate: "#5b6b83",    // body text
  hairline: "#e4e9f1", // borders, dividers
} as const);

export type Ground = "paper" | "mist" | "ink" | "cobalt";
