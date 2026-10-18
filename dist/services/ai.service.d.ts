import { z } from "zod";
import type { AdminStats } from "./stats.service";
export declare const isAIEnabled: () => boolean;
export type AIFailureReason = "disabled" | "refusal" | "invalid_output" | "rate_limited" | "unavailable";
export type AIResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    reason: AIFailureReason;
};
interface CatalogEntry {
    id: string;
    title: string;
    location: string;
    price: number;
    category: string;
    bedrooms: number | null;
    avgRating: number;
    reviewCount: number;
}
export declare const getCatalogSnapshot: () => Promise<CatalogEntry[]>;
export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};
export declare const chatWithAssistant: (turns: ChatTurn[]) => Promise<AIResult<{
    reply: string;
    propertyIds: string[];
}>>;
declare const SuggestionOutput: z.ZodObject<{
    suggestions: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        type: z.ZodEnum<{
            category: "category";
            location: "location";
            query: "query";
        }>;
        location: z.ZodNullable<z.ZodString>;
        categoryId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    filters: z.ZodObject<{
        location: z.ZodNullable<z.ZodString>;
        categoryId: z.ZodNullable<z.ZodString>;
        minPrice: z.ZodNullable<z.ZodNumber>;
        maxPrice: z.ZodNullable<z.ZodNumber>;
        bedrooms: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SuggestionAIOutput = z.infer<typeof SuggestionOutput>;
export declare const suggestSearch: (query: string, context: {
    categories: Array<{
        id: string;
        name: string;
    }>;
    locations: string[];
}) => Promise<AIResult<SuggestionAIOutput>>;
declare const DescriptionOutput: z.ZodObject<{
    description: z.ZodString;
    highlights: z.ZodArray<z.ZodString>;
    suggestedAmenities: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export interface DescriptionInput {
    title: string;
    location: string;
    address?: string | undefined;
    category?: string | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    areaSqft?: number | undefined;
    amenities?: string[] | undefined;
    price?: number | undefined;
    notes?: string | undefined;
}
export declare const writePropertyDescription: (input: DescriptionInput) => Promise<AIResult<z.infer<typeof DescriptionOutput>>>;
declare const InsightsOutput: z.ZodObject<{
    summary: z.ZodString;
    insights: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        detail: z.ZodString;
        severity: z.ZodEnum<{
            info: "info";
            positive: "positive";
            warning: "warning";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AdminInsights = z.infer<typeof InsightsOutput> & {
    generatedAt: string;
};
export declare const generateAdminInsights: (stats: AdminStats) => Promise<AIResult<AdminInsights>>;
export {};
//# sourceMappingURL=ai.service.d.ts.map