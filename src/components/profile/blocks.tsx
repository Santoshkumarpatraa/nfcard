import { Icon, type IconName } from "@/components/icons";
import type { BlockInput } from "@/lib/blocks";
import { networkFromUrl, youtubeId } from "@/lib/blocks";
import { imageSrcSet, imageUrl, mediaUrl } from "@/lib/media";

const SOCIAL_ICON: Record<string, IconName> = {
  instagram: "instagram",
  linkedin: "linkedin",
  x: "x",
  facebook: "facebook",
  youtube: "youtube",
  github: "github",
  behance: "behance",
  dribbble: "dribbble",
  telegram: "telegram",
};

const SOCIAL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  youtube: "YouTube",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble",
  telegram: "Telegram",
};

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {title ? (
        <h2 className="mb-3 text-xs font-medium tracking-[0.18em] text-p-muted uppercase">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export function ProfileBlock({ block, whatsapp }: { block: BlockInput; whatsapp: string | null }) {
  switch (block.type) {
    case "links":
      return (
        <Section title={block.title}>
          <div className="flex flex-col gap-2.5">
            {block.data.items.map((item) => (
              <a
                key={item.url + item.label}
                href={item.url}
                {...external}
                data-track="link_click"
                className="flex items-center justify-between rounded-2xl border border-p-border bg-p-surface px-5 py-4 text-[15px] font-medium transition active:scale-[0.99]"
              >
                <span className="truncate">{item.label}</span>
                <Icon name="arrowUpRight" size={18} className="shrink-0 text-p-muted" />
              </a>
            ))}
          </div>
        </Section>
      );

    case "social":
      return (
        <Section title={block.title}>
          <div className="flex flex-wrap gap-2.5">
            {block.data.items.map((item) => {
              const network = networkFromUrl(item.url) ?? item.network;
              return (
                <a
                  key={item.url}
                  href={item.url}
                  {...external}
                  data-track="link_click"
                  aria-label={SOCIAL_LABEL[network]}
                  className="flex size-12 items-center justify-center rounded-2xl border border-p-border bg-p-surface"
                >
                  {network === "behance" ? (
                    <span className="text-[15px] font-bold tracking-tight" aria-hidden="true">
                      Bē
                    </span>
                  ) : (
                    <Icon name={SOCIAL_ICON[network] ?? "link"} size={20} />
                  )}
                </a>
              );
            })}
          </div>
        </Section>
      );

    case "services":
      return (
        <Section title={block.title ?? "Services"}>
          <div className="flex flex-col gap-2.5">
            {block.data.items.map((item) => (
              <div key={item.name} className="rounded-2xl border border-p-border bg-p-surface p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[15px] font-semibold">{item.name}</h3>
                  {item.price ? (
                    <span className="shrink-0 text-sm font-medium text-p-accent">{item.price}</span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-p-muted">{item.description}</p>
                ) : null}
                {whatsapp ? (
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in ${item.name}`)}`}
                    {...external}
                    data-track="link_click"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-p-accent"
                  >
                    Enquire <Icon name="arrowRight" size={14} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      );

    case "gallery":
      return (
        <Section title={block.title ?? "Gallery"}>
          <div className={`grid gap-2 ${block.data.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {block.data.images.map((image, index) => (
              <a
                key={image.key}
                href={imageUrl(image.key, 1080)}
                {...external}
                className="block overflow-hidden rounded-2xl border border-p-border bg-p-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized at upload, next/image would only add a server hop */}
                <img
                  src={imageUrl(image.key, 480)}
                  srcSet={imageSrcSet(image.key, "gallery")}
                  sizes={block.data.images.length === 1 ? "(max-width: 480px) 100vw, 432px" : "(max-width: 480px) 50vw, 216px"}
                  width={480}
                  height={480}
                  alt={`${block.title ?? "Gallery"} image ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className={`w-full object-cover ${block.data.images.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
                />
              </a>
            ))}
          </div>
        </Section>
      );

    case "video": {
      const id = youtubeId(block.data.url);
      return (
        <Section title={block.title ?? "Video"}>
          <a
            href={block.data.url}
            {...external}
            data-track="link_click"
            className="relative block aspect-video overflow-hidden rounded-2xl border border-p-border bg-p-surface"
          >
            {id ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt={block.data.caption ?? "Video thumbnail"}
                width={480}
                height={360}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-black">
                <Icon name="play" size={22} className="translate-x-0.5" fill="currentColor" />
              </span>
            </span>
          </a>
          {block.data.caption ? <p className="mt-2 text-sm text-p-muted">{block.data.caption}</p> : null}
        </Section>
      );
    }

    case "reviews":
      return (
        <Section title={block.title ?? "Reviews"}>
          <div className="flex flex-col gap-2.5">
            {block.data.items.map((item) => (
              <figure key={item.author + item.text} className="rounded-2xl border border-p-border bg-p-surface p-5">
                <div className="flex gap-0.5 text-p-accent" aria-label={`${item.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" size={14} fill={i < item.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <blockquote className="mt-2.5 text-sm leading-relaxed">{item.text}</blockquote>
                <figcaption className="mt-2 text-xs text-p-muted">{item.author}</figcaption>
              </figure>
            ))}
          </div>
          {block.data.googleReviewUrl ? (
            <a
              href={block.data.googleReviewUrl}
              {...external}
              data-track="link_click"
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-p-border px-5 py-3.5 text-sm font-medium"
            >
              <Icon name="star" size={16} /> Leave a Google review
            </a>
          ) : null}
        </Section>
      );

    case "document":
      return (
        <Section title={block.title ?? "Downloads"}>
          <div className="flex flex-col gap-2.5">
            {block.data.items.map((item) => (
              <a
                key={item.key}
                href={mediaUrl(item.key)}
                {...external}
                data-track="link_click"
                className="flex items-center gap-3 rounded-2xl border border-p-border bg-p-surface px-5 py-4 text-[15px] font-medium"
              >
                <Icon name="file" size={20} className="shrink-0 text-p-accent" />
                <span className="truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </Section>
      );

    case "location": {
      const maps =
        block.data.mapsUrl ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.data.address)}`;
      return (
        <Section title={block.title ?? "Visit us"}>
          <div className="rounded-2xl border border-p-border bg-p-surface p-5">
            <p className="flex gap-3 text-sm leading-relaxed">
              <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-p-accent" />
              {block.data.address}
            </p>
            <a
              href={maps}
              {...external}
              data-track="link_click"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-p-accent px-4 py-3 text-sm font-semibold text-p-accent-text"
            >
              Open in Maps <Icon name="arrowUpRight" size={16} />
            </a>
          </div>
        </Section>
      );
    }

    case "upi": {
      const upiLink = `upi://pay?pa=${encodeURIComponent(block.data.vpa)}&pn=${encodeURIComponent(block.data.payeeName)}&cu=INR`;
      return (
        <Section title={block.title ?? "Pay"}>
          <div className="rounded-2xl border border-p-border bg-p-surface p-5">
            <p className="text-sm text-p-muted">UPI ID</p>
            <p className="mt-1 font-mono text-[15px] break-all">{block.data.vpa}</p>
            <a
              href={upiLink}
              data-track="link_click"
              data-target="upi"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-p-accent px-4 py-3 text-sm font-semibold text-p-accent-text"
            >
              <Icon name="rupee" size={16} /> Pay with any UPI app
            </a>
          </div>
        </Section>
      );
    }

    case "text":
      return (
        <Section title={block.title}>
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-p-text/90">{block.data.body}</p>
        </Section>
      );
  }
}
