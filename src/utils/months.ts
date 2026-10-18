// Helpers for "last 6 calendar months" chart series (UTC, current month included).

export interface MonthBucket {
  month: string; // 'YYYY-MM'
  label: string; // 'May'
  start: Date;
  end: Date; // exclusive
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const lastMonths = (count = 6, now = new Date()): MonthBucket[] => {
  const buckets: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    buckets.push({
      month: monthKey(start),
      label: MONTH_LABELS[start.getUTCMonth()] ?? "",
      start,
      end,
    });
  }
  return buckets;
};

/**
 * Build a zero-filled MonthPoint series. `series` maps an output key (e.g.
 * 'amount') to a list of `{ date, value }` items that are summed per month.
 */
export const buildMonthSeries = (
  buckets: MonthBucket[],
  series: Record<string, Array<{ date: Date | null; value: number }>>,
): Array<{ month: string; label: string } & Record<string, number | string>> => {
  const points = buckets.map((b) => {
    const point: { month: string; label: string } & Record<string, number | string> = {
      month: b.month,
      label: b.label,
    };
    for (const key of Object.keys(series)) point[key] = 0;
    return point;
  });
  const index = new Map(points.map((p, i) => [p.month, i]));

  for (const [key, items] of Object.entries(series)) {
    for (const item of items) {
      if (!item.date) continue;
      const i = index.get(monthKey(item.date));
      if (i === undefined) continue;
      const point = points[i];
      if (!point) continue;
      point[key] = round2(Number(point[key] ?? 0) + item.value);
    }
  }
  return points;
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;
export const round1 = (n: number): number => Math.round(n * 10) / 10;
