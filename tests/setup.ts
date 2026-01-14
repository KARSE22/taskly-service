import { PrismaClient } from "@prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const testDb = new PrismaClient({ adapter });

export async function cleanupDatabase() {
  await testDb.subTask.deleteMany();
  await testDb.task.deleteMany();
  await testDb.boardStatus.deleteMany();
  await testDb.board.deleteMany();
}

export async function disconnectTestDb() {
  await testDb.$disconnect();
  await pool.end();
}
