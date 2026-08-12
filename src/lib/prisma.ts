import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalForPrisma=globalThis as unknown as {prisma?:PrismaClient};
// pg currently interprets `require` as full certificate verification, but warns
// because that alias will change semantics in its next major version. Make the
// intended secure behavior explicit without requiring users to rewrite old URLs.
const connectionString=process.env.DATABASE_URL?.replace(/([?&])sslmode=require(?=&|$)/,"$1sslmode=verify-full");
export const prisma=globalForPrisma.prisma??new PrismaClient({adapter:new PrismaPg({connectionString:connectionString!})});
if(process.env.NODE_ENV!=="production")globalForPrisma.prisma=prisma;
