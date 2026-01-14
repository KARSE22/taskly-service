import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({
  error: z.string(),
}).openapi("Error");

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export const BoardIdParamSchema = z.object({
  boardId: z.string().uuid(),
});

export const BoardIdAndStatusIdParamSchema = z.object({
  boardId: z.string().uuid(),
  statusId: z.string().uuid(),
});
