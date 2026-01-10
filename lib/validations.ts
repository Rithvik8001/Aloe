import { z } from "zod";

export const bookmarkSchema = z.object({
  url: z.url().optional(),
  title: z.string().min(1, { message: "Title is required" }),
  desc: z.string().optional(),
  favicon: z.string().optional(),
  type: z
    .enum(["link", "plain_text", "color"], {
      message: "Type is required",
    })
    .default("link"),
});

export type BookmarkSchema = z.infer<typeof bookmarkSchema>;

export const fetchMetadataSchema = z.object({
  url: z
    .url({ message: "Invalid URL format" })
    .max(2048, { message: "URL is too long (max 2048 characters)" })
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Only HTTP and HTTPS URLs are allowed",
    }),
});

export type FetchMetadataSchema = z.infer<typeof fetchMetadataSchema>;

export const insertBookmarkSchema = z.object({
  url: z
    .url({ message: "Invalid URL format" })
    .max(2048, { message: "URL is too long (max 2048 characters)" })
    .optional(),
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title is too long (max 200 characters)" })
    .trim(),
  desc: z
    .string()
    .max(1000, { message: "Description is too long (max 1000 characters)" })
    .trim()
    .optional(),
  favicon: z.url().optional(),
  type: z
    .enum(["link", "plain_text", "color"], {
      message: "Type must be link, plain_text, or color",
    })
    .default("link"),
});

export type InsertBookmarkSchema = z.infer<typeof insertBookmarkSchema>;

export const updateBookmarkSchema = insertBookmarkSchema.partial();
