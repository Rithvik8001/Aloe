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
