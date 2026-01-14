import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestApp } from "./app.ts";
import { testDb, cleanupDatabase } from "./setup.ts";

type Board = {
  id: string;
  name: string;
  description: string | null;
  statuses?: Array<{ name: string }>;
};

const app = createTestApp();

beforeEach(async () => {
  await cleanupDatabase();
});

afterEach(async () => {
  await cleanupDatabase();
});

describe("GET /api/boards", () => {
  test("returns empty array when no boards exist", async () => {
    const res = await app.request("/api/boards");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns all boards", async () => {
    await testDb.board.create({ data: { name: "Board 1" } });
    await testDb.board.create({ data: { name: "Board 2" } });

    const res = await app.request("/api/boards");
    expect(res.status).toBe(200);

    const boards = await res.json();
    expect(boards).toHaveLength(2);
  });
});

describe("GET /api/boards/:id", () => {
  test("returns board with statuses and tasks", async () => {
    const board = await testDb.board.create({
      data: {
        name: "Test Board",
        statuses: {
          create: [{ name: "To Do", position: 0 }],
        },
      },
      include: { statuses: true },
    });

    const res = await app.request(`/api/boards/${board.id}`);
    expect(res.status).toBe(200);

    const result = (await res.json()) as Board;
    expect(result.name).toBe("Test Board");
    expect(result.statuses).toHaveLength(1);
    expect(result.statuses![0]!.name).toBe("To Do");
  });

  test("returns 404 for non-existent board", async () => {
    const res = await app.request("/api/boards/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/boards", () => {
  test("creates a board", async () => {
    const res = await app.request("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Board", description: "A test board" }),
    });

    expect(res.status).toBe(201);

    const board = (await res.json()) as Board;
    expect(board.name).toBe("New Board");
    expect(board.description).toBe("A test board");
    expect(board.id).toBeDefined();
  });

  test("returns 400 for invalid data", async () => {
    const res = await app.request("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for missing name", async () => {
    const res = await app.request("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "No name" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/boards/:id", () => {
  test("updates a board", async () => {
    const board = await testDb.board.create({ data: { name: "Original" } });

    const res = await app.request(`/api/boards/${board.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated", description: "New description" }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as Board;
    expect(updated.name).toBe("Updated");
    expect(updated.description).toBe("New description");
  });

  test("returns 404 for non-existent board", async () => {
    const res = await app.request("/api/boards/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/boards/:id", () => {
  test("deletes a board", async () => {
    const board = await testDb.board.create({ data: { name: "To Delete" } });

    const res = await app.request(`/api/boards/${board.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    const deleted = await testDb.board.findUnique({ where: { id: board.id } });
    expect(deleted).toBeNull();
  });

  test("returns 404 for non-existent board", async () => {
    const res = await app.request("/api/boards/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});
