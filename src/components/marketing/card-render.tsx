import { Icon } from "@/components/icons";
import { site } from "@/lib/site";

export type Finish = "black" | "gold" | "silver" | "rose" | "white" | "matte";

const FINISHES: Finish[] = ["black", "gold", "silver", "rose", "white", "matte"];

// PVC has no brushed metal look, so its black is drawn as flat matte; `product` is a slug or material name.
export function toFinish(value: string | undefined, product = ""): Finish {
  const finish = FINISHES.find((option) => option === value) ?? "black";
  return finish === "black" && /pvc|classic/i.test(product) ? "matte" : finish;
}

const FINISH: Record<Finish, { surface: string; text: string; sub: string; ring: string }> = {
  black: { surface: "metal-black", text: "text-gold-200", sub: "text-ink-300", ring: "ring-white/10" },
  gold: { surface: "metal-gold", text: "text-ink-950", sub: "text-ink-800", ring: "ring-black/10" },
  silver: { surface: "metal-silver", text: "text-ink-950", sub: "text-ink-700", ring: "ring-black/10" },
  rose: { surface: "metal-rose", text: "text-ink-950", sub: "text-ink-800", ring: "ring-black/10" },
  white: { surface: "metal-white", text: "text-ink-950", sub: "text-ink-500", ring: "ring-black/10" },
  matte: { surface: "metal-matte", text: "text-ink-50", sub: "text-ink-300", ring: "ring-white/10" },
};

/** A pure-CSS render of the physical card, so marketing pages ship no product photography weight. */
export function CardRender({
  finish = "black",
  name = "Aarav Mehta",
  title = "Founder, Northwind Studio",
  className = "",
}: {
  finish?: Finish;
  name?: string;
  title?: string;
  className?: string;
}) {
  const style = FINISH[finish];
  return (
    <div
      className={`relative aspect-[1.586/1] overflow-hidden [container-type:inline-size] rounded-[18px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.65)] ring-1 ${style.ring} ${style.surface} ${className}`}
    >
      <div className="card-sheen absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between">
          <span className={`font-display text-[clamp(14px,4.2cqw,22px)] tracking-wide ${style.text}`}>{site.name}</span>
          <Icon name="nfc" size={22} className={style.text} strokeWidth={1.5} />
        </div>
        <div>
          <p className={`text-[clamp(13px,3.6cqw,19px)] font-medium tracking-wide ${style.text}`}>{name}</p>
          <p className={`mt-0.5 text-[clamp(9px,2.4cqw,12px)] tracking-[0.12em] uppercase ${style.sub}`}>{title}</p>
        </div>
      </div>
    </div>
  );
}
