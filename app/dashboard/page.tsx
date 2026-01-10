import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db/config";
import { bookmarks } from "@/db/models/bookmarks";
import { users } from "@/db/models/user";
import { MinimalBookmarkList } from "@/components/bookmarks/minimal-bookmark-list";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user's database ID
  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  if (!dbUser || dbUser.length === 0) {
    // User not synced yet, redirect to try again
    redirect("/dashboard");
  }

  const userId = dbUser[0].id;

  // Fetch user's bookmarks
  const userBookmarks = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));

  return <MinimalBookmarkList initialBookmarks={userBookmarks} />;
}
