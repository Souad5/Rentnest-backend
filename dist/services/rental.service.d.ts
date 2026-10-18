import type { Prisma } from "@prisma/client";
/**
 * Find an APPROVED/ACTIVE rental on the property whose date range overlaps
 * [startDate, endDate]. Ranges touching at a boundary (one ends exactly when
 * the next starts) do not overlap.
 */
export declare const findOverlappingRental: (opts: {
    propertyId: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
}, db?: Pick<Prisma.TransactionClient, "rentalRequest">) => Prisma.Prisma__RentalRequestClient<{
    endDate: Date;
    id: string;
    startDate: Date;
} | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
/**
 * Deleting a property cascades to its rental requests and payment records.
 * Refuse when that would destroy money history or an in-flight tenancy;
 * landlords/admins should hide the listing (isAvailable=false) instead.
 */
export declare const assertPropertyDeletable: (propertyId: string) => Promise<void>;
//# sourceMappingURL=rental.service.d.ts.map