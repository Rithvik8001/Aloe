"use client";

import Image from "next/image";
import { ModeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const { isSignedIn } = useUser();

  return (
    <>
      <div className="w-full flex items-center justify-between">
        <div>
          <Image
            className="dark:invert"
            src={"./clover.svg"}
            alt="Aloe"
            width={35}
            height={35}
          />
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          {isSignedIn ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/sign-in")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
