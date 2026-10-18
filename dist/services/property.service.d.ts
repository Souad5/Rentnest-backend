import { Prisma } from "@prisma/client";
export declare const summaryInclude: {
    category: {
        select: {
            id: true;
            name: true;
        };
    };
    landlord: {
        select: {
            id: true;
            name: true;
        };
    };
};
export type PropertyWithSummaryRelations = Prisma.PropertyGetPayload<{
    include: typeof summaryInclude;
}>;
export interface RatingStats {
    avgRating: number;
    reviewCount: number;
}
/** avgRating (1 decimal, 0 when none) + reviewCount per property id. */
export declare const getRatingMap: (propertyIds: string[]) => Promise<Map<string, RatingStats>>;
export declare const toPropertySummary: (property: PropertyWithSummaryRelations, stats: RatingStats | undefined) => {
    id: string;
    title: string;
    description: string;
    address: string;
    location: string;
    price: number;
    isAvailable: boolean;
    imageUrl: string | null;
    images: string[];
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqft: number | null;
    amenities: string[];
    categoryId: string;
    category: {
        id: string;
        name: string;
    };
    landlordId: string;
    landlord: {
        id: string;
        name: string;
    };
    avgRating: number;
    reviewCount: number;
    createdAt: Date;
    updatedAt: Date;
};
export type PropertySummary = ReturnType<typeof toPropertySummary>;
/** Attach ratings to already-loaded properties, preserving order. */
export declare const toSummaries: (properties: PropertyWithSummaryRelations[]) => Promise<PropertySummary[]>;
/** Load summaries for ids, returned in the same order as `ids`. */
export declare const getSummariesByIds: (ids: string[], where?: Prisma.PropertyWhereInput) => Promise<PropertySummary[]>;
/**
 * Normalises image fields so `imageUrl` always mirrors `images[0]`, or keeps an
 * explicit imageUrl when there are no images.
 */
export declare const resolveImages: (input: {
    images?: string[] | undefined;
    imageUrl?: string | null | undefined;
    existingImages?: string[];
}) => {
    images?: string[];
    imageUrl?: string | null;
};
//# sourceMappingURL=property.service.d.ts.map