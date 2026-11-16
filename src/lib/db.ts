import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const getDatabaseUrl = () => {
  const prodDb = "/home/u240125368/domains/kialna.shop/files/data/kialna.db";
  if (fs.existsSync(prodDb)) {
    process.env.DATABASE_URL = `file:${prodDb}`;
    return `file:${prodDb}`;
  }
  let url = process.env.DATABASE_URL?.replace(/^["']|["']$/g, "");
  if (url && url.startsWith("file:")) {
    process.env.DATABASE_URL = url;
    return url;
  }
  process.env.DATABASE_URL = "file:./dev.db";
  return "file:./dev.db";
};

const prismaClientSingleton = () => {
  const url = getDatabaseUrl();
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var prismaSchemaMigrated: boolean | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

const MIGRATION_STATEMENTS = [
  `ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active'`,
  `ALTER TABLE "User" ADD COLUMN "logo" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "bankName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "bankAccountNumber" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "bankAccountName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "vietQrImage" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN "serviceFee" REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE "Product" ADD COLUMN "weight" REAL NOT NULL DEFAULT 0.5`,
  `ALTER TABLE "Order" ADD COLUMN "payoutStatus" TEXT NOT NULL DEFAULT 'unpaid'`,
  `ALTER TABLE "Order" ADD COLUMN "payoutMethod" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "payoutRef" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN "payoutAt" DATETIME`,
  `ALTER TABLE "OrderItem" ADD COLUMN "weightAtPurchase" REAL NOT NULL DEFAULT 0.5`,
  `ALTER TABLE "OrderItem" ADD COLUMN "serviceFeeAtPurchase" REAL NOT NULL DEFAULT 0`,
];

export async function ensureDbSchema() {
  if (globalThis.prismaSchemaMigrated) return;
  for (const sql of MIGRATION_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
  globalThis.prismaSchemaMigrated = true;
}

