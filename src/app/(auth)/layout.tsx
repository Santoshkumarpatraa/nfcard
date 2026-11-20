import Link from "next/link";
import { Icon } from "@/components/icons";
import { CardRender } from "@/components/marketing/card-render";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-ink-50 lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 pr-4 pl-3 text-ink-300 transition hover:text-ink-50"
        >
          <Icon name="arrowRight" size={15} className="rotate-180" />
          <span className="font-display text-lg leading-none tracking-wide text-ink-50">{site.name}</span>
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
          <Link
            href="/"
            className="mb-10 flex w-fit items-center gap-2 rounded-full border border-ink-200 bg-ink-50 py-2 pr-4 pl-3 text-ink-500 transition hover:text-ink-950 lg:hidden"
          >
            <Icon name="arrowRight" size={15} className="rotate-180" />
            <span className="font-display text-lg leading-none tracking-wide text-ink-950">{site.name}</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
