"use client";

import Link from "next/link";
import { Star, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";

// Commit to the solid state as soon as anything scrolls under the bar, rather
// than at the hero's full height: the point is that the bar stops floating
// over the ink the instant the page moves, not that it tracks the hero.
const SOLID_AT = 24;

export function Navbar() {
  const [open, setOpen] = useState(false);

  // MUST initialise to the top / transparent value. This is the SSR'd state,
  // so the server's markup and the client's first render agree and hydration
  // is clean. Seeding it from window.scrollY — in the initialiser, in a
  // useMemo, anywhere inside render — would ship one className from the server
  // and a different one from the browser, which is the hydration mismatch that
  // has already cost this branch two review rounds. Updating it from the
  // effect below is a post-mount transition, not a mismatch: a visitor who
  // deep-links to #pricing sees the bar flip to solid one frame after mount,
  // and that is the accepted behaviour.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SOLID_AT);
    onScroll(); // catch a restored / deep-linked scroll position
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer is bg-paper and hangs directly off the bar. A light drawer
  // under a transparent header reads as two unrelated objects, so an open
  // drawer forces the solid state regardless of scroll position.
  const solid = scrolled || open;

  return (
    // The bottom border is always present and only its COLOUR changes, so the
    // header's box is identical in both states and nothing can shift when it
    // flips. Same reason the two states differ only in colour utilities: no
    // transform, no size, no padding change.
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid
          ? "border-hairline/60 bg-paper/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="#"
          className={`flex items-center gap-2 font-heading font-bold transition-colors ${
            solid ? "text-ink" : "text-white"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Star size={18} className="fill-star text-star" />
          </span>
          {content.site.name}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                solid
                  ? "text-body hover:text-brand"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {/* Over the ink hero, cobalt-on-ink is ~1.6:1 and the pill stops
              reading as a button at all, so the transparent state borrows the
              hero's own primary treatment — the honey pill — and hands the
              cobalt back once there is paper behind it. */}
          <Button
            render={<a href="#pricing" />}
            nativeButton={false}
            className={
              solid
                ? "bg-brand text-white transition-colors hover:bg-brand/90"
                : "bg-star font-semibold text-ink transition-colors hover:bg-star/90"
            }
          >
            See pricing
          </Button>
        </div>
        <button
          className={`transition-colors md:hidden ${solid ? "text-ink" : "text-white"}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-hairline bg-paper px-4 py-4 md:hidden">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-body"
            >
              {item.label}
            </Link>
          ))}
          <Button
            render={<a href="#pricing" />}
            nativeButton={false}
            className="mt-2 w-full bg-brand text-white hover:bg-brand/90"
          >
            See pricing
          </Button>
        </div>
      )}
    </header>
  );
}
