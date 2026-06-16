import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking recent verification records...");
  const records = await prisma.verification.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (records.length === 0) {
    console.log("No verification records found.");
    return;
  }

  console.log("Latest verification OTPs:");
  console.table(
    records.map((r) => ({
      ID: r.id,
      Identifier: r.identifier,
      Value: r.value,
      ExpiresAt: r.expiresAt,
      CreatedAt: r.createdAt,
    }))
  );
}

main()
  .catch((e) => {
    console.error("Error checking verification table:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
