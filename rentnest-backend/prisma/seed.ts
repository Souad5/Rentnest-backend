import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Hash default passwords
  const defaultPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("Admin@123456", 10);

  // 2. Seed Users
  console.log("👤 Seeding Users...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@rentnest.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@rentnest.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const landlord1 = await prisma.user.upsert({
    where: { email: "john.landlord@example.com" },
    update: {},
    create: {
      name: "John Landlord",
      email: "john.landlord@example.com",
      password: defaultPassword,
      role: "LANDLORD",
    },
  });

  const landlord2 = await prisma.user.upsert({
    where: { email: "sarah.properties@example.com" },
    update: {},
    create: {
      name: "Sarah Properties",
      email: "sarah.properties@example.com",
      password: defaultPassword,
      role: "LANDLORD",
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      name: "Alex Tenant",
      email: "tenant@example.com",
      password: defaultPassword,
      role: "TENANT",
    },
  });

  console.log(
    `✅ Users created: Admin (${admin.email}), Landlords (${landlord1.email}, ${landlord2.email}), Tenant (${tenant.email})`,
  );

  // 3. Seed Categories
  console.log("📂 Seeding Categories...");

  const apartmentCategory = await prisma.category.upsert({
    where: { name: "Apartment" },
    update: {},
    create: {
      name: "Apartment",
    },
  });

  const villaCategory = await prisma.category.upsert({
    where: { name: "Luxury Villa" },
    update: {},
    create: {
      name: "Luxury Villa",
    },
  });

  const studioCategory = await prisma.category.upsert({
    where: { name: "Studio" },
    update: {},
    create: {
      name: "Studio",
    },
  });

  console.log("✅ Categories seeded: Apartment, Luxury Villa, Studio");

  // 4. Seed Properties
  console.log("🏠 Seeding Properties...");

  const property1 = await prisma.property.create({
    data: {
      title: "Modern 2BR Apartment in Gulshan",
      description:
        "Fully furnished 2-bedroom apartment with air conditioning, 24/7 security, high-speed Wi-Fi, and a scenic balcony view.",
      address: "Road 11, Gulshan 1",
      location: "Dhaka",
      price: 650.0,
      isAvailable: true,
      categoryId: apartmentCategory.id,
      landlordId: landlord1.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: "Cozy Studio Unit Near University",
      description:
        "Minimalist studio unit complete with kitchenette and study space. Ideal for students or solo professionals.",
      address: "Sector 4, Uttara",
      location: "Dhaka",
      price: 280.0,
      isAvailable: true,
      categoryId: studioCategory.id,
      landlordId: landlord2.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      title: "Seaside Luxury Villa with Pool",
      description:
        "5-bedroom luxury villa featuring a private swimming pool, outdoor garden lounge, and beachfront access.",
      address: "Marine Drive, Kolatoli",
      location: "Cox's Bazar",
      price: 1800.0,
      isAvailable: true,
      categoryId: villaCategory.id,
      landlordId: landlord1.id,
    },
  });

  console.log(
    `✅ Seeded 3 properties (${property1.title}, ${property2.title}, ${property3.title})`,
  );

  // 5. Seed Sample Approved Rental Request for Reviews testing
  console.log("📋 Seeding Rental Requests...");

  await prisma.rentalRequest.create({
    data: {
      tenantId: tenant.id,
      propertyId: property1.id,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-30"),
      status: "APPROVED",
    },
  });

  console.log(
    "✅ Sample approved rental request created for review eligibility testing.",
  );
  console.log("🚀 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
