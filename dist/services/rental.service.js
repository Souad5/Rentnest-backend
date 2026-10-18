import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
/**
 * Find an APPROVED/ACTIVE rental on the property whose date range overlaps
 * [startDate, endDate]. Ranges touching at a boundary (one ends exactly when
 * the next starts) do not overlap.
 */
export const findOverlappingRental = (opts, db = prisma) => db.rentalRequest.findFirst({
    where: {
        propertyId: opts.propertyId,
        status: { in: ["APPROVED", "ACTIVE"] },
        startDate: { lt: opts.endDate },
        endDate: { gt: opts.startDate },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
    },
    select: { id: true, startDate: true, endDate: true },
});
/**
 * Deleting a property cascades to its rental requests and payment records.
 * Refuse when that would destroy money history or an in-flight tenancy;
 * landlords/admins should hide the listing (isAvailable=false) instead.
 */
export const assertPropertyDeletable = async (propertyId) => {
    const blocking = await prisma.rentalRequest.count({
        where: {
            propertyId,
            OR: [{ status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } }, { payment: { isNot: null } }],
        },
    });
    if (blocking > 0) {
        throw new AppError(409, "This property has approved, active or paid rentals and can't be deleted. Mark it unavailable instead to hide it.");
    }
};
//# sourceMappingURL=rental.service.js.map