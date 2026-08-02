"use client";

import Link from "next/link";
import { Star, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline/60 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#" className="flex items-center gap-2 font-heading font-bold text-ink">
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
              className="text-sm font-medium text-body transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
          <Button
            render={<a href="#pricing" />}
            nativeButton={false}
            className="bg-brand text-white hover:bg-brand/90"
          >
            See pricing
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
