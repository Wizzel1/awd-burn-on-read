import { z } from "zod";


export const contentSchema = z.object({
    content: z.string().min(1),
    title: z.string().optional(),
    createdAt: z.string().optional(),
}).transform((data) => ({
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined
}));

export type Content = z.infer<typeof contentSchema>;