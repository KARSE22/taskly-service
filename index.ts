import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "./src/middleware/error-handler.ts";
import { disconnectDb } from "./src/db.ts";
import boards from "./src/routes/boards.ts";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Routes
app.route("/api/boards", boards);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await disconnectDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down...");
  await disconnectDb();
  process.exit(0);
});

const port = process.env.PORT || 8080;

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running at http://localhost:${port}`);
