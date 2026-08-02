"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Nfc, Star } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { content } from "@/lib/content";

// The real product: a matte-white PVC counter stand — one sheet, one bend.
// A portrait panel leaning back, plus a base plate folding forward. An "L"
// in profile; the triangle people think they see is the negative space
// between the leaning panel and the table.
//
// Built from flat divs in a single preserve-3d space, not WebGL, because the
// photo shows the material is fully diffuse: there is no specular highlight
// to simulate, so a driven gradient IS the material's real behaviour rather
// than an approximation of it. If this ever needs environment reflections or
// a contact shadow that deforms correctly through a full rotation, that is a
// `three` rebuild and a different budget (spec §The Hero Object).
//
// Axis note: in CSS, +Y points DOWN and rotateX follows the right-hand rule
// about +X, so with transform-origin at the bottom a POSITIVE rotateX tips
// the top AWAY from the viewer. That is why the lean is +17 and the base
// plate is +90.

const PANEL_ASPECT = 4.4 / 3; // portrait
const LEAN_DEG = 17;
const RADIUS_PCT = 4.5;
const THICKNESS_PCT = 1.5;
const BASE_DEPTH_PCT = 30;

export function CounterStand({
  scrollProgress,
  className,
}: {
  scrollProgress?: MotionValue<number>;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // Scroll drives a shallow yaw: −16° at progress 0 through to +10° at 1.
  // That is a 26° sweep, and deliberately asymmetric — the object rests
  // turned toward the viewer's left (so the right side wall is the near edge
  // and reads as thickness) and swings past face-on. Widening it further
  // starts to expose how thin that side wall really is.
  //
  // Reduced motion pins the yaw at the RESTING pose, −16°, not at some other
  // angle: it suppresses the motion, not the pose. This matters beyond taste
  // — `useReducedMotion()` is false on the server and true on the first
  // client render, so baking a different resting angle into this range emits
  // a different inline `transform` on each side and fails hydration.
  const fallback = useTransform(() => 0);
  const source = scrollProgress ?? fallback;
  const rotateY = useTransform(source, [0, 1], reduce ? [-16, -16] : [-16, 10]);

  // Diffuse shading that tracks the yaw: as the panel turns away from the
  // key light the gradient slides across it. No highlight, only falloff.
  const panelGradient = useTransform(
    rotateY,
    (r) =>
      `linear-gradient(${115 + r * 0.9}deg, #ffffff 0%, #f6f7f9 46%, #e9edf2 100%)`,
  );
  const shadowScale = useTransform(rotateY, [-16, 10], [1.06, 0.94]);
  const shadowShift = useTransform(rotateY, [-16, 10], [-14, 12]);

  return (
    <div
      className={className}
      style={{ perspective: "1200px", perspectiveOrigin: "50% 42%" }}
    >
      <motion.div
        className="relative mx-auto"
        style={{
          rotateY,
          transformStyle: "preserve-3d",
          width: "var(--stand-w)",
          height: `calc(var(--stand-w) * ${PANEL_ASPECT})`,
          // The base plate, contact shadow and loose card all live on the
          // table plane BELOW the panel's layout box. Reserve that room in
          // flow so they never land on whatever follows the object.
          marginBottom: `calc(var(--stand-w) * 0.34)`,
        }}
      >
        {/* ---- table plane -------------------------------------------------
            A pool of shade, not a slab: it fades to fully transparent, so it
            has no visible edge and its rotation with the scene is
            imperceptible. Sits at the crease and extends forward. Tinted with
            ink rather than white because the ground behind the object is a
            light one — a white pool on white is no pool at all. If the hero
            ground is ever moved to the Ink surface, this polarity must invert
            back to white (rgba(255,255,255,0.14 → 0.04 → transparent)) or the
            pool disappears again, this time into the dark. */}
        <div
          aria-hidden
          className="absolute left-1/2 top-full h-[220%] w-[320%] -translate-x-1/2"
          style={{
            transform: "rotateX(90deg)",
            transformOrigin: "top center",
            background: `radial-gradient(ellipse 55% 42% at 50% 30%, rgba(15,27,61,0.07), rgba(15,27,61,0.03) 45%, transparent 72%)`,
          }}
        />

        {/* ---- contact shadow ---------------------------------------------
            Lives on the table plane so it stays glued to the object's foot
            through the yaw. rotateX is a motion prop, not a `transform`
            string: Motion composes transform from its own props, so a string
            here would simply be overwritten and the shadow would stand up
            and face the camera. */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-full h-[58%] w-[112%] -translate-x-1/2 rounded-[50%]"
          style={{
            rotateX: 90,
            transformOrigin: "top center",
            scaleX: shadowScale,
            x: shadowShift,
            background:
              "radial-gradient(ellipse at 50% 34%, rgba(15,27,61,0.34), rgba(15,27,61,0.14) 46%, transparent 72%)",
            filter: "blur(11px)",
          }}
        />

        {/* ---- base plate --------------------------------------------------
            Folds FORWARD from the crease and lies flat. transform-origin at
            its top edge + rotateX(90deg) drops it onto the table. Square
            corners: only the front panel is radiused on the real product. */}
        <div
          aria-hidden
          className="absolute left-0 top-full w-full"
          style={{
            height: `${BASE_DEPTH_PCT}%`,
            transform: "rotateX(90deg)",
            transformOrigin: "top center",
            background: "linear-gradient(180deg, #eef0f3 0%, #dfe4ea 100%)",
          }}
        />

        {/* ---- the leaning panel -------------------------------------------
            The 17° lean is a locked geometry value, so it is expressed as a
            Motion `rotateX` prop rather than a raw `transform` string: Motion
            composes transform from its own props and silently discards any
            string alongside them (see the contact shadow above). As a prop it
            survives whatever transform props this element picks up later. */}
        <motion.div
          className="absolute inset-0"
          style={{
            rotateX: LEAN_DEG,
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
          }}
        >
          {/* side wall — a real thin face, deliberately NOT radiused.
              Rounding this edge is where cheap CSS 3D gives itself away.

              rotateY is NEGATIVE: the wall folds BACK from the right edge, so
              the material sits behind the front face — which is where a
              sheet's thickness actually is. Folded forward it would instead
              lie across the front of the panel and read as a scratch. At the
              resting yaw the right edge is the near one, so this wall lands
              just outside the silhouette and reads as thickness. A mirrored
              left wall was tried and cut: its near edge is coplanar with the
              panel's, and the browser leaks a 1px seam through the front face
              rather than occluding it. */}
          <div
            aria-hidden
            className="absolute right-0 top-0 h-full"
            style={{
              width: `${THICKNESS_PCT}%`,
              transform: "rotateY(-90deg)",
              transformOrigin: "right center",
              background: "linear-gradient(180deg, #ccd3dc 0%, #b5bfcd 100%)",
            }}
          />

          {/* front face */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-between px-[9%] py-[11%]"
            style={{
              // 4.5% of panel WIDTH. A percentage border-radius resolves
              // horizontally against width and vertically against height, so
              // `4.5%` on a 3:4.4 box gives an elliptical corner — the exact
              // stretched-corner tell that gives cheap CSS 3D away.
              borderRadius: `calc(var(--stand-w) * ${RADIUS_PCT / 100})`,
              background: panelGradient,
              // Ambient occlusion only — a soft outer falloff so a white
              // panel still has an edge against a white ground, plus the
              // faint self-shadow the base plate throws up the panel's foot.
              // Neither is a specular highlight; there is none anywhere.
              boxShadow:
                "0 18px 34px -18px rgba(15,27,61,0.30), 0 1px 2px rgba(15,27,61,0.10), inset 0 -12px 18px -14px rgba(15,27,61,0.16)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-star text-star" />
                ))}
              </span>
              <p
                className="text-center font-heading text-[0.95rem] font-extrabold leading-tight"
                style={{ color: BRAND.ink }}
              >
                {/* the break is layout, not copy — the two lines live in
                    lib/content.ts, where the break does not */}
                {content.stand.headlineLine1}
                <br />
                {content.stand.headlineLine2}
              </p>
            </div>

            {/* NFC target — the thing a customer actually taps */}
            <div className="relative flex aspect-square w-[26%] items-center justify-center">
              <span className="nfc-ripple" />
              <span className="nfc-ripple" style={{ animationDelay: "1.2s" }} />
              <Nfc size={30} style={{ color: BRAND.cobalt }} />
            </div>

            <p
              className="font-mono text-[0.5rem] uppercase tracking-[0.18em]"
              style={{ color: BRAND.slate }}
            >
              {content.stand.tapLabel}
            </p>
          </motion.div>
        </motion.div>

        {/* ---- an NFC card on the table beside the stand --------------------
            Literally the Starter bundle: "2 NFC cards + counter stand". */}
        <div
          aria-hidden
          className="absolute left-[86%] top-full w-[62%] rounded-[6px]"
          style={{
            height: `${BASE_DEPTH_PCT * 1.15}%`,
            transform: "rotateX(90deg) translateZ(2px)",
            transformOrigin: "top left",
            background: "linear-gradient(135deg, #ffffff 0%, #eef1f5 100%)",
            boxShadow: "0 4px 10px rgba(15,27,61,0.16)",
          }}
        />
      </motion.div>
    </div>
  );
}
