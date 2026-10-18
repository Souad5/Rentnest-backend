export interface MonthBucket {
    month: string;
    label: string;
    start: Date;
    end: Date;
}
export declare const monthKey: (date: Date) => string;
export declare const lastMonths: (count?: number, now?: Date) => MonthBucket[];
/**
 * Build a zero-filled MonthPoint series. `series` maps an output key (e.g.
 * 'amount') to a list of `{ date, value }` items that are summed per month.
 */
export declare const buildMonthSeries: (buckets: MonthBucket[], series: Record<string, Array<{
    date: Date | null;
    value: number;
}>>) => Array<{
    month: string;
    label: string;
} & Record<string, number | string>>;
export declare const round2: (n: number) => number;
export declare const round1: (n: number) => number;
//# sourceMappingURL=months.d.ts.map