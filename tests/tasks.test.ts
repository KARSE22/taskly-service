import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestApp } from "./app.ts";
import { testDb, cleanupDatabase } from "./setup.ts";

type Task = {
  id: string;
  boardStatusId: string;
  title: string;
  description: string | null;
  position: number;
  subTasks?: Array<{ description: string }>;
};

const app = createTestApp();

let boardStatusId: string;

beforeEach(async () => {
  await cleanupDatabase();

  // Create a board with a status for tasks
  const board = await testDb.board.create({
    data: {
      name: "Test Board",
      statuses: {
        create: [{ name: "To Do", position: 0 }],
      },
    },
    include: { statuses: true },
  });
  boardStatusId = board.statuses[0]!.id;
});

afterEach(async () => {
  await cleanupDatabase();
});

describe("GET /api/tasks", () => {
  test("returns empty array when no tasks exist", async () => {
    const res = await app.request("/api/tasks");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("returns all tasks", async () => {
    await testDb.task.create({
      data: { boardStatusId, title: "Task 1", position: 0 },
    });
    await testDb.task.create({
      data: { boardStatusId, title: "Task 2", position: 1 },
    });

    const res = await app.request("/api/tasks");
    expect(res.status).toBe(200);

    const tasks = await res.json();
    expect(tasks).toHaveLength(2);
  });

  test("filters tasks by boardStatusId", async () => {
    const board2 = await testDb.board.create({
      data: {
        name: "Board 2",
        statuses: { create: [{ name: "Done", position: 0 }] },
      },
      include: { statuses: true },
    });

    await testDb.task.create({
      data: { boardStatusId, title: "Task 1", position: 0 },
    });
    await testDb.task.create({
      data: { boardStatusId: board2.statuses[0]!.id, title: "Task 2", position: 0 },
    });

    const res = await app.request(`/api/tasks?boardStatusId=${boardStatusId}`);
    expect(res.status).toBe(200);

    const tasks = (await res.json()) as Task[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.title).toBe("Task 1");
  });
});

describe("GET /api/tasks/:id", () => {
  test("returns task with subtasks", async () => {
    const task = await testDb.task.create({
      data: {
        boardStatusId,
        title: "Test Task",
        position: 0,
        subTasks: {
          create: [{ description: "Subtask 1", isCompleted: false }],
        },
      },
    });

    const res = await app.request(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);

    const result = (await res.json()) as Task;
    expect(result.title).toBe("Test Task");
    expect(result.subTasks).toHaveLength(1);
    expect(result.subTasks![0]!.description).toBe("Subtask 1");
  });

  test("returns 404 for non-existent task", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/tasks", () => {
  test("creates a task", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardStatusId,
        title: "New Task",
        description: "A test task",
        position: 0,
      }),
    });

    expect(res.status).toBe(201);

    const task = (await res.json()) as Task;
    expect(task.title).toBe("New Task");
    expect(task.description).toBe("A test task");
    expect(task.boardStatusId).toBe(boardStatusId);
  });

  test("returns 400 for missing title", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardStatusId,
        position: 0,
      }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid boardStatusId", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardStatusId: "invalid-uuid",
        title: "Task",
        position: 0,
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/tasks/:id", () => {
  test("updates a task", async () => {
    const task = await testDb.task.create({
      data: { boardStatusId, title: "Original", position: 0 },
    });

    const res = await app.request(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated", description: "New description" }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as Task;
    expect(updated.title).toBe("Updated");
    expect(updated.description).toBe("New description");
  });

  test("moves task to different status", async () => {
    const board = await testDb.board.findFirst({ include: { statuses: true } });
    const newStatus = await testDb.boardStatus.create({
      data: { boardId: board!.id, name: "In Progress", position: 1 },
    });

    const task = await testDb.task.create({
      data: { boardStatusId, title: "Task", position: 0 },
    });

    const res = await app.request(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardStatusId: newStatus.id }),
    });

    expect(res.status).toBe(200);

    const updated = (await res.json()) as Task;
    expect(updated.boardStatusId).toBe(newStatus.id);
  });

  test("returns 404 for non-existent task", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  test("deletes a task", async () => {
    const task = await testDb.task.create({
      data: { boardStatusId, title: "To Delete", position: 0 },
    });

    const res = await app.request(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    const deleted = await testDb.task.findUnique({ where: { id: task.id } });
    expect(deleted).toBeNull();
  });

  test("returns 404 for non-existent task", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});
