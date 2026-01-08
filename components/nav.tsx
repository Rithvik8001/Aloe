import Image from "next/image";
import { ModeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import Link from "next/link";

export default function Navbar() {
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
          <Link href="/sign-in">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
