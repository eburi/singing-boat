export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function normalizeLinear(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

export function applyCurve(input: number, curve: string = 'linear'): number {
  const x = clamp(input, 0, 1);
  switch (curve) {
    case 'invertedLinear':
      return 1 - x;
    case 'exponential':
      return x * x;
    case 'log':
      return Math.log10(1 + x * 9);
    case 'easeInOut':
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case 'linear':
    default:
      return x;
  }
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const n = normalizeLinear(value, inMin, inMax);
  return lerp(outMin, outMax, n);
}
