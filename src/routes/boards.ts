import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";

const boards = new OpenAPIHono();

// Schemas
const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("Board");

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
  subTasks: z.array(SubTaskSchema),
}).openapi("Task");

const BoardStatusSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(TaskSchema),
}).openapi("BoardStatus");

const BoardWithStatusesSchema = BoardSchema.extend({
  statuses: z.array(BoardStatusSchema),
}).openapi("BoardWithStatuses");

const CreateBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
}).openapi("CreateBoard");

const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
}).openapi("UpdateBoard");

const ErrorSchema = z.object({
  error: z.string(),
}).openapi("Error");

// Routes
const listBoardsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Boards"],
  summary: "List all boards",
  responses: {
    200: {
      description: "List of boards",
      content: { "application/json": { schema: z.array(BoardSchema) } },
    },
  },
});

boards.openapi(listBoardsRoute, async (c) => {
  const boards = await db.board.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json(boards, 200);
});

const getBoardRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Boards"],
  summary: "Get board by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Board with statuses and tasks",
      content: { "application/json": { schema: BoardWithStatusesSchema } },
    },
    404: {
      description: "Board not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

boards.openapi(getBoardRoute, async (c) => {
  const { id } = c.req.valid("param");
  const board = await db.board.findUnique({
    where: { id },
    include: {
      statuses: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: { subTasks: true },
          },
        },
      },
    },
  });
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  return c.json(board, 200);
});

const createBoardRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Boards"],
  summary: "Create a new board",
  request: {
    body: {
      content: { "application/json": { schema: CreateBoardSchema } },
    },
  },
  responses: {
    201: {
      description: "Created board",
      content: { "application/json": { schema: BoardSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

boards.openapi(createBoardRoute, async (c) => {
  const data = c.req.valid("json");
  const board = await db.board.create({ data });
  return c.json(board, 201);
});

const updateBoardRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Boards"],
  summary: "Update a board",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateBoardSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated board",
      content: { "application/json": { schema: BoardSchema } },
    },
    404: {
      description: "Board not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

boards.openapi(updateBoardRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const board = await db.board.update({ where: { id }, data });
  return c.json(board, 200);
});

const deleteBoardRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Boards"],
  summary: "Delete a board",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: "Board deleted" },
    404: {
      description: "Board not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

boards.openapi(deleteBoardRoute, async (c) => {
  const { id } = c.req.valid("param");
  await db.board.delete({ where: { id } });
  return c.body(null, 204);
});

export default boards;
