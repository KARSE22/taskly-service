import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";

const tasks = new OpenAPIHono();

// Schemas
const SubTaskSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  description: z.string(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("SubTask");

const TaskSchema = z.object({
  id: z.string().uuid(),
  boardStatusId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("Task");

const TaskWithSubTasksSchema = TaskSchema.extend({
  subTasks: z.array(SubTaskSchema),
}).openapi("TaskWithSubTasks");

const CreateTaskSchema = z.object({
  boardStatusId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  position: z.number().int().min(0),
}).openapi("CreateTask");

const UpdateTaskSchema = z.object({
  boardStatusId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  position: z.number().int().min(0).optional(),
}).openapi("UpdateTask");

const ErrorSchema = z.object({
  error: z.string(),
}).openapi("Error");

// Routes
const listTasksRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Tasks"],
  summary: "List all tasks",
  request: {
    query: z.object({
      boardStatusId: z.string().uuid().optional(),
    }),
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
    params: z.object({ id: z.string().uuid() }),
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
    params: z.object({ id: z.string().uuid() }),
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
    params: z.object({ id: z.string().uuid() }),
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
