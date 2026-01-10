"use client";

import Image from "next/image";
import { ModeToggle } from "../theme-toggle";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";

export default function DashboardNavbar() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  return (
    <>
      <div className="w-full p-2 flex items-center justify-between">
        <div>
          <Image
            src="/clover.svg"
            alt="Aloe"
            width={35}
            height={35}
            className="dark:invert"
          />
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring">
                  <Image
                    src={user.imageUrl || ""}
                    alt="User"
                    width={35}
                    height={35}
                    className="rounded-full cursor-pointer"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => openUserProfile()}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </>
  );
}
