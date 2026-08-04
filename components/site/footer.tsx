import Link from "next/link";
import { Star } from "lucide-react";
import { content } from "@/lib/content";

export function Footer() {
  const { site, nav } = content;
  return (
    <footer className="border-t border-hairline bg-paper py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-heading font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Star size={18} className="fill-star text-star" />
            </span>
            {site.name}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-body">
            NFC review cards for local businesses — programmed to your Google
            review link and installed in person.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-body/70">Site</p>
          <ul className="mt-4 space-y-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-body transition-colors hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-body/70">Get in touch</p>
          <ul className="mt-4 space-y-2.5 text-sm text-body">
            <li>
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-brand">
                {site.email}
              </a>
            </li>
            {site.phone && (
              <li>
                <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-brand">
                  {site.phone}
                </a>
              </li>
            )}
            {site.location && <li>{site.location}</li>}
            {site.social.length > 0 && (
              <li className="flex gap-4 pt-1">
                {site.social.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-brand"
                  >
                    {s.label}
                  </a>
                ))}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-hairline px-4 pt-8 sm:px-6">
        <p className="text-xs text-body/70">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
