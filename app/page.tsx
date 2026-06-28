import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="text-3xl font-semibold tracking-tight text-neutral-900">
        Photo<span className="text-neutral-400">PewPew</span>
      </span>
      <p className="max-w-sm text-sm text-neutral-500">
        Photographer? Head to the admin area. Client with a gallery link? Use
        the link your photographer sent you.
      </p>
      <Link href="/admin/">
        <Button>Admin login</Button>
      </Link>
    </main>
  );
}
