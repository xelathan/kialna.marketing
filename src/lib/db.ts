import { PrismaClient } from "@prisma/client";

import fs from "node:fs";

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL?.replace(/^["']|["']$/g, "");
  if (url && url.startsWith("file:")) {
    process.env.DATABASE_URL = url;
    return url;
  }
  const prodDb = "/home/u240125368/domains/kialna.shop/files/data/kialna.db";
  if (fs.existsSync(prodDb)) {
    process.env.DATABASE_URL = `file:${prodDb}`;
    return `file:${prodDb}`;
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
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
