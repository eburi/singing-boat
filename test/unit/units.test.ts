import { describe, expect, it } from 'vitest';
import { convertUnits } from '../../src/main/utils/units';

describe('convertUnits', () => {
  it('converts m/s to knots', () => {
    expect(convertUnits(10, 'm/s', 'kn')).toBeCloseTo(19.438, 3);
  });

  it('converts radians to degrees', () => {
    expect(convertUnits(Math.PI, 'rad', 'deg')).toBeCloseTo(180, 6);
  });

  it('returns same value for unknown conversion', () => {
    expect(convertUnits(5, 'm', 'm')).toBe(5);
  });
});
