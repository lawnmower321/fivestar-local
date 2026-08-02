import Link from "next/link";
import { Star } from "lucide-react";
import { content } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Star size={18} className="fill-star text-star" />
          </span>
          {content.site.name}
        </div>
        <div className="flex gap-6">
          {content.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-body hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>
        <a href={`mailto:${content.site.email}`} className="text-sm text-body hover:text-brand">
          {content.site.email}
        </a>
      </div>
      <p className="mt-8 text-center text-xs text-body/70">
        © {new Date().getFullYear()} {content.site.name}. All rights reserved.
      </p>
    </footer>
  );
}
