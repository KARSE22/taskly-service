import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "@/middleware/error-handler.ts";
import boards from "@/routes/boards.ts";
import tasks from "@/routes/tasks.ts";
import subtasks from "@/routes/subtasks.ts";

export function createTestApp() {
  const app = new OpenAPIHono();

  app.route("/api/v1/boards", boards);
  app.route("/api/v1/tasks", tasks);
  app.route("/api/v1/subtasks", subtasks);
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.onError(errorHandler);
  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
