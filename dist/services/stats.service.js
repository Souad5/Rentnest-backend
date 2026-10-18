import { prisma } from "../lib/prisma";
import { buildMonthSeries, lastMonths, round2 } from "../utils/months";
const ALL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"];
const ALL_ROLES = ["TENANT", "LANDLORD", "ADMIN"];
/** Data behind GET /admin/stats (also used to ground AI admin insights). */
export const getAdminStats = async () => {
    const months = lastMonths(6);
    const windowStart = months[0].start;
    const [roleGroups, bannedUsers, properties, availableProperties, statusGroups, revenueAgg, reviews, subscribers, unreadMessages, newUsers, newRentals, windowPayments, categories,] = await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.user.count({ where: { isBanned: true } }),
        prisma.property.count(),
        prisma.property.count({ where: { isAvailable: true } }),
        prisma.rentalRequest.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
        prisma.review.count(),
        prisma.newsletterSubscriber.count(),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.user.findMany({
            where: { createdAt: { gte: windowStart } },
            select: { createdAt: true },
        }),
        prisma.rentalRequest.findMany({
            where: { createdAt: { gte: windowStart } },
            select: { createdAt: true },
        }),
        prisma.payment.findMany({
            where: { status: "COMPLETED", paidAt: { gte: windowStart } },
            select: { paidAt: true, amount: true },
        }),
        prisma.category.findMany({
            select: { name: true, _count: { select: { properties: true } } },
            orderBy: { name: "asc" },
        }),
    ]);
    const roleCount = new Map(roleGroups.map((g) => [g.role, g._count._all]));
    const statusCount = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const users = ALL_ROLES.reduce((sum, r) => sum + (roleCount.get(r) ?? 0), 0);
    return {
        totals: {
            users,
            tenants: roleCount.get("TENANT") ?? 0,
            landlords: roleCount.get("LANDLORD") ?? 0,
            admins: roleCount.get("ADMIN") ?? 0,
            bannedUsers,
            properties,
            availableProperties,
            rentals: ALL_STATUSES.reduce((sum, s) => sum + (statusCount.get(s) ?? 0), 0),
            pendingRentals: statusCount.get("PENDING") ?? 0,
            activeRentals: statusCount.get("ACTIVE") ?? 0,
            revenue: round2(revenueAgg._sum.amount ?? 0),
            reviews,
            subscribers,
            unreadMessages,
        },
        monthly: buildMonthSeries(months, {
            users: newUsers.map((u) => ({ date: u.createdAt, value: 1 })),
            rentals: newRentals.map((r) => ({ date: r.createdAt, value: 1 })),
            revenue: windowPayments.map((p) => ({ date: p.paidAt, value: p.amount })),
        }),
        rentalsByStatus: ALL_STATUSES.map((status) => ({
            status,
            count: statusCount.get(status) ?? 0,
        })),
        propertiesByCategory: categories.map((c) => ({
            name: c.name,
            count: c._count.properties,
        })),
        usersByRole: ALL_ROLES.map((role) => ({ role, count: roleCount.get(role) ?? 0 })),
    };
};
//# sourceMappingURL=stats.service.js.map