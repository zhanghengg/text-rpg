export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(r: () => number, min: number, max: number) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(r() * (hi - lo + 1)) + lo;
}

export function chance(r: () => number, p: number) {
  return r() < p;
}

export function rngChoice<T>(r: () => number, items: T[], weight?: (it: T) => number): T {
  if (items.length === 0) throw new Error('rngChoice: empty');
  if (!weight) return items[Math.min(items.length - 1, Math.floor(r() * items.length))];

  let total = 0;
  for (const it of items) total += Math.max(0, weight(it));
  if (total <= 0) return items[0];

  let roll = r() * total;
  for (const it of items) {
    roll -= Math.max(0, weight(it));
    if (roll <= 0) return it;
  }
  return items[items.length - 1];
}
