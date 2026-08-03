// Pure interpolation behind the digit-roll. Kept out of the component so the
// clamping rule is testable in the node environment — Motion's useScroll can
// report values slightly outside 0..1 at the extremes, and an unclamped
// odometer visibly overshoots (4.97 stars) at the top of the scroll.

export function odometerValue(
  from: number,
  to: number,
  progress: number,
  decimals = 0,
): string {
  const p = Math.min(1, Math.max(0, progress));
  return (from + (to - from) * p).toFixed(decimals);
}
