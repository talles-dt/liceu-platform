export function seededSeries(seed: number, n: number, min: number, max: number) {
  let s = seed >>> 0;
  const next = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };

  return Array.from({ length: n }, () => {
    const r = next();
    return Math.round(min + r * (max - min));
  });
}

export function seededMatrix(
  seed: number,
  rows: number,
  cols: number,
  min = 0,
  max = 1,
) {
  let s = seed >>> 0;
  const next = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };

  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => min + next() * (max - min)),
  );
}

