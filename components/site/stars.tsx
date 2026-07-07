"use client";

import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function Stars({
  count = 5,
  size = 20,
  className = "",
}: {
  count?: number;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex gap-1 ${className}`} role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, scale: 0.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 15 }}
        >
          <Star
            size={size}
            className={i < count ? "fill-gyellow text-gyellow" : "text-slate-300"}
          />
        </motion.span>
      ))}
    </div>
  );
}
