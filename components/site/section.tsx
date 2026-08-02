import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Ground } from "@/lib/brand";

// Owns ground colour and vertical rhythm for every marketing section, so the
// page's cadence is legible in one file instead of scattered across nine
// bg-*/py-* pairs. Sections must not hard-code either any more.

const GROUNDS: Record<Ground, string> = {
  paper: "bg-paper text-body",
  mist: "bg-mist text-body",
  ink: "bg-ink text-slate-300",
  cobalt: "bg-brand text-white",
};

const SIZES = {
  sm: "py-20",
  md: "py-28",
  lg: "py-32",
} as const;

export function Section({
  children,
  ground = "paper",
  size = "md",
  id,
  className,
}: {
  children: ReactNode;
  ground?: Ground;
  size?: keyof typeof SIZES;
  id?: string;
  className?: string;
}) {
  // `className` is merged last so a section can override the default rhythm
  // (the hero needs asymmetric pt/pb); cn() is tailwind-merge, so a later
  // pt-32/pb-20 correctly beats the earlier py-28.
  return (
    <section
      id={id}
      className={cn("relative", GROUNDS[ground], SIZES[size], id && "scroll-mt-16", className)}
    >
      {children}
    </section>
  );
}
