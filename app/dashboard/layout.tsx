import DashboardNavbar from "@/components/dashboard/dashboard-nav";
import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { syncUserToDatabase } from "@/lib/user-sync";

export default async function Layout({ children }: { children: ReactNode }) {
  try {
    const user = await currentUser();
    if (user) {
      await syncUserToDatabase({
        id: user.id,
        emailAddresses: user.emailAddresses.map((ea) => ({
          emailAddress: ea.emailAddress,
        })),
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      });
    }
  } catch (error) {
    console.error("Error syncing user in dashboard layout:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-3xl mx-auto p-6 sm:p-3 min-h-screen flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 mt-6">{children}</div>
      </div>
    </div>
  );
}
