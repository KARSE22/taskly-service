import { PrismaClient } from "@prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "@/config/index.ts";

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const db = new PrismaClient({ adapter });

export async function disconnectDb() {
  await db.$disconnect();
  await pool.end();
}
