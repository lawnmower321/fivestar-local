"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  // `initial` must NOT depend on `reduce`: useReducedMotion() is false during
  // SSR and true on a reduced-motion user's first client render, so a
  // conditional initial emits one inline style on the server and another on
  // the client — a real hydration mismatch. Reduced motion suppresses the
  // MOTION (duration/delay collapse to 0) and leaves the rendered states alone.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
