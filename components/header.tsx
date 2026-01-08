import Link from "next/link";

export default function Header() {
  return (
    <>
      <div className="w-full flex flex-col flex-1 mt-24">
        <div className="flex-1">
          <h1 className="text-2xl font-medium font-(family-name:--font-ibm-plex-mono)">
            Aloe
          </h1>
          <p className="text-sm text-muted-foreground mt-2 w-full">
            A marker for your digital journey. Signposts to guide you back to
            the places worth remembering.
          </p>

          <h3 className="text-lg font-medium mt-12 font-(family-name:--font-ibm-plex-mono)">
            About
          </h3>
          <p className="text-sm text-muted-foreground mt-2 w-full">
            In a world of infinite scroll, Aloe is your quiet corner. Drop
            links, notes, or thoughts, and they become markers on your path. No
            algorithms deciding what matters. No feeds competing for attention.
            Just your signposts, waiting patiently until you need them again.
          </p>

          <h3 className="text-lg font-medium mt-12 font-(family-name:--font-ibm-plex-mono)">
            Join
          </h3>
          <p className="text-sm text-muted-foreground mt-2 w-full">
            Create an account to start organizing your bookmarks.{" "}
            <Link href="/signup" className="text-primary underline hover:">
              Sign up here
            </Link>{" "}
            to get started.
          </p>
        </div>

        <div className="mt-auto pt-8 border-t border-border flex justify-between items-center text-xs text-muted-foreground pb-4">
          <p>v1.0.0</p>
          <Link
            href="https://github.com/Rithvik8001"
            className="text-primary underline hover:text-primary/80"
            target="_blank"
          >
            Crafted by Rithvik
          </Link>
        </div>
      </div>
    </>
  );
}
