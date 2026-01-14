import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";
import {
  SubTaskSchema,
  CreateSubTaskSchema,
  UpdateSubTaskSchema,
  SubTaskQuerySchema,
  ErrorSchema,
  IdParamSchema,
} from "@/schemas/index.ts";

const subtasks = new OpenAPIHono();

// Routes
const listSubTasksRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["SubTasks"],
  summary: "List all subtasks",
  request: {
    query: SubTaskQuerySchema,
  },
  responses: {
    200: {
      description: "List of subtasks",
      content: { "application/json": { schema: z.array(SubTaskSchema) } },
    },
  },
});

subtasks.openapi(listSubTasksRoute, async (c) => {
  const { taskId } = c.req.valid("query");
  const subtasks = await db.subTask.findMany({
    where: taskId ? { taskId } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return c.json(subtasks, 200);
});

const getSubTaskRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["SubTasks"],
  summary: "Get subtask by ID",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "Subtask details",
      content: { "application/json": { schema: SubTaskSchema } },
    },
    404: {
      description: "Subtask not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

subtasks.openapi(getSubTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const subtask = await db.subTask.findUnique({
    where: { id },
  });
  if (!subtask) {
    return c.json({ error: "Subtask not found" }, 404);
  }
  return c.json(subtask, 200);
});

const createSubTaskRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["SubTasks"],
  summary: "Create a new subtask",
  request: {
    body: {
      content: { "application/json": { schema: CreateSubTaskSchema } },
    },
  },
  responses: {
    201: {
      description: "Created subtask",
      content: { "application/json": { schema: SubTaskSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

subtasks.openapi(createSubTaskRoute, async (c) => {
  const data = c.req.valid("json");
  const subtask = await db.subTask.create({ data });
  return c.json(subtask, 201);
});

const updateSubTaskRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["SubTasks"],
  summary: "Update a subtask",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateSubTaskSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated subtask",
      content: { "application/json": { schema: SubTaskSchema } },
    },
    404: {
      description: "Subtask not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

subtasks.openapi(updateSubTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const existing = await db.subTask.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Subtask not found" }, 404);
  }
  const subtask = await db.subTask.update({ where: { id }, data });
  return c.json(subtask, 200);
});

const deleteSubTaskRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["SubTasks"],
  summary: "Delete a subtask",
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: { description: "Subtask deleted" },
    404: {
      description: "Subtask not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

subtasks.openapi(deleteSubTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const existing = await db.subTask.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Subtask not found" }, 404);
  }
  await db.subTask.delete({ where: { id } });
  return c.body(null, 204);
});

export default subtasks;
