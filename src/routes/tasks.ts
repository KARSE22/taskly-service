import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";
import {
  TaskSchema,
  TaskWithSubTasksSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskQuerySchema,
  ErrorSchema,
  IdParamSchema,
} from "@/schemas/index.ts";

const tasks = new OpenAPIHono();

// Routes
const listTasksRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Tasks"],
  summary: "List all tasks",
  request: {
    query: TaskQuerySchema,
  },
  responses: {
    200: {
      description: "List of tasks",
      content: { "application/json": { schema: z.array(TaskWithSubTasksSchema) } },
    },
  },
});

tasks.openapi(listTasksRoute, async (c) => {
  const { boardStatusId } = c.req.valid("query");
  const tasks = await db.task.findMany({
    where: boardStatusId ? { boardStatusId } : undefined,
    orderBy: { position: "asc" },
    include: { subTasks: true },
  });
  return c.json(tasks, 200);
});

const getTaskRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Get task by ID",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "Task with subtasks",
      content: { "application/json": { schema: TaskWithSubTasksSchema } },
    },
    404: {
      description: "Task not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

tasks.openapi(getTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const task = await db.task.findUnique({
    where: { id },
    include: { subTasks: true },
  });
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  return c.json(task, 200);
});

const createTaskRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Tasks"],
  summary: "Create a new task",
  request: {
    body: {
      content: { "application/json": { schema: CreateTaskSchema } },
    },
  },
  responses: {
    201: {
      description: "Created task",
      content: { "application/json": { schema: TaskSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

tasks.openapi(createTaskRoute, async (c) => {
  const data = c.req.valid("json");
  const task = await db.task.create({ data });
  return c.json(task, 201);
});

const updateTaskRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Update a task",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateTaskSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated task",
      content: { "application/json": { schema: TaskSchema } },
    },
    404: {
      description: "Task not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

tasks.openapi(updateTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }
  const task = await db.task.update({ where: { id }, data });
  return c.json(task, 200);
});

const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Tasks"],
  summary: "Delete a task",
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: { description: "Task deleted" },
    404: {
      description: "Task not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

tasks.openapi(deleteTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }
  await db.task.delete({ where: { id } });
  return c.body(null, 204);
});

export default tasks;
