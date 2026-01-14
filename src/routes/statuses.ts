import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/db.ts";
import {
  BoardStatusBaseSchema,
  CreateBoardStatusSchema,
  UpdateBoardStatusSchema,
  ErrorSchema,
  BoardIdParamSchema,
  BoardIdAndStatusIdParamSchema,
} from "@/schemas/index.ts";

const statuses = new OpenAPIHono();

// Helper to verify board exists
async function verifyBoardExists(boardId: string) {
  return db.board.findUnique({ where: { id: boardId } });
}

// Routes
const listStatusesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Board Statuses"],
  summary: "List all statuses for a board",
  request: {
    params: BoardIdParamSchema,
  },
  responses: {
    200: {
      description: "List of board statuses",
      content: { "application/json": { schema: z.array(BoardStatusBaseSchema) } },
    },
    404: {
      description: "Board not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

statuses.openapi(listStatusesRoute, async (c) => {
  const { boardId } = c.req.valid("param");
  const board = await verifyBoardExists(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  const statusList = await db.boardStatus.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
  });
  return c.json(statusList, 200);
});

const getStatusRoute = createRoute({
  method: "get",
  path: "/{statusId}",
  tags: ["Board Statuses"],
  summary: "Get status by ID",
  request: {
    params: BoardIdAndStatusIdParamSchema,
  },
  responses: {
    200: {
      description: "Board status details",
      content: { "application/json": { schema: BoardStatusBaseSchema } },
    },
    404: {
      description: "Board or status not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

statuses.openapi(getStatusRoute, async (c) => {
  const { boardId, statusId } = c.req.valid("param");
  const board = await verifyBoardExists(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  const status = await db.boardStatus.findFirst({
    where: { id: statusId, boardId },
  });
  if (!status) {
    return c.json({ error: "Status not found" }, 404);
  }
  return c.json(status, 200);
});

const createStatusRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Board Statuses"],
  summary: "Create a new status for a board",
  request: {
    params: BoardIdParamSchema,
    body: {
      content: { "application/json": { schema: CreateBoardStatusSchema } },
    },
  },
  responses: {
    201: {
      description: "Created board status",
      content: { "application/json": { schema: BoardStatusBaseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Board not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

statuses.openapi(createStatusRoute, async (c) => {
  const { boardId } = c.req.valid("param");
  const board = await verifyBoardExists(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  const data = c.req.valid("json");
  const status = await db.boardStatus.create({
    data: { ...data, boardId },
  });
  return c.json(status, 201);
});

const updateStatusRoute = createRoute({
  method: "put",
  path: "/{statusId}",
  tags: ["Board Statuses"],
  summary: "Update a board status",
  request: {
    params: BoardIdAndStatusIdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateBoardStatusSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated board status",
      content: { "application/json": { schema: BoardStatusBaseSchema } },
    },
    404: {
      description: "Board or status not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

statuses.openapi(updateStatusRoute, async (c) => {
  const { boardId, statusId } = c.req.valid("param");
  const board = await verifyBoardExists(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  const existing = await db.boardStatus.findFirst({
    where: { id: statusId, boardId },
  });
  if (!existing) {
    return c.json({ error: "Status not found" }, 404);
  }
  const data = c.req.valid("json");
  const status = await db.boardStatus.update({
    where: { id: statusId },
    data,
  });
  return c.json(status, 200);
});

const deleteStatusRoute = createRoute({
  method: "delete",
  path: "/{statusId}",
  tags: ["Board Statuses"],
  summary: "Delete a board status",
  request: {
    params: BoardIdAndStatusIdParamSchema,
  },
  responses: {
    204: { description: "Status deleted" },
    404: {
      description: "Board or status not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

statuses.openapi(deleteStatusRoute, async (c) => {
  const { boardId, statusId } = c.req.valid("param");
  const board = await verifyBoardExists(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  const existing = await db.boardStatus.findFirst({
    where: { id: statusId, boardId },
  });
  if (!existing) {
    return c.json({ error: "Status not found" }, 404);
  }
  await db.boardStatus.delete({ where: { id: statusId } });
  return c.body(null, 204);
});

export default statuses;
