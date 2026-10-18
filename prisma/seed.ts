import { PrismaClient, type RequestStatus } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * Idempotent demo seed. Safe to run repeatedly:
 * - users / categories / subscribers are upserted by unique keys
 * - properties are matched by title (updated in place, never duplicated)
 * - rental requests are matched by (tenant, property) — at most one seeded each
 * - payments are keyed by rental request; reviews by (tenant, property)
 * Dates are relative to "now" so dashboard charts (last 6 months) have data.
 */

const prisma = new PrismaClient();

// Every URL below was verified to return HTTP 200.
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
/** A date `n` calendar months before (negative = after) the current month, on `day`. */
const monthsAgo = (n: number, day: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, day, 10, 0, 0));
const daysFromNow = (d: number) => new Date(now.getTime() + d * DAY);
const addMonths = (date: Date, months: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate(), 10));
const notFuture = (d: Date) => (d.getTime() > now.getTime() ? now : d);

async function main() {
  console.log("🌱 Starting database seeding...");

  const defaultPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("Admin@123456", 10);

  // ------------------------------------------------------------------
  // Users (demo accounts keep their existing passwords if already present)
  // ------------------------------------------------------------------
  console.log("👤 Seeding users...");

  const upsertUser = (data: {
    name: string;
    email: string;
    role: "ADMIN" | "LANDLORD" | "TENANT";
    password: string;
    phone?: string;
    bio?: string;
    createdAt?: Date;
  }) =>
    prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        authProvider: "LOCAL",
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        ...(data.createdAt ? { createdAt: data.createdAt } : {}),
      },
    });

  const admin = await upsertUser({
    name: "System Admin",
    email: "admin@rentnest.com",
    password: adminPassword,
    role: "ADMIN",
    createdAt: monthsAgo(7, 2),
  });
  const john = await upsertUser({
    name: "John Landlord",
    email: "john.landlord@example.com",
    password: defaultPassword,
    role: "LANDLORD",
    phone: "+880 1711-204518",
    bio: "Managing family-owned apartments and villas in Gulshan, Banani and Cox's Bazar since 2012.",
    createdAt: monthsAgo(7, 5),
  });
  const sarah = await upsertUser({
    name: "Sarah Properties",
    email: "sarah.properties@example.com",
    password: defaultPassword,
    role: "LANDLORD",
    phone: "+880 1819-552730",
    bio: "Boutique rentals for students and professionals — Uttara, Banani, Sylhet and Inani.",
    createdAt: monthsAgo(6, 11),
  });
  const rafiq = await upsertUser({
    name: "Rafiq Ahmed",
    email: "rafiq.homes@example.com",
    password: defaultPassword,
    role: "LANDLORD",
    phone: "+880 1912-640087",
    bio: "Family homes in Dhanmondi and Uttara, plus a few city flats in Chattogram and Sylhet.",
    createdAt: monthsAgo(5, 3),
  });
  const nusrat = await upsertUser({
    name: "Nusrat Jahan",
    email: "nusrat.rentals@example.com",
    password: defaultPassword,
    role: "LANDLORD",
    phone: "+880 1556-381194",
    bio: "Safe, well-run hostels and smart apartments for working women and young families.",
    createdAt: monthsAgo(4, 14),
  });

  const alex = await upsertUser({
    name: "Alex Tenant",
    email: "tenant@example.com",
    password: defaultPassword,
    role: "TENANT",
    createdAt: monthsAgo(6, 20),
  });
  const tanvir = await upsertUser({
    name: "Tanvir Hasan",
    email: "tanvir.hasan@example.com",
    password: defaultPassword,
    role: "TENANT",
    phone: "+880 1715-903362",
    createdAt: monthsAgo(5, 9),
  });
  const farhana = await upsertUser({
    name: "Farhana Akter",
    email: "farhana.akter@example.com",
    password: defaultPassword,
    role: "TENANT",
    createdAt: monthsAgo(4, 6),
  });
  const imran = await upsertUser({
    name: "Imran Chowdhury",
    email: "imran.chowdhury@example.com",
    password: defaultPassword,
    role: "TENANT",
    createdAt: monthsAgo(5, 22),
  });
  const sadia = await upsertUser({
    name: "Sadia Rahman",
    email: "sadia.rahman@example.com",
    password: defaultPassword,
    role: "TENANT",
    createdAt: monthsAgo(3, 12),
  });
  const david = await upsertUser({
    name: "David Miller",
    email: "david.miller@example.com",
    password: defaultPassword,
    role: "TENANT",
    bio: "Software consultant relocating to Bangladesh for a two-year project.",
    createdAt: monthsAgo(2, 4),
  });
  await upsertUser({
    name: "Mehedi Karim",
    email: "mehedi.karim@example.com",
    password: defaultPassword,
    role: "TENANT",
    createdAt: monthsAgo(0, 1),
  });

  console.log(`✅ Users ready (admin: ${admin.email})`);

  // ------------------------------------------------------------------
  // Categories
  // ------------------------------------------------------------------
  console.log("📂 Seeding categories...");

  const categoryData = [
    {
      name: "Apartment",
      description:
        "Self-contained flats in managed buildings — ideal for couples, small families and professionals.",
    },
    {
      name: "Luxury Villa",
      description:
        "Spacious premium homes with private pools, gardens and high-end finishes for an elevated stay.",
    },
    {
      name: "Studio",
      description:
        "Compact open-plan units with a kitchenette — perfect for students and solo professionals.",
    },
    {
      name: "Family House",
      description:
        "Multi-bedroom houses and duplexes with room to grow, often with a garden or rooftop.",
    },
    {
      name: "Shared Room / Hostel",
      description:
        "Affordable beds in shared rooms with common kitchens and study areas — great for students.",
    },
    {
      name: "Penthouse",
      description:
        "Top-floor residences with skyline or lake views, large terraces and premium amenities.",
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: c,
    });
    categories[c.name] = category.id;
  }
  const cat = (name: string) => {
    const id = categories[name];
    if (!id) throw new Error(`Missing category ${name}`);
    return id;
  };

  console.log(`✅ ${categoryData.length} categories ready`);

  // ------------------------------------------------------------------
  // Properties (matched by title)
  // ------------------------------------------------------------------
  console.log("🏠 Seeding properties...");

  type SeedProperty = {
    key: string;
    title: string;
    description: string;
    address: string;
    location: string;
    price: number;
    category: string;
    landlordId: string;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
    amenities: string[];
    images: string[];
    isAvailable?: boolean;
    createdAt: Date;
  };

  const propertyData: SeedProperty[] = [
    {
      key: "gulshan2br",
      title: "Modern 2BR Apartment in Gulshan",
      description:
        "Fully furnished 2-bedroom apartment on a quiet lane off Road 11, a short walk from Gulshan 1 circle. Bright living room with a scenic balcony, a modern fitted kitchen, split air conditioning in every room and 24/7 security with CCTV. High-speed fibre internet is included, and the building has a lift, generator backup and one reserved parking spot.",
      address: "House 24, Road 11, Gulshan 1",
      location: "Gulshan, Dhaka",
      price: 650,
      category: "Apartment",
      landlordId: john.id,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1150,
      amenities: ["Air conditioning", "High-speed Wi-Fi", "24/7 security", "Lift", "Generator backup", "Parking", "Balcony"],
      images: [img("1522708323590-d24dbb6b0267"), img("1484154218962-a197022b5858"), img("1631049307264-da0ec9d70304"), img("1552321554-5fefe8c9ef14")],
      createdAt: monthsAgo(6, 15),
    },
    {
      key: "uttaraStudio",
      title: "Cozy Studio Unit Near University",
      description:
        "Minimalist studio in Uttara Sector 4 with a kitchenette, built-in shelving and a dedicated study corner. A ten-minute walk to the university area and the metro station, with grocery shops and cafés on the same street. Ideal for students or solo professionals who want a calm, low-maintenance home.",
      address: "Road 7, Sector 4, Uttara",
      location: "Uttara, Dhaka",
      price: 280,
      category: "Studio",
      landlordId: sarah.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 420,
      amenities: ["Kitchenette", "Study desk", "Wi-Fi", "Lift", "Near metro"],
      images: [img("1536376072261-38c75010e6c9"), img("1502672023488-70e25813eb80"), img("1600566753190-17f0baa2a6c3")],
      createdAt: monthsAgo(6, 18),
    },
    {
      key: "coxVilla",
      title: "Seaside Luxury Villa with Pool",
      description:
        "Five-bedroom villa on Marine Drive with a private swimming pool, an outdoor garden lounge and direct access to Kolatoli beach. Every bedroom is en-suite, the open kitchen opens onto the pool deck, and a caretaker lives on site. A great base for long family stays or remote work by the sea.",
      address: "Marine Drive, Kolatoli",
      location: "Kolatoli, Cox's Bazar",
      price: 1800,
      category: "Luxury Villa",
      landlordId: john.id,
      bedrooms: 5,
      bathrooms: 5,
      areaSqft: 4200,
      amenities: ["Private pool", "Beach access", "Garden", "Caretaker", "Air conditioning", "Parking", "Wi-Fi"],
      images: [img("1564013799919-ab600027ffc6"), img("1599809275671-b5942cabc7a2"), img("1582719508461-905c673771fd"), img("1505693416388-ac5ce068fe85"), img("1556912173-3bb406ef7e77")],
      createdAt: monthsAgo(6, 25),
    },
    {
      key: "dhanmondiHouse",
      title: "Family House with Garden in Dhanmondi",
      description:
        "Four-bedroom family home on a tree-lined road near Dhanmondi Lake. The ground floor has a generous living and dining area that opens onto a private garden, and upstairs there are four bedrooms with built-in wardrobes. Reputed schools, hospitals and Rabindra Sarobar are all within a few minutes' drive.",
      address: "Road 9A, Dhanmondi R/A",
      location: "Dhanmondi, Dhaka",
      price: 900,
      category: "Family House",
      landlordId: rafiq.id,
      bedrooms: 4,
      bathrooms: 3,
      areaSqft: 2400,
      amenities: ["Private garden", "Parking for 2 cars", "Generator backup", "Gas connection", "Servant room", "Rooftop access"],
      images: [img("1576941089067-2de3c901e126"), img("1616486338812-3dadae4b4ace"), img("1560185893-a55cbc8c57e8"), img("1507089947368-19c1da9775ae")],
      createdAt: monthsAgo(5, 8),
    },
    {
      key: "bananiPenthouse",
      title: "Banani Lakeview Penthouse",
      description:
        "Top-floor penthouse overlooking Banani Lake, with floor-to-ceiling glass, a wraparound terrace and a private staircase to the roof deck. Four bedrooms, a chef's kitchen and a separate family lounge make it ideal for executives and diplomats. Includes concierge, gym and pool access in the building.",
      address: "Road 27, Block K, Banani",
      location: "Banani, Dhaka",
      price: 2200,
      category: "Penthouse",
      landlordId: sarah.id,
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 3600,
      amenities: ["Lake view", "Terrace", "Gym", "Swimming pool", "Concierge", "Air conditioning", "Parking"],
      images: [img("1600573472550-8090b5e0745e"), img("1567767292278-a4f21aa2d36e"), img("1600607687939-ce8a6c25118c"), img("1512918728675-ed5a9ecdebfd"), img("1604709177225-055f99402ea3")],
      createdAt: monthsAgo(4, 2),
    },
    {
      key: "bashundhara3br",
      title: "Bashundhara Smart 3BR Apartment",
      description:
        "Three-bedroom apartment in a new building on Block D, close to North South University and Apollo Hospital. Smart door lock, energy-efficient lighting, a fitted kitchen and two bathrooms. The complex has a rooftop garden, CCTV, a children's play area and reliable generator backup.",
      address: "Road 5, Block D, Bashundhara R/A",
      location: "Bashundhara, Dhaka",
      price: 520,
      category: "Apartment",
      landlordId: nusrat.id,
      bedrooms: 3,
      bathrooms: 2,
      areaSqft: 1450,
      amenities: ["Smart lock", "Rooftop garden", "CCTV", "Generator backup", "Lift", "Play area"],
      images: [img("1515263487990-61b07816b324"), img("1554995207-c18c203602cb"), img("1600121848594-d8644e57abab"), img("1540518614846-7eded433c457")],
      createdAt: monthsAgo(5, 12),
    },
    {
      key: "banani1br",
      title: "Furnished 1BR near Banani 11",
      description:
        "Stylish one-bedroom flat a short walk from the cafés and restaurants of Banani Road 11. Comes fully furnished with a sofa set, queen bed, washing machine and a compact dining area. Perfect for a single professional or a couple who want to be close to Gulshan offices.",
      address: "Road 11, Block H, Banani",
      location: "Banani, Dhaka",
      price: 480,
      category: "Apartment",
      landlordId: john.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 750,
      amenities: ["Fully furnished", "Washing machine", "Air conditioning", "Wi-Fi", "Lift", "Security guard"],
      images: [img("1493809842364-78817add7ffb"), img("1513694203232-719a280e022f"), img("1586105251261-72a756497a11"), img("1584622650111-993a426fbf0a")],
      isAvailable: false, // currently rented
      createdAt: monthsAgo(5, 1),
    },
    {
      key: "uttaraDuplex",
      title: "Uttara Sector 7 Family Duplex",
      description:
        "Modern duplex with four bedrooms across two floors in a quiet part of Uttara Sector 7. Double-height living room, an open kitchen with breakfast counter and a private rooftop for weekend barbecues. Close to Uttara Model Town park, schools and the Airport Road.",
      address: "Road 18, Sector 7, Uttara",
      location: "Uttara, Dhaka",
      price: 760,
      category: "Family House",
      landlordId: rafiq.id,
      bedrooms: 4,
      bathrooms: 3,
      areaSqft: 2600,
      amenities: ["Duplex", "Private rooftop", "Parking", "Gas connection", "Generator backup", "CCTV"],
      images: [img("1600563438938-a9a27216b4f5"), img("1600210492486-724fe5c67fb0"), img("1618219908412-a29a1bb7b86e"), img("1565183997392-2f6f122e5912")],
      createdAt: monthsAgo(3, 20),
    },
    {
      key: "dhanmondiHostel",
      title: "Women's Shared Room Hostel in Dhanmondi",
      description:
        "Safe, women-only hostel near Dhanmondi 27 with beds in shared rooms of four. Each resident gets a personal locker and reading lamp, with three home-cooked meals a day, laundry service and a quiet study room. A female warden lives on site and the entrance is staffed around the clock.",
      address: "Road 27 (Old), Dhanmondi",
      location: "Dhanmondi, Dhaka",
      price: 95,
      category: "Shared Room / Hostel",
      landlordId: nusrat.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 180,
      amenities: ["Meals included", "Laundry service", "Study room", "Personal locker", "Women only", "24/7 warden"],
      images: [img("1555854877-bab0e564b8d5"), img("1520277739336-7bf67edfa768"), img("1501183638710-841dd1904471")],
      createdAt: monthsAgo(4, 9),
    },
    {
      key: "ctgHostel",
      title: "Student Hostel Bed near Nasirabad",
      description:
        "Budget-friendly hostel bed for male students and interns near Nasirabad and GEC. Rooms are shared by three, with a common kitchen, a rooftop lounge and fast Wi-Fi for online classes. Monthly rent covers utilities and weekly cleaning.",
      address: "Nasirabad Housing Society, Road 2",
      location: "Nasirabad, Chattogram",
      price: 80,
      category: "Shared Room / Hostel",
      landlordId: nusrat.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 160,
      amenities: ["Utilities included", "Shared kitchen", "Wi-Fi", "Rooftop lounge", "Weekly cleaning"],
      images: [img("1520277739336-7bf67edfa768"), img("1501183638710-841dd1904471"), img("1600566752355-35792bedcfea")],
      createdAt: monthsAgo(2, 16),
    },
    {
      key: "sylhetBungalow",
      title: "Hillside Bungalow near Sylhet Tea Gardens",
      description:
        "Three-bedroom bungalow on a green hillside in Ambarkhana, minutes from the tea estates of Malnicherra. Wide verandas, a wood-panelled living room and a flower garden make it a peaceful retreat, while Zindabazar and the airport are a short drive away.",
      address: "Ambarkhana Hill Road",
      location: "Ambarkhana, Sylhet",
      price: 600,
      category: "Family House",
      landlordId: sarah.id,
      bedrooms: 3,
      bathrooms: 2,
      areaSqft: 1800,
      amenities: ["Garden", "Veranda", "Hill view", "Parking", "Gas connection"],
      images: [img("1588880331179-bc9b93a8cb5e"), img("1560184897-ae75f418493e"), img("1616594039964-ae9021a400a0"), img("1618773928121-c32242e63f39")],
      createdAt: monthsAgo(6, 3),
    },
    {
      key: "gecApartment",
      title: "GEC Circle 2BR City Apartment",
      description:
        "Well-kept two-bedroom apartment a few steps from GEC Circle, Chattogram's commercial hub. Large windows, a separate dining space and a balcony facing a quiet lane. Shopping malls, banks and hospitals are all within walking distance.",
      address: "CDA Avenue, GEC Circle",
      location: "GEC Circle, Chattogram",
      price: 420,
      category: "Apartment",
      landlordId: rafiq.id,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1100,
      amenities: ["Balcony", "Lift", "Generator backup", "Security guard", "Gas connection"],
      images: [img("1574362848149-11496d93a7c7"), img("1560448204-e02f11c3d0e2"), img("1505691938895-1758d7feb511"), img("1604709177225-055f99402ea3")],
      createdAt: monthsAgo(6, 8),
    },
    {
      key: "agrabadStudio",
      title: "Agrabad Executive Studio",
      description:
        "Serviced studio for business travellers in the Agrabad commercial area, close to the port offices and the World Trade Center. Includes weekly housekeeping, a work desk with ergonomic chair, a compact kitchen and a modern bathroom with a rain shower.",
      address: "Agrabad C/A, Sheikh Mujib Road",
      location: "Agrabad, Chattogram",
      price: 310,
      category: "Studio",
      landlordId: nusrat.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 520,
      amenities: ["Housekeeping", "Work desk", "Air conditioning", "Wi-Fi", "Rain shower"],
      images: [img("1630699144867-37acec97df5a"), img("1598928506311-c55ded91a20c"), img("1600566752355-35792bedcfea")],
      createdAt: monthsAgo(1, 10),
    },
    {
      key: "gulshanVilla",
      title: "Gulshan Lake Luxury Villa",
      description:
        "Six-bedroom contemporary villa on the Gulshan 2 lakefront with a private infinity pool, landscaped gardens and staff quarters. Designed for entertaining, with a double-height reception room, a formal dining hall and a home office. Fully air-conditioned with backup power for the whole house.",
      address: "Road 71, Gulshan 2",
      location: "Gulshan, Dhaka",
      price: 3200,
      category: "Luxury Villa",
      landlordId: john.id,
      bedrooms: 6,
      bathrooms: 6,
      areaSqft: 5200,
      amenities: ["Infinity pool", "Lake front", "Staff quarters", "Home office", "Full power backup", "Parking for 4 cars"],
      images: [img("1613490493576-7fde63acd811"), img("1600596542815-ffad4c1539a9"), img("1580587771525-78b9dba3b914"), img("1613545325278-f24b0cae1224"), img("1617806118233-18e1de247200")],
      createdAt: monthsAgo(4, 27),
    },
    {
      key: "inaniVilla",
      title: "Inani Beach Resort Villa",
      description:
        "Four-bedroom resort-style villa along the Marine Drive at Inani, with a pool deck, sun loungers and a short path down to the beach. Each bedroom has its own balcony, and the open kitchen and lounge face the sunset over the Bay of Bengal.",
      address: "Marine Drive, Inani",
      location: "Inani, Cox's Bazar",
      price: 1500,
      category: "Luxury Villa",
      landlordId: sarah.id,
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 3000,
      amenities: ["Pool deck", "Sea view", "Beach access", "Balconies", "Caretaker", "Wi-Fi"],
      images: [img("1571896349842-33c89424de2d"), img("1566073771259-6a8506099945"), img("1613977257363-707ba9348227"), img("1615874959474-d609969a20ed")],
      createdAt: monthsAgo(5, 26),
    },
    {
      key: "khulshiPenthouse",
      title: "Khulshi Hilltop Penthouse",
      description:
        "Three-bedroom penthouse at the top of a boutique building in Khulshi, one of Chattogram's greenest neighbourhoods. A large living area with city and hill views, a sunny terrace, and a modern kitchen with island seating. Covered parking and a gym are included.",
      address: "Khulshi Residential Area, Road 3",
      location: "Khulshi, Chattogram",
      price: 1400,
      category: "Penthouse",
      landlordId: nusrat.id,
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 2800,
      amenities: ["City view", "Terrace", "Gym", "Covered parking", "Air conditioning", "Lift"],
      images: [img("1545324418-cc1a3fa10c00"), img("1618221195710-dd6b41faaea6"), img("1617104678098-de229db51175"), img("1600585154526-990dced4db0d")],
      createdAt: monthsAgo(3, 5),
    },
    {
      key: "zindabazarStudio",
      title: "Zindabazar Studio Apartment",
      description:
        "Bright studio in the heart of Sylhet city, close to Zindabazar shopping streets and the Surma riverside. The open-plan space has a sleeping area, a sofa corner and a kitchenette, and the building has a lift and a guard at the gate.",
      address: "Zindabazar Main Road",
      location: "Zindabazar, Sylhet",
      price: 220,
      category: "Studio",
      landlordId: rafiq.id,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 450,
      amenities: ["Kitchenette", "Lift", "Security guard", "Wi-Fi"],
      images: [img("1586023492125-27b2c045efd7"), img("1560185007-cde436f6a4d0"), img("1600607687644-c7171b42498f")],
      createdAt: monthsAgo(2, 21),
    },
  ];

  const properties: Record<string, { id: string; price: number }> = {};
  let createdCount = 0;
  for (const p of propertyData) {
    const data = {
      title: p.title,
      description: p.description,
      address: p.address,
      location: p.location,
      price: p.price,
      categoryId: cat(p.category),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqft: p.areaSqft,
      amenities: p.amenities,
      images: p.images,
      imageUrl: p.images[0] ?? null,
    };
    const existing = await prisma.property.findFirst({
      where: { title: p.title },
      select: { id: true },
    });
    const saved = existing
      ? await prisma.property.update({ where: { id: existing.id }, data })
      : await prisma.property.create({
          data: {
            ...data,
            landlordId: p.landlordId,
            isAvailable: p.isAvailable ?? true,
            createdAt: p.createdAt,
          },
        });
    if (!existing) createdCount++;
    properties[p.key] = { id: saved.id, price: saved.price };
  }
  const prop = (key: string) => {
    const p = properties[key];
    if (!p) throw new Error(`Missing property ${key}`);
    return p;
  };

  console.log(`✅ ${propertyData.length} properties ready (${createdCount} new)`);

  // ------------------------------------------------------------------
  // Rental requests, payments and reviews
  // ------------------------------------------------------------------
  console.log("📋 Seeding rental requests, payments and reviews...");

  type SeedRental = {
    tenantId: string;
    property: string;
    start: Date;
    months: number;
    status: RequestStatus;
    createdAt: Date;
    paidAt?: Date;
    review?: { rating: number; comment: string; createdAt: Date };
  };

  const rentals: SeedRental[] = [
    // Alex (demo tenant): one APPROVED & unpaid so the Stripe flow can be tried.
    { tenantId: alex.id, property: "gulshan2br", start: monthsAgo(-1, 1), months: 3, status: "APPROVED", createdAt: daysFromNow(-3) },
    {
      tenantId: alex.id, property: "sylhetBungalow", start: monthsAgo(4, 5), months: 2, status: "COMPLETED", createdAt: monthsAgo(5, 24), paidAt: monthsAgo(4, 2),
      review: { rating: 5, comment: "Waking up to the hills every morning was unforgettable. The bungalow was spotless and Sarah was quick to sort out a gas issue on our second day.", createdAt: monthsAgo(2, 9) },
    },
    {
      tenantId: alex.id, property: "bashundhara3br", start: monthsAgo(1, 1), months: 6, status: "ACTIVE", createdAt: monthsAgo(2, 18), paidAt: monthsAgo(1, 3),
      review: { rating: 4, comment: "Solid building with good security and a lovely rooftop. Lift can be slow at peak hours, but the generator kicks in instantly during load shedding.", createdAt: daysFromNow(-12) },
    },
    { tenantId: alex.id, property: "bananiPenthouse", start: daysFromNow(14), months: 12, status: "PENDING", createdAt: daysFromNow(-1) },
    { tenantId: alex.id, property: "gulshanVilla", start: monthsAgo(1, 10), months: 6, status: "REJECTED", createdAt: monthsAgo(2, 2) },

    // Tanvir
    {
      tenantId: tanvir.id, property: "banani1br", start: monthsAgo(2, 1), months: 12, status: "ACTIVE", createdAt: monthsAgo(3, 15), paidAt: monthsAgo(2, 4),
      review: { rating: 5, comment: "Exactly as pictured. Everything I needed was already there, and I can walk to work in Gulshan in fifteen minutes. John responds within the hour.", createdAt: monthsAgo(1, 6) },
    },
    {
      tenantId: tanvir.id, property: "coxVilla", start: monthsAgo(5, 10), months: 1, status: "COMPLETED", createdAt: monthsAgo(5, 2), paidAt: monthsAgo(5, 7),
      review: { rating: 5, comment: "We spent a month here as a family and the kids lived in the pool. Beach is literally across the road. Caretaker Hossain bhai made us feel at home.", createdAt: monthsAgo(4, 15) },
    },
    { tenantId: tanvir.id, property: "agrabadStudio", start: daysFromNow(21), months: 3, status: "PENDING", createdAt: daysFromNow(-2) },

    // Farhana
    {
      tenantId: farhana.id, property: "dhanmondiHostel", start: monthsAgo(3, 1), months: 12, status: "ACTIVE", createdAt: monthsAgo(4, 12), paidAt: monthsAgo(3, 2),
      review: { rating: 4, comment: "Feels safe and the food is honestly better than I expected. Rooms are a bit tight for four people, but the study room makes up for it during exams.", createdAt: monthsAgo(2, 20) },
    },
    { tenantId: farhana.id, property: "dhanmondiHouse", start: monthsAgo(-1, 5), months: 12, status: "APPROVED", createdAt: daysFromNow(-6) },
    {
      tenantId: farhana.id, property: "inaniVilla", start: monthsAgo(3, 15), months: 1, status: "COMPLETED", createdAt: monthsAgo(4, 1), paidAt: monthsAgo(3, 10),
      review: { rating: 4, comment: "Gorgeous sunsets from the balcony and the pool was always clean. The road to Inani gets busy on weekends, so plan your trips into town.", createdAt: monthsAgo(2, 14) },
    },

    // Imran
    {
      tenantId: imran.id, property: "gecApartment", start: monthsAgo(5, 1), months: 12, status: "ACTIVE", createdAt: monthsAgo(5, 20), paidAt: monthsAgo(5, 3),
      review: { rating: 4, comment: "Great location — I can walk to the office and the malls. The kitchen is a little dated, but Rafiq bhai replaced the water heater the same week I asked.", createdAt: monthsAgo(3, 25) },
    },
    { tenantId: imran.id, property: "uttaraDuplex", start: monthsAgo(-1, 10), months: 12, status: "PENDING", createdAt: daysFromNow(-4) },
    {
      tenantId: imran.id, property: "coxVilla", start: monthsAgo(1, 12), months: 1, status: "COMPLETED", createdAt: monthsAgo(2, 25), paidAt: monthsAgo(1, 8),
      review: { rating: 3, comment: "Beautiful villa and amazing location, but the air conditioning in one bedroom kept tripping and the Wi-Fi was patchy for remote work.", createdAt: daysFromNow(-9) },
    },

    // Sadia
    {
      tenantId: sadia.id, property: "uttaraStudio", start: monthsAgo(4, 1), months: 12, status: "ACTIVE", createdAt: monthsAgo(4, 3), paidAt: monthsAgo(4, 4),
      review: { rating: 5, comment: "Perfect little studio for a student. Quiet building, fast internet and the metro station is close. Would happily renew.", createdAt: monthsAgo(1, 17) },
    },
    { tenantId: sadia.id, property: "khulshiPenthouse", start: monthsAgo(1, 1), months: 12, status: "REJECTED", createdAt: monthsAgo(2, 11) },
    {
      tenantId: sadia.id, property: "zindabazarStudio", start: monthsAgo(2, 5), months: 1, status: "COMPLETED", createdAt: monthsAgo(2, 1), paidAt: monthsAgo(2, 3),
      review: { rating: 4, comment: "Handy for a short work stint in Sylhet — everything is within walking distance. Street noise is noticeable in the evening.", createdAt: monthsAgo(1, 2) },
    },

    // David
    {
      tenantId: david.id, property: "gulshanVilla", start: monthsAgo(3, 1), months: 1, status: "COMPLETED", createdAt: monthsAgo(3, 3), paidAt: monthsAgo(3, 6),
      review: { rating: 5, comment: "Hosted our whole project team for a month. Immaculate house, reliable backup power and the staff were incredibly helpful. Worth every taka.", createdAt: monthsAgo(1, 28) },
    },
    {
      tenantId: david.id, property: "ctgHostel", start: monthsAgo(0, 1), months: 3, status: "ACTIVE", createdAt: monthsAgo(1, 20), paidAt: monthsAgo(0, 2),
      review: { rating: 3, comment: "Good value and the rooftop is nice, but the shared kitchen gets crowded at dinner time. Fine for a short internship.", createdAt: daysFromNow(-3) },
    },
    { tenantId: david.id, property: "gulshan2br", start: monthsAgo(-5, 1), months: 6, status: "PENDING", createdAt: daysFromNow(-5) },
  ];

  let newRequests = 0;
  let newPayments = 0;
  let newReviews = 0;

  for (const [index, r] of rentals.entries()) {
    const property = prop(r.property);

    let rental = await prisma.rentalRequest.findFirst({
      where: { tenantId: r.tenantId, propertyId: property.id },
      select: { id: true, status: true },
    });

    if (!rental) {
      rental = await prisma.rentalRequest.create({
        data: {
          tenantId: r.tenantId,
          propertyId: property.id,
          startDate: r.start,
          endDate: addMonths(r.start, r.months),
          status: r.status,
          createdAt: notFuture(r.createdAt),
        },
        select: { id: true, status: true },
      });
      newRequests++;
    }

    if (r.paidAt) {
      const existingPayment = await prisma.payment.findUnique({
        where: { rentalRequestId: rental.id },
        select: { id: true },
      });
      if (!existingPayment) {
        const paidAt = notFuture(r.paidAt);
        await prisma.payment.create({
          data: {
            rentalRequestId: rental.id,
            userId: r.tenantId,
            amount: property.price,
            transactionId: `pi_seed_${String(index + 1).padStart(3, "0")}_${rental.id.slice(0, 8)}`,
            provider: "STRIPE",
            status: "COMPLETED",
            paidAt,
            createdAt: new Date(paidAt.getTime() - 60 * 60 * 1000),
          },
        });
        newPayments++;
      }
    }

    if (r.review) {
      const existingReview = await prisma.review.findFirst({
        where: { tenantId: r.tenantId, propertyId: property.id },
        select: { id: true },
      });
      if (!existingReview) {
        await prisma.review.create({
          data: {
            tenantId: r.tenantId,
            propertyId: property.id,
            rating: r.review.rating,
            comment: r.review.comment,
            createdAt: notFuture(r.review.createdAt),
          },
        });
        newReviews++;
      }
    }
  }

  console.log(
    `✅ Rentals: ${newRequests} new requests, ${newPayments} new payments, ${newReviews} new reviews`,
  );

  // ------------------------------------------------------------------
  // Newsletter subscribers & contact messages (admin dashboard)
  // ------------------------------------------------------------------
  console.log("✉️  Seeding subscribers and contact messages...");

  const subscribers = [
    { email: "nabila.hossain@example.com", createdAt: monthsAgo(4, 11) },
    { email: "rakib.islam@example.com", createdAt: monthsAgo(2, 7) },
    { email: "tenant@example.com", createdAt: monthsAgo(1, 19) },
    { email: "mitu.das@example.com", createdAt: daysFromNow(-8) },
  ];
  for (const s of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, createdAt: notFuture(s.createdAt) },
    });
  }

  const messages = [
    {
      name: "Shuvo Ahmed",
      email: "shuvo.ahmed@example.com",
      subject: "Listing several flats at once",
      message:
        "Hi, I manage six flats in Mirpur DOHS. Is there a way to list them in bulk, or should I add each one separately from the landlord dashboard?",
      isRead: true,
      createdAt: monthsAgo(1, 14),
    },
    {
      name: "Laila Karim",
      email: "laila.karim@example.com",
      subject: "Refund question",
      message:
        "My rental request was rejected after I had already started checkout. Can you confirm I was not charged? I could not find a payment in my dashboard.",
      isRead: false,
      createdAt: daysFromNow(-4),
    },
    {
      name: "Arif Hossain",
      email: "arif.hossain@example.com",
      subject: "Partnership enquiry",
      message:
        "We run a relocation service for expats moving to Dhaka and would love to discuss featuring RentNest listings for our clients.",
      isRead: false,
      createdAt: daysFromNow(-1),
    },
  ];
  for (const m of messages) {
    const exists = await prisma.contactMessage.findFirst({
      where: { email: m.email, subject: m.subject },
      select: { id: true },
    });
    if (!exists) {
      await prisma.contactMessage.create({ data: { ...m, createdAt: notFuture(m.createdAt) } });
    }
  }

  console.log("✅ Subscribers and messages ready");
  console.log("🚀 Seeding completed successfully!");
  console.log(
    "   Demo logins: tenant@example.com / password123 · john.landlord@example.com / password123 · admin@rentnest.com / Admin@123456",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
