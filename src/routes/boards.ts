import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db.ts";

const boards = new Hono();

const createBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// GET /boards - List all boards
boards.get("/", async (c) => {
  const boards = await db.board.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json(boards);
});

// GET /boards/:id - Get single board with statuses and tasks
boards.get("/:id", async (c) => {
  const id = c.req.param("id");
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
  return c.json(board);
});

// POST /boards - Create board
boards.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  const board = await db.board.create({
    data: parsed.data,
  });
  return c.json(board, 201);
});

// PUT /boards/:id - Update board
boards.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateBoardSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }
  const board = await db.board.update({
    where: { id },
    data: parsed.data,
  });
  return c.json(board);
});

// DELETE /boards/:id - Delete board
boards.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.board.delete({ where: { id } });
  return c.body(null, 204);
});

export default boards;
