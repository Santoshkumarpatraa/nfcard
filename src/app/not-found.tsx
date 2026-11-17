import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center text-ink-100">
      <p className="font-display text-2xl text-gold-300">{site.name}</p>
      <h1 className="mt-6 font-display text-5xl text-ink-50">Page not found</h1>
      <p className="mt-3 max-w-sm text-ink-400">This profile or page does not exist, or it is not public yet.</p>
      <Link href="/" className="mt-8 rounded-full bg-gold-300 px-6 py-3 text-sm font-semibold text-ink-950">
        Go home
      </Link>
    </main>
  );
}
