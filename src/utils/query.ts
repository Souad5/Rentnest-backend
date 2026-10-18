// Safe query-string helpers. Express 5's `req.query` is a read-only getter, so
// query params are parsed inside controllers instead of being reassigned by the
// validate() middleware. Invalid values are ignored (never a 500).

const first = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

export const queryString = (
  value: unknown,
  maxLength = 200,
): string | undefined => {
  const v = first(value);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
};

export const queryNumber = (
  value: unknown,
  opts: { min?: number; max?: number } = {},
): number | undefined => {
  const v = queryString(value, 32);
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (opts.min !== undefined && n < opts.min) return undefined;
  if (opts.max !== undefined && n > opts.max) return undefined;
  return n;
};

export const queryInt = (
  value: unknown,
  opts: { min?: number; max?: number; fallback: number; clamp?: boolean },
): number => {
  const v = queryString(value, 32);
  const n = v === undefined ? NaN : Number(v);
  if (!Number.isInteger(n)) return opts.fallback;
  if (opts.clamp) {
    let out = n;
    if (opts.min !== undefined) out = Math.max(opts.min, out);
    if (opts.max !== undefined) out = Math.min(opts.max, out);
    return out;
  }
  if (opts.min !== undefined && n < opts.min) return opts.fallback;
  if (opts.max !== undefined && n > opts.max) return opts.fallback;
  return n;
};

export const queryEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined => {
  const v = queryString(value, 64);
  return v !== undefined && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined;
};
