"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { odometerValue } from "@/lib/odometer";

// Renders a scroll-driven number. Tabular figures keep the width stable so
// the surrounding layout does not jitter as digits change.
export function Odometer({
  from,
  to,
  progress,
  decimals = 0,
  className,
}: {
  from: number;
  to: number;
  progress: MotionValue<number>;
  decimals?: number;
  className?: string;
}) {
  const text = useTransform(progress, (p) => odometerValue(from, to, p, decimals));
  return (
    <motion.span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </motion.span>
  );
}
