"use client";

import Link from "next/link";
import { Star, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gblue">
            <Star size={18} className="fill-gyellow text-gyellow" />
          </span>
          {content.site.name}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-gblue"
            >
              {item.label}
            </Link>
          ))}
          <Button
            render={<a href={`mailto:${content.site.email}`} />}
            className="bg-gblue text-white hover:bg-gblue/90"
          >
            Get Started
          </Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {content.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-slate-600"
            >
              {item.label}
            </Link>
          ))}
          <Button
            render={<a href={`mailto:${content.site.email}`} />}
            className="mt-2 w-full bg-gblue text-white hover:bg-gblue/90"
          >
            Get Started
          </Button>
        </div>
      )}
    </header>
  );
}
