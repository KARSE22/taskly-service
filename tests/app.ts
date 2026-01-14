import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "@/middleware/error-handler.ts";
import boards from "@/routes/boards.ts";
import tasks from "@/routes/tasks.ts";

export function createTestApp() {
  const app = new OpenAPIHono();

  app.route("/api/boards", boards);
  app.route("/api/tasks", tasks);
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.onError(errorHandler);
  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
