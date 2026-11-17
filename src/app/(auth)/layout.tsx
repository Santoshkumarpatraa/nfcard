import Link from "next/link";
import { CardRender } from "@/components/marketing/card-render";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-ink-50 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="font-display text-2xl tracking-wide">
          {site.name}
        </Link>
        <div className="flex justify-center">
          <CardRender finish="black" name="Your Name" title="Founder" className="w-full max-w-[340px] -rotate-6" />
        </div>
        <p className="max-w-sm font-display text-3xl leading-tight text-ink-100">
          One tap. <span className="text-gold-300 italic">Every</span> detail that matters.
        </p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-10 block font-display text-2xl text-ink-950 lg:hidden">
            {site.name}
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
