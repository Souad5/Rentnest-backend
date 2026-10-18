export declare const queryString: (value: unknown, maxLength?: number) => string | undefined;
export declare const queryNumber: (value: unknown, opts?: {
    min?: number;
    max?: number;
}) => number | undefined;
export declare const queryInt: (value: unknown, opts: {
    min?: number;
    max?: number;
    fallback: number;
    clamp?: boolean;
}) => number;
export declare const queryEnum: <T extends string>(value: unknown, allowed: readonly T[]) => T | undefined;
//# sourceMappingURL=query.d.ts.map