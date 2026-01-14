import type { Context } from "hono";
import { Prisma } from "@prisma/client.ts";

export async function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return c.json({ error: "Record not found" }, 404);
      case "P2002":
        return c.json({ error: "A record with this value already exists" }, 409);
      case "P2003":
        return c.json({ error: "Related record not found" }, 400);
      default:
        return c.json({ error: "Database error" }, 500);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return c.json({ error: "Invalid request data" }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
}
