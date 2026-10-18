import { PrismaClient } from "@prisma/client";
// Single shared PrismaClient. Creating one client per module opens a separate
// connection pool for each, which exhausts NeonDB connections on serverless.
// In development the instance is cached on globalThis so tsx watch reloads
// reuse it instead of leaking pools.
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
export default prisma;
//# sourceMappingURL=prisma.js.map