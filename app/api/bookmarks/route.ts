import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/config";
import { bookmarks } from "@/db/models/bookmarks";
import { users } from "@/db/models/user";
import { insertBookmarkSchema } from "@/lib/validations";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser[0].id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    let query = db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    if (
      type &&
      (type === "link" || type === "plain_text" || type === "color")
    ) {
      query = db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.type, type)))
        .orderBy(desc(bookmarks.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const userBookmarks = await query;

    return NextResponse.json({
      bookmarks: userBookmarks,
      pagination: {
        limit,
        offset,
        count: userBookmarks.length,
      },
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bookmarks",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser[0].id;

    const body = await req.json();
    const validation = insertBookmarkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { url, title, desc, favicon, type } = validation.data;

    if (url) {
      const existing = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.url, url), eq(bookmarks.userId, userId)))
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          {
            error: "A bookmark with this URL already exists",
            bookmark: existing[0],
          },
          { status: 409 }
        );
      }
    }

    const newBookmark = await db
      .insert(bookmarks)
      .values({
        url: url || null,
        title,
        desc: desc || null,
        favicon: favicon || null,
        type: type || "link",
        userId,
      })
      .returning();

    return NextResponse.json(
      {
        bookmark: newBookmark[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      {
        error: "Failed to create bookmark",
      },
      { status: 500 }
    );
  }
}
