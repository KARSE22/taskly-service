import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestApp } from "./app.ts";
import { testDb, cleanupDatabase } from "./setup.ts";

type BoardStatus = {
  id: string;
  boardId: string;
  name: string;
  description: string | null;
  position: number;
};

const app = createTestApp();

let boardId: string;

beforeEach(async () => {
  await cleanupDatabase();

  const board = await testDb.board.create({
    data: { name: "Test Board" },
  });
  boardId = board.id;
});

afterEach(async () => {
  await cleanupDatabase();
});

describe("GET /api/boards/:boardId/statuses", () => {
  test("returns empty array when no statuses exist", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns all statuses for a board", async () => {
    await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });
    await testDb.boardStatus.create({
      data: { boardId, name: "In Progress", position: 1 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses`);
    expect(res.status).toBe(200);

    const statuses = (await res.json()) as BoardStatus[];
    expect(statuses).toHaveLength(2);
    expect(statuses[0]!.name).toBe("To Do");
    expect(statuses[1]!.name).toBe("In Progress");
  });

  test("returns statuses ordered by position", async () => {
    await testDb.boardStatus.create({
      data: { boardId, name: "Done", position: 2 },
    });
    await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });
    await testDb.boardStatus.create({
      data: { boardId, name: "In Progress", position: 1 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses`);
    expect(res.status).toBe(200);

    const statuses = (await res.json()) as BoardStatus[];
    expect(statuses[0]!.name).toBe("To Do");
    expect(statuses[1]!.name).toBe("In Progress");
    expect(statuses[2]!.name).toBe("Done");
  });

  test("returns 404 for non-existent board", async () => {
    const res = await app.request("/api/boards/00000000-0000-0000-0000-000000000000/statuses");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/boards/:boardId/statuses/:statusId", () => {
  test("returns status by id", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0, description: "Tasks to do" },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`);
    expect(res.status).toBe(200);

    const result = (await res.json()) as BoardStatus;
    expect(result.name).toBe("To Do");
    expect(result.description).toBe("Tasks to do");
  });

  test("returns 404 for non-existent board", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/00000000-0000-0000-0000-000000000000/statuses/${status.id}`);
    expect(res.status).toBe(404);
  });

  test("returns 404 for non-existent status", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
  });

  test("returns 404 for status belonging to different board", async () => {
    const otherBoard = await testDb.board.create({
      data: { name: "Other Board" },
    });
    const status = await testDb.boardStatus.create({
      data: { boardId: otherBoard.id, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/boards/:boardId/statuses", () => {
  test("creates a status", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "To Do",
        description: "Tasks to do",
        position: 0,
      }),
    });

    expect(res.status).toBe(201);

    const status = (await res.json()) as BoardStatus;
    expect(status.name).toBe("To Do");
    expect(status.description).toBe("Tasks to do");
    expect(status.position).toBe(0);
    expect(status.boardId).toBe(boardId);
  });

  test("creates a status without description", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "To Do",
        position: 0,
      }),
    });

    expect(res.status).toBe(201);

    const status = (await res.json()) as BoardStatus;
    expect(status.name).toBe("To Do");
    expect(status.description).toBeNull();
  });

  test("returns 400 for missing name", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        position: 0,
      }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for missing position", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "To Do",
      }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 404 for non-existent board", async () => {
    const res = await app.request("/api/boards/00000000-0000-0000-0000-000000000000/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "To Do",
        position: 0,
      }),
    });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/boards/:boardId/statuses/:statusId", () => {
  test("updates status name", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Backlog" }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as BoardStatus;
    expect(updated.name).toBe("Backlog");
  });

  test("updates status position", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: 2 }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as BoardStatus;
    expect(updated.position).toBe(2);
  });

  test("updates status description", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "New description" }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as BoardStatus;
    expect(updated.description).toBe("New description");
  });

  test("returns 404 for non-existent board", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/00000000-0000-0000-0000-000000000000/statuses/${status.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    expect(res.status).toBe(404);
  });

  test("returns 404 for non-existent status", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses/00000000-0000-0000-0000-000000000000`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/boards/:boardId/statuses/:statusId", () => {
  test("deletes a status", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    const deleted = await testDb.boardStatus.findUnique({ where: { id: status.id } });
    expect(deleted).toBeNull();
  });

  test("cascade deletes tasks when status is deleted", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });
    const task = await testDb.task.create({
      data: { boardStatusId: status.id, title: "Task 1", position: 0 },
    });

    const res = await app.request(`/api/boards/${boardId}/statuses/${status.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    const deletedTask = await testDb.task.findUnique({ where: { id: task.id } });
    expect(deletedTask).toBeNull();
  });

  test("returns 404 for non-existent board", async () => {
    const status = await testDb.boardStatus.create({
      data: { boardId, name: "To Do", position: 0 },
    });

    const res = await app.request(`/api/boards/00000000-0000-0000-0000-000000000000/statuses/${status.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });

  test("returns 404 for non-existent status", async () => {
    const res = await app.request(`/api/boards/${boardId}/statuses/00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});
