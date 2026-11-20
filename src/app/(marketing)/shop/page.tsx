import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CardRender, toFinish } from "@/components/marketing/card-render";
import { getCatalog, type CatalogProduct } from "@/data/products";
import { formatInr } from "@/lib/money";
import { premiumMonthsFor } from "@/lib/premium";

export const metadata: Metadata = {
  title: "Shop NFC cards",
  description: "Metal and PVC NFC business cards, personalised and shipped across India.",
};

const isMetal = (product: CatalogProduct) => /metal/i.test(product.slug);

function pricing(product: CatalogProduct) {
  const lowest = product.variants.reduce((min, variant) => (variant.pricePaise < min.pricePaise ? variant : min));
  const savePercent =
    lowest.compareAtPaise && lowest.compareAtPaise > lowest.pricePaise
      ? Math.round((1 - lowest.pricePaise / lowest.compareAtPaise) * 100)
      : 0;
  return { pricePaise: lowest.pricePaise, compareAtPaise: lowest.compareAtPaise, savePercent };
}

const colours = (product: CatalogProduct) => product.variants.map((variant) => variant.name).join(", ");

const SHARED_ROWS = [
  "Works on iPhone and Android, no app",
  "Edit your profile anytime",
  "Save contact and Share yours",
  "Leads straight to your inbox",
  "Switch the card off if lost",
];

const ASSURANCES: { icon: IconName; title: string; body: string }[] = [
  { icon: "file", title: "Design proof first", body: "We send a proof before production." },
  { icon: "rupee", title: "Prices include GST", body: "Proper tax invoice with every order." },
  { icon: "truck", title: "Ships across India", body: "Tracked delivery to your door." },
];

