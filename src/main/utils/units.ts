const MS_TO_KNOTS = 1.9438444924406;
const RAD_TO_DEG = 180 / Math.PI;

export function convertUnits(value: number, from: string | undefined, to: string | undefined): number {
  if (!from || !to || from === to) {
    return value;
  }
  if (from === 'm/s' && to === 'kn') {
    return value * MS_TO_KNOTS;
  }
  if (from === 'kn' && to === 'm/s') {
    return value / MS_TO_KNOTS;
  }
  if (from === 'rad' && to === 'deg') {
    return value * RAD_TO_DEG;
  }
  if (from === 'deg' && to === 'rad') {
    return value / RAD_TO_DEG;
  }
  return value;
}
