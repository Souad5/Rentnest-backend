/** Data behind GET /admin/stats (also used to ground AI admin insights). */
export declare const getAdminStats: () => Promise<{
    totals: {
        users: number;
        tenants: number;
        landlords: number;
        admins: number;
        bannedUsers: number;
        properties: number;
        availableProperties: number;
        rentals: number;
        pendingRentals: number;
        activeRentals: number;
        revenue: number;
        reviews: number;
        subscribers: number;
        unreadMessages: number;
    };
    monthly: ({
        month: string;
        label: string;
    } & Record<string, string | number>)[];
    rentalsByStatus: {
        status: import(".prisma/client").$Enums.RequestStatus;
        count: number;
    }[];
    propertiesByCategory: {
        name: string;
        count: number;
    }[];
    usersByRole: {
        role: import(".prisma/client").$Enums.Role;
        count: number;
    }[];
}>;
export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
//# sourceMappingURL=stats.service.d.ts.map