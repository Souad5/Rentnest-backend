import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { round1 } from "../utils/months";
// Relations every PropertySummary needs. Landlord email is deliberately NOT
// selected — it must never be exposed on public endpoints.
export const summaryInclude = {
    category: { select: { id: true, name: true } },
    landlord: { select: { id: true, name: true } },
};
const EMPTY_STATS = { avgRating: 0, reviewCount: 0 };
/** avgRating (1 decimal, 0 when none) + reviewCount per property id. */
export const getRatingMap = async (propertyIds) => {
    const map = new Map();
    if (propertyIds.length === 0)
        return map;
    const groups = await prisma.review.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: propertyIds } },
        _avg: { rating: true },
        _count: { _all: true },
    });
    for (const g of groups) {
        map.set(g.propertyId, {
            avgRating: g._avg.rating ? round1(g._avg.rating) : 0,
            reviewCount: g._count._all,
        });
    }
    return map;
};
export const toPropertySummary = (property, stats) => ({
    id: property.id,
    title: property.title,
    description: property.description,
    address: property.address,
    location: property.location,
    price: property.price,
    isAvailable: property.isAvailable,
    imageUrl: property.imageUrl ?? property.images[0] ?? null,
    images: property.images,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    amenities: property.amenities,
    categoryId: property.categoryId,
    category: property.category,
    landlordId: property.landlordId,
    landlord: property.landlord,
    avgRating: (stats ?? EMPTY_STATS).avgRating,
    reviewCount: (stats ?? EMPTY_STATS).reviewCount,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
});
/** Attach ratings to already-loaded properties, preserving order. */
export const toSummaries = async (properties) => {
    const ratings = await getRatingMap(properties.map((p) => p.id));
    return properties.map((p) => toPropertySummary(p, ratings.get(p.id)));
};
/** Load summaries for ids, returned in the same order as `ids`. */
export const getSummariesByIds = async (ids, where = {}) => {
    if (ids.length === 0)
        return [];
    const rows = await prisma.property.findMany({
        where: { ...where, id: { in: ids } },
        include: summaryInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = ids
        .map((id) => byId.get(id))
        .filter((r) => r !== undefined);
    return toSummaries(ordered);
};
/**
 * Normalises image fields so `imageUrl` always mirrors `images[0]`, or keeps an
 * explicit imageUrl when there are no images.
 */
export const resolveImages = (input) => {
    const { images, imageUrl, existingImages } = input;
    if (images !== undefined) {
        const cleaned = Array.from(new Set(images));
        return {
            images: cleaned,
            imageUrl: cleaned[0] ?? (imageUrl === undefined ? null : imageUrl),
        };
    }
    if (imageUrl !== undefined) {
        if (imageUrl && existingImages && existingImages.length > 0) {
            // Keep the invariant: the explicit cover image becomes images[0].
            return {
                images: [imageUrl, ...existingImages.filter((i) => i !== imageUrl)].slice(0, 10),
                imageUrl,
            };
        }
        return { imageUrl };
    }
    return {};
};
//# sourceMappingURL=property.service.js.map