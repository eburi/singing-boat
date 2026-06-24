export function nowMs(): number {
  return performance.now();
}

export function unixNowMs(): number {
  return Date.now();
}
