import { db } from "@/db/config";
import { users } from "@/db/models/user";
import { eq } from "drizzle-orm";

export interface ClerkUserData {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}

export async function syncUserToDatabase(
  clerkUser: ClerkUserData
): Promise<void> {
  const clerkId = clerkUser.id;
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User email is required");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({
          email,
          name,
          imageUrl: clerkUser.imageUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId));
    } else {
      await db.insert(users).values({
        clerkId,
        email,
        name,
        imageUrl: clerkUser.imageUrl || null,
      });
    }
  } catch (error) {
    console.error("Database error in syncUserToDatabase:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}
