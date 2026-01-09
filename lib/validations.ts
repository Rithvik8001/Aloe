import { z } from "zod";

export const bookmarkSchema = z.object({
  url: z.url({ message: "URL is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  desc: z.string().optional(),
  favicon: z.string().optional(),
  type: z
    .enum(["link", "note", "thought"], {
      message: "Type is required",
    })
    .default("link"),
});

export type BookmarkSchema = z.infer<typeof bookmarkSchema>;
