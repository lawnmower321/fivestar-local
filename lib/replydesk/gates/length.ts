// Negative-review replies must be short: apologize once, move it offline.
const MAX_WORDS_NEGATIVE = 45;

export function lengthViolation(reply: string, rating: number): string | null {
  if (rating > 3) return null;
  const words = reply.trim().split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS_NEGATIVE) {
    return `reply to a ${rating}-star review is ${words} words (max ${MAX_WORDS_NEGATIVE} words)`;
  }
  return null;
}