export default async function ShopPage() {
  const catalog = await getCatalog();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">Shop</p>
        <h1 className="mt-4 font-display text-5xl text-ink-50 sm:text-6xl">Choose your card</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-300">
          Every card works forever with your contact profile, plus free Premium: 12 months with metal, 6 with PVC.
        </p>
      </header>

      {catalog.length === 0 ? (
        <p className="mt-16 text-center text-ink-400">Products are being restocked. Please check back soon.</p>
      ) : (
        <>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
            {catalog.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <section id="compare" className="mx-auto mt-20 max-w-5xl scroll-mt-24 sm:mt-28" aria-labelledby="compare-heading">
            <div className="text-center">
              <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">Compare</p>
              <h2 id="compare-heading" className="mt-4 font-display text-4xl text-ink-50 sm:text-5xl">
                Which card is right for you?
              </h2>
            </div>
            <CompareTable catalog={catalog} />
          </section>
        </>
      )}

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:mt-20 sm:grid-cols-3">
        {ASSURANCES.map((item) => (
          <div key={item.title} className="flex items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 text-gold-300">
              <Icon name={item.icon} size={18} />
            </span>
            <div>
              <p className="font-medium text-ink-50">{item.title}</p>
              <p className="mt-0.5 text-sm text-ink-400">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { pricePaise, compareAtPaise, savePercent } = pricing(product);
  const metal = isMetal(product);
  const [front, back] = product.variants;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`group relative flex flex-col rounded-3xl border bg-ink-900/60 p-6 transition hover:border-white/20 sm:p-8 ${
        metal ? "border-gold-300/25" : "border-white/5"
      }`}
    >
      {metal ? (
        <span className="absolute top-5 right-5 z-10 rounded-full bg-gold-300 px-3 py-1 text-xs font-semibold text-ink-950">
          Most premium
        </span>
      ) : null}

      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(80%_80%_at_50%_40%,rgb(255_255_255/0.06),transparent)] bg-ink-950/60">
        {back ? (
          <div className="absolute top-[18%] left-[22%] w-[58%] rotate-[8deg] transition duration-500 group-hover:rotate-[11deg]">
            <CardRender finish={toFinish(back.finish, product.slug)} />
          </div>
        ) : null}
        <div
          className={`w-[62%] transition duration-500 group-hover:-translate-y-1.5 ${
            back ? "absolute bottom-[16%] left-[14%] rotate-[-6deg] group-hover:rotate-[-8deg]" : "rotate-[-4deg] group-hover:rotate-[-6deg]"
          }`}
        >
          <CardRender finish={toFinish(front?.finish, product.slug)} />
        </div>
      </div>

      <div className="mt-7 text-center">
        <h2 className="font-display text-3xl text-ink-50">{product.name}</h2>

        <div className="mt-5 flex items-baseline justify-center gap-2.5">
          <span className="text-3xl font-semibold text-ink-50">{formatInr(pricePaise)}</span>
          {savePercent ? (
            <>
              <span className="text-ink-500 line-through">{compareAtPaise ? formatInr(compareAtPaise) : null}</span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Save {savePercent}%
              </span>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-gold-300">Includes {premiumMonthsFor(product.slug)} months of Premium free</p>

        <div className="mt-5 flex items-center justify-center gap-2">
          {product.variants.map((variant) => (
            <span
              key={variant.id}
              title={variant.name}
              className={`size-5 rounded-full ring-1 ring-white/25 metal-${toFinish(variant.finish, product.slug)}`}
            />
          ))}
          <span className="ml-1 text-xs text-ink-400">{colours(product)}</span>
        </div>
      </div>

      <ul className="mx-auto mt-7 mb-8 flex w-full max-w-xs flex-col gap-2.5 text-sm text-ink-300">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-gold-300" />
            {feature}
          </li>
        ))}
      </ul>

      <span
        className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition ${
          metal
            ? "bg-gold-300 text-ink-950 group-hover:bg-gold-200"
            : "border border-white/15 text-ink-50 group-hover:border-white/30"
        }`}
      >
        Customise yours <Icon name="arrowRight" size={16} />
      </span>
    </Link>
  );
}

function CompareTable({ catalog }: { catalog: CatalogProduct[] }) {
  const rows: { label: string; values: ReactNode[] }[] = [
    {
      label: "Price",
      values: catalog.map((product) => {
        const { pricePaise, compareAtPaise, savePercent } = pricing(product);
        return (
          <span key={product.id}>
            <span className="font-semibold text-ink-50">{formatInr(pricePaise)}</span>
            {savePercent && compareAtPaise ? <span className="ml-2 hidden text-ink-500 line-through sm:inline">{formatInr(compareAtPaise)}</span> : null}
          </span>
        );
      }),
    },
    { label: "Material", values: catalog.map((product) => product.material) },
    { label: "Colours", values: catalog.map(colours) },
    { label: "Name, title and logo", values: catalog.map((product) => (isMetal(product) ? "Laser engraved" : "Full-colour print")) },
    { label: "Feel", values: catalog.map((product) => (isMetal(product) ? "Heavy, solid steel" : "Light, soft-touch")) },
    { label: "Best for", values: catalog.map((product) => (isMetal(product) ? "Founders and leaders" : "Teams and events")) },
    { label: "Taps", values: catalog.map(() => "Unlimited, forever") },
    {
      label: "Premium included",
      values: catalog.map((product) => (
        <span key={product.id} className="font-medium text-gold-300">
          {premiumMonthsFor(product.slug)} months free
        </span>
      )),
    },
  ];

  return (
    <div className="mt-12 overflow-x-auto rounded-3xl border border-white/5 bg-ink-900/40">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th scope="col" className="w-[34%] p-3 sm:p-5 font-normal text-ink-500">
              <span className="sr-only">Feature</span>
            </th>
            {catalog.map((product) => (
              <th key={product.id} scope="col" className="p-3 sm:p-5 text-center">
                <span className="block font-display text-base font-normal text-ink-50 sm:text-xl">{product.name}</span>
                <Link href={`/shop/${product.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold-300">
                  Customise <Icon name="arrowRight" size={13} />
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="p-3 sm:p-5 font-normal text-ink-400">
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td key={catalog[index]?.id ?? index} className="p-3 sm:p-5 text-center text-ink-200">
                  {value}
                </td>
              ))}
            </tr>
          ))}
          {SHARED_ROWS.map((label) => (
            <tr key={label}>
              <th scope="row" className="p-3 sm:p-5 font-normal text-ink-400">
                {label}
              </th>
              {catalog.map((product) => (
                <td key={product.id} className="p-3 sm:p-5 text-center">
                  <Icon name="check" size={18} className="inline text-emerald-400" />
                  <span className="sr-only">Included</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
