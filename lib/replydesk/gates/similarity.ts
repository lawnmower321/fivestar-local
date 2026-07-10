// Trigram Dice coefficient — cheap template detection, no API needed.
export function trigrams(text: string): Set<string> {
  const norm = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (norm.length === 0) return new Set();
  const padded = `  ${norm} `;
  const grams = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

export function diceSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const g of ta) if (tb.has(g)) overlap++;
  return (2 * overlap) / (ta.size + tb.size);
}

export function maxSimilarity(candidate: string, corpus: string[]): number {
  return corpus.reduce((m, prev) => Math.max(m, diceSimilarity(candidate, prev)), 0);
}
