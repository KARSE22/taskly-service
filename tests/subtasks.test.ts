import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestApp } from "./app.ts";
import { testDb, cleanupDatabase } from "./setup.ts";

type SubTask = {
  id: string;
  taskId: string;
  description: string;
  isCompleted: boolean;
};

const app = createTestApp();

let taskId: string;

beforeEach(async () => {
  await cleanupDatabase();

  // Create a board with a status and a task for subtasks
  const board = await testDb.board.create({
    data: {
      name: "Test Board",
      statuses: {
        create: [{ name: "To Do", position: 0 }],
      },
    },
    include: { statuses: true },
  });

  const task = await testDb.task.create({
    data: {
      boardStatusId: board.statuses[0]!.id,
      title: "Test Task",
      position: 0,
    },
  });
  taskId = task.id;
});

afterEach(async () => {
  await cleanupDatabase();
});

describe("GET /api/subtasks", () => {
  test("returns empty array when no subtasks exist", async () => {
    const res = await app.request("/api/subtasks");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns all subtasks", async () => {
    await testDb.subTask.create({
      data: { taskId, description: "Subtask 1", isCompleted: false },
    });
    await testDb.subTask.create({
      data: { taskId, description: "Subtask 2", isCompleted: true },
    });

    const res = await app.request("/api/subtasks");
    expect(res.status).toBe(200);

    const subtasks = await res.json();
    expect(subtasks).toHaveLength(2);
  });

  test("filters subtasks by taskId", async () => {
    const board = await testDb.board.findFirst({ include: { statuses: true } });
    const task2 = await testDb.task.create({
      data: {
        boardStatusId: board!.statuses[0]!.id,
        title: "Task 2",
        position: 1,
      },
    });

    await testDb.subTask.create({
      data: { taskId, description: "Subtask 1", isCompleted: false },
    });
    await testDb.subTask.create({
      data: { taskId: task2.id, description: "Subtask 2", isCompleted: false },
    });

    const res = await app.request(`/api/subtasks?taskId=${taskId}`);
    expect(res.status).toBe(200);

    const subtasks = (await res.json()) as SubTask[];
    expect(subtasks).toHaveLength(1);
    expect(subtasks[0]!.description).toBe("Subtask 1");
  });
});

describe("GET /api/subtasks/:id", () => {
  test("returns subtask by id", async () => {
    const subtask = await testDb.subTask.create({
      data: { taskId, description: "Test Subtask", isCompleted: false },
    });

    const res = await app.request(`/api/subtasks/${subtask.id}`);
    expect(res.status).toBe(200);

    const result = (await res.json()) as SubTask;
    expect(result.description).toBe("Test Subtask");
    expect(result.isCompleted).toBe(false);
  });

  test("returns 404 for non-existent subtask", async () => {
    const res = await app.request("/api/subtasks/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/subtasks", () => {
  test("creates a subtask", async () => {
    const res = await app.request("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        description: "New Subtask",
      }),
    });

    expect(res.status).toBe(201);

    const subtask = (await res.json()) as SubTask;
    expect(subtask.description).toBe("New Subtask");
    expect(subtask.isCompleted).toBe(false);
    expect(subtask.taskId).toBe(taskId);
  });

  test("creates a subtask with isCompleted", async () => {
    const res = await app.request("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        description: "Completed Subtask",
        isCompleted: true,
      }),
    });

    expect(res.status).toBe(201);

    const subtask = (await res.json()) as SubTask;
    expect(subtask.isCompleted).toBe(true);
  });

  test("returns 400 for missing description", async () => {
    const res = await app.request("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
      }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid taskId", async () => {
    const res = await app.request("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "invalid-uuid",
        description: "Subtask",
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/subtasks/:id", () => {
  test("updates subtask description", async () => {
    const subtask = await testDb.subTask.create({
      data: { taskId, description: "Original", isCompleted: false },
    });

    const res = await app.request(`/api/subtasks/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Updated" }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as SubTask;
    expect(updated.description).toBe("Updated");
  });

  test("updates subtask isCompleted", async () => {
    const subtask = await testDb.subTask.create({
      data: { taskId, description: "Test", isCompleted: false },
    });

    const res = await app.request(`/api/subtasks/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as SubTask;
    expect(updated.isCompleted).toBe(true);
  });

  test("returns 404 for non-existent subtask", async () => {
    const res = await app.request("/api/subtasks/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Updated" }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/subtasks/:id", () => {
  test("deletes a subtask", async () => {
    const subtask = await testDb.subTask.create({
      data: { taskId, description: "To Delete", isCompleted: false },
    });

    const res = await app.request(`/api/subtasks/${subtask.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    const deleted = await testDb.subTask.findUnique({ where: { id: subtask.id } });
    expect(deleted).toBeNull();
  });

  test("returns 404 for non-existent subtask", async () => {
    const res = await app.request("/api/subtasks/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});
