import { z } from "@hono/zod-openapi";
import { TaskSchema } from "./task.ts";

export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("Board");

export const BoardStatusSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(TaskSchema),
}).openapi("BoardStatus");

export const BoardWithStatusesSchema = BoardSchema.extend({
  statuses: z.array(BoardStatusSchema),
}).openapi("BoardWithStatuses");

export const CreateBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
}).openapi("CreateBoard");

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
}).openapi("UpdateBoard");
