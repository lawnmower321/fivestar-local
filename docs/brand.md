# FiveStar Local — Brand Tokens (v1.0, 2026-08-01)

Canonical record of the owned brand system. Full visual reference:
`docs/brand/fivestar-local-brand-kit.html` (open in a browser).
Palette chosen 2026-08-01 ("Cobalt & Honey", user-approved from four candidates).

## Color

| Token | Hex | Use |
|---|---|---|
| Cobalt | `#2749d6` | Primary — CTAs, links, tap-ripple, brand chrome |
| Honey | `#e8a317` | Stars, highlights, focus rings. Always means "review"/"attention" |
| Ink | `#0f1b3d` | Headlines, dark sections, footers |
| Slate | `#5b6b83` | Secondary text, captions (continues existing slate neutrals) |
| Cloud | `#f7f9fc` | Page/card backgrounds; white `#ffffff` for raised surfaces |

**Trademark rule:** Google's palette (`#4285f4 #34a853 #fbbc05 #ea4335`)
appears ONLY inside components depicting real Google UI (review-showcase,
scan-showcase, tap-demo). Never in FiveStar Local's own chrome, print, or
packaging. (docs/ROADMAP.md Track B decision.)

## Typography

- **Display/headings:** Bricolage Grotesque 600–800, tracking −0.02 to −0.03em
- **Body:** Geist 400/500, 1.6 line height, ≤65ch measure
- **Labels:** 12px caps, +0.14em letter-spacing
- Scale: display 44–64 / heading 28 / subhead 20 / body 16 / label+caption 12

## Wordmark

Honey star emitting the NFC tap-ripple (two cobalt arcs), beside
"FiveStar Local" in Bricolage Grotesque 800. "FiveStar" takes cobalt in the
primary treatment. Three treatments in the kit: primary (on light),
reversed (on ink), accent (on cobalt). SVG source lives inline in the kit
HTML — extract to assets when print/social needs arise.

## Motion

Tap-ripple: cobalt rings, 2.4s ease-out infinite, honored
`prefers-reduced-motion`. The brand's signature animation (already in
`app/globals.css` — recolor from `#4285f4` to cobalt in B3).

## Voice (summary)

Plain, concrete, neighborly. Lead with what happens in seconds; name real
outcomes; never imply Google affiliation (words or color); never hide the
price. Full Do/Don't grid in the kit HTML.

## Status

- B1 brand kit: this document + kit HTML. Canva sync deferred — kit built
  in-repo instead (user-directed, 2026-08-01).
- B2 card print design: SKIPPED — purchasing pre-made NFC cards
  (user decision, 2026-08-01).
- B3 site alignment: DONE 2026-08-01 — own-chrome swapped to `--color-brand`
  / `--color-star` / `--color-ink` tokens (navbar, hero, footer, pricing,
  benefits, how-it-works, final-cta, nfc-card, `.nfc-ripple`). Google hexes
  survive only in review-showcase / scan-showcase / tap-demo (verified by
  grep). Admin console still uses the g* utility classes internally —
  out of B3 scope, optional future cleanup.
