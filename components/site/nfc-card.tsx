"use client";

import { Nfc, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function NfcCard() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex items-center justify-center">
      {/* tap ripple rings */}
      <div className="absolute right-6 top-6 h-12 w-12">
        <span className="nfc-ripple" />
        <span className="nfc-ripple" style={{ animationDelay: "1.2s" }} />
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={reduce ? undefined : { rotate: 0, scale: 1.03 }}
        className="relative aspect-[1.586] w-72 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-slate-900/30 sm:w-80"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-white">FiveStar Local</p>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-gyellow text-gyellow" />
              ))}
            </div>
          </div>
          <Nfc className="text-gblue" size={28} />
        </div>
        <p className="absolute bottom-6 left-6 text-sm text-slate-400">
          Tap to review us on Google
        </p>
      </motion.div>
    </div>
  );
}
