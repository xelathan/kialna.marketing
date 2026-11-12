const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const prisma = new PrismaClient();

function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records (optional, but good for idempotent seeds)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = hashPasswordSync("password123");

  // 2. Create Users
  const seller = await prisma.user.create({
    data: {
      role: "seller",
      name: "Nguyen Van A",
      email: "seller@kialna.shop",
      phone: "0901234567",
      address: "123 Le Loi, District 1, Ho Chi Minh City, Vietnam",
      bankName: "Vietcombank (VCB)",
      bankAccountNumber: "0071001234567",
      bankAccountName: "NGUYEN VAN A",
      passwordHash: defaultPasswordHash,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      role: "buyer",
      name: "John Doe",
      email: "buyer@kialna.shop",
      phone: "+15551234567",
      address: "456 Broadway, New York, NY 10012, USA",
      passwordHash: defaultPasswordHash,
    },
  });

  const admin = await prisma.user.create({
    data: {
      role: "admin",
      name: "Kialna Saigon Hub",
      email: "admin@kialna.shop",
      phone: "02838290000",
      address: "789 Nguyen Hue, Ho Chi Minh City, Vietnam",
      passwordHash: defaultPasswordHash,
    },
  });

  console.log("Created users with password 'password123':", {
    sellerId: seller.id,
    buyerId: buyer.id,
    adminId: admin.id,
  });

  // 3. Create Fees (in VND)
  const shippingFee = await prisma.fee.create({
    data: {
      feeName: "shipping",
      amount: 120000.0, // 120,000 VND
    },
  });

  const packagingFee = await prisma.fee.create({
    data: {
      feeName: "packaging",
      amount: 30000.0, // 30,000 VND
    },
  });

  console.log("Created fees:", {
    shippingFee: shippingFee.amount,
    packagingFee: packagingFee.amount,
  });

  // 4. Create Products (linked to the Seller A)
  const sampleProducts = [
    {
      name: "Handmade Bamboo Gift Basket",
      description: "Artisanal bamboo basket woven by hand in Chuong My craft village. Eco-friendly, sturdy, and elegant for home decor or gifting.",
      category: "Crafts & Decor",
      basePrice: 180000.0, // 180,000 VND
      weight: 0.6, // 0.6 kg (600g)
      inventory: 25,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
      ]),
      status: "active",
    },
    {
      name: "Organic Lotus Leaf Tea",
      description: "Premium sun-dried lotus leaf tea from Dong Thap province. Helps support healthy metabolism and quality sleep. 100% natural.",
      category: "Food & Tea",
      basePrice: 240000.0, // 240,000 VND
      weight: 0.25, // 0.25 kg (250g)
      inventory: 50,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
      ]),
      status: "active",
    },
    {
      name: "Traditional Silk Ao Dai (Blue)",
      description: "Authentic hand-tailored Vietnamese Ao Dai made from luxury Ha Dong silk. Vibrant blue color with elegant patterns. Sized Medium.",
      category: "Apparel & Textiles",
      basePrice: 950000.0, // 950,000 VND
      weight: 0.4, // 0.4 kg (400g)
      inventory: 8,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800",
      ]),
      status: "active",
    },
    {
      name: "Ceramic Coffee Phin Filter",
      description: "Premium Bat Trang ceramic Vietnamese coffee filter (phin). Heat-retaining, beautiful design for brewing slow drip coffee at home.",
      category: "Kitchen & Home",
      basePrice: 120000.0, // 120,000 VND
      weight: 0.35, // 0.35 kg (350g)
      inventory: 100,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
      ]),
      status: "active",
    },
  ];

  for (const prodData of sampleProducts) {
    await prisma.product.create({
      data: {
        sellerId: seller.id,
        ...prodData,
      },
    });
  }

  console.log("Created 4 sample products listed by seller A.");
  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
