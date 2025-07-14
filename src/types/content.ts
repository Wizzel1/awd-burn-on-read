import { z } from "zod";

export const contentSchema = z
  .object({
    content: z.string().min(1),
    title: z.string().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    expiresAt: z.union([z.string(), z.date()]).optional(),
  })
  .transform((data) => ({
    ...data,
    createdAt:
      typeof data.createdAt === "string"
        ? new Date(data.createdAt)
        : data.createdAt,
    expiresAt:
      typeof data.expiresAt === "string"
        ? new Date(data.expiresAt)
        : data.expiresAt,
  }));

export type Content = z.infer<typeof contentSchema>;
