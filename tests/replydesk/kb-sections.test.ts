import { describe, it, expect } from "vitest";
import {
  upsertKbSection,
  extractKbSection,
  RECOVERY_SECTION,
} from "@/lib/replydesk/kb-sections";

const KB = `## Overview
Family-owned pizzeria in the West End.

## Specialties & Crowd Favorites
- garlic knots

## Facts a reply might reference
- opened 1997`;

describe("extractKbSection", () => {
  it("returns a section body without its heading", () => {
    expect(extractKbSection(KB, "Overview")).toBe(
      "Family-owned pizzeria in the West End.",
    );
  });

  it("returns null when the section is absent", () => {
    expect(extractKbSection(KB, RECOVERY_SECTION)).toBeNull();
  });
});

describe("upsertKbSection", () => {
  it("inserts a new section before the Facts anchor", () => {
    const out = upsertKbSection(KB, RECOVERY_SECTION, "We remake it on the spot.");
    const recoveryAt = out.indexOf("## When Something Goes Wrong");
    const factsAt = out.indexOf("## Facts a reply might reference");
    expect(recoveryAt).toBeGreaterThan(-1);
    expect(factsAt).toBeGreaterThan(recoveryAt);
    expect(extractKbSection(out, RECOVERY_SECTION)).toBe("We remake it on the spot.");
    // other sections untouched
    expect(extractKbSection(out, "Overview")).toBe(
      "Family-owned pizzeria in the West End.",
    );
    expect(extractKbSection(out, "Specialties & Crowd Favorites")).toBe(
      "- garlic knots",
    );
  });

  it("appends at the end when the anchor is missing", () => {
    const noAnchor = "## Overview\nJust a shop.";
    const out = upsertKbSection(noAnchor, RECOVERY_SECTION, "Full refund, no questions.");
    expect(out.trimEnd().endsWith("Full refund, no questions.")).toBe(true);
    expect(extractKbSection(out, "Overview")).toBe("Just a shop.");
  });

  it("replaces an existing section in place", () => {
    const withPolicy = upsertKbSection(KB, RECOVERY_SECTION, "Old policy.");
    const out = upsertKbSection(withPolicy, RECOVERY_SECTION, "New policy.");
    expect(extractKbSection(out, RECOVERY_SECTION)).toBe("New policy.");
    expect(out.match(/## When Something Goes Wrong/g)).toHaveLength(1);
  });

  it("is idempotent", () => {
    const once = upsertKbSection(KB, RECOVERY_SECTION, "We remake it.");
    const twice = upsertKbSection(once, RECOVERY_SECTION, "We remake it.");
    expect(twice).toBe(once);
  });

  it("round-trips extract→upsert across a simulated rebuild", () => {
    // Founder saved a policy…
    const saved = upsertKbSection(KB, RECOVERY_SECTION, "Tony re-inspects within 48h.");
    // …then rebuilds the KB from a URL; the model never emits the section.
    const rebuilt = `## Overview
New scrape of the site.

## Facts a reply might reference
- new fact`;
    const policy = extractKbSection(saved, RECOVERY_SECTION);
    const merged = policy
      ? upsertKbSection(rebuilt, RECOVERY_SECTION, policy)
      : rebuilt;
    expect(extractKbSection(merged, RECOVERY_SECTION)).toBe(
      "Tony re-inspects within 48h.",
    );
    expect(extractKbSection(merged, "Overview")).toBe("New scrape of the site.");
  });
});
