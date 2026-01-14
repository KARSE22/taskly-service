import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "@/middleware/error-handler.ts";
import { disconnectDb } from "@/db.ts";
import boards from "@/routes/boards.ts";
import tasks from "@/routes/tasks.ts";

const app = new OpenAPIHono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Routes
app.route("/api/boards", boards);
app.route("/api/tasks", tasks);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// OpenAPI JSON spec
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Taskly API",
    version: "1.0.0",
    description: "Task management API",
  },
});

// API documentation UI
app.get(
  "/docs",
  apiReference({
    url: "/openapi.json",
  })
);

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
console.log(`API docs at http://localhost:${port}/docs`);
