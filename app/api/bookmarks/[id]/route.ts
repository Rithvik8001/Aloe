import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/config";
import { bookmarks } from "@/db/models/bookmarks";
import { users } from "@/db/models/user";
import { updateBookmarkSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = updateBookmarkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    if (updates.url && updates.url !== existing[0].url) {
      const duplicate = await db
        .select()
        .from(bookmarks)
        .where(
          and(eq(bookmarks.url, updates.url), eq(bookmarks.userId, userId))
        )
        .limit(1);

      if (duplicate && duplicate.length > 0) {
        return NextResponse.json(
          {
            error: "A bookmark with this URL already exists",
          },
          { status: 409 }
        );
      }
    }

    const updated = await db
      .update(bookmarks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();

    return NextResponse.json({
      bookmark: updated[0],
    });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json(
      {
        error: "Failed to update bookmark",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));

    return NextResponse.json(
      {
        message: "Bookmark deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      {
        error: "Failed to delete bookmark",
      },
      { status: 500 }
    );
  }
}
