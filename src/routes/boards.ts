import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";
import {
  BoardSchema,
  BoardWithStatusesSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
  ErrorSchema,
  IdParamSchema,
} from "@/schemas/index.ts";

const boards = new OpenAPIHono();

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
    params: IdParamSchema,
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
    params: IdParamSchema,
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
  const existing = await db.board.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Board not found" }, 404);
  }
  const board = await db.board.update({ where: { id }, data });
  return c.json(board, 200);
});

const deleteBoardRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Boards"],
  summary: "Delete a board",
  request: {
    params: IdParamSchema,
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
  const existing = await db.board.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Board not found" }, 404);
  }
  await db.board.delete({ where: { id } });
  return c.body(null, 204);
});

export default boards;
