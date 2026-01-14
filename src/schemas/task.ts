import { z } from "@hono/zod-openapi";

export const SubTaskSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  description: z.string(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("SubTask");

export const TaskSchema = z.object({
  id: z.string().uuid(),
  boardStatusId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("Task");

export const TaskWithSubTasksSchema = TaskSchema.extend({
  subTasks: z.array(SubTaskSchema),
}).openapi("TaskWithSubTasks");

export const CreateTaskSchema = z.object({
  boardStatusId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  position: z.number().int().min(0),
}).openapi("CreateTask");

export const UpdateTaskSchema = z.object({
  boardStatusId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  position: z.number().int().min(0).optional(),
}).openapi("UpdateTask");

export const TaskQuerySchema = z.object({
  boardStatusId: z.string().uuid().optional(),
});
