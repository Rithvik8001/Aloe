import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="w-full max-w-xl mx-auto p-6 sm:p-3 min-h-screen flex flex-col h-screen items-center justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 mb-4 w-full justify-start"
        >
          <ArrowLeft size={20} />
          <span className="text-sm text-muted-foreground">Back</span>
        </Link>
        <SignIn />
      </div>
    </>
  );
}
