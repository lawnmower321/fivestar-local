import type { GateReport } from "../types";
import { findContactInfo } from "./contact-info";
import { maxSimilarity } from "./similarity";
import { lengthViolation } from "./length";

export const SIMILARITY_THRESHOLD = 0.6;

export function runGates(
  reply: string,
  ctx: { rating: number; recentReplies: string[] },
): GateReport {
  const reasons: string[] = [];
  let hardFail = false;

  const contact = findContactInfo(reply);
  if (contact) {
    reasons.push(contact);
    hardFail = true;
  }

  const similarity = maxSimilarity(reply, ctx.recentReplies);
  if (similarity > SIMILARITY_THRESHOLD) {
    reasons.push(`too similar to a recent reply (${(similarity * 100).toFixed(0)}%)`);
  }

  const length = lengthViolation(reply, ctx.rating);
  if (length) reasons.push(length);

  return { ok: reasons.length === 0, hardFail, reasons, similarity };
}

export { findContactInfo, maxSimilarity };
