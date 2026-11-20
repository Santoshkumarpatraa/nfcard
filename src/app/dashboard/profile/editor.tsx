"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/dashboard/actions";
import { Icon } from "@/components/icons";
import { IPhoneFrame } from "@/components/profile/iphone-frame";
import { PhonePreview } from "@/components/profile/phone-preview";
import { ProfileView } from "@/components/profile/profile-view";
import { Alert, Button, Card, Field, Input, Select, Textarea, cx, inputClass } from "@/components/ui";
import type { PublicProfile } from "@/data/public-profile";
import { BLOCK_LABELS, BLOCK_TYPES, type BlockInput, type BlockType, SOCIAL_NETWORKS, networkFromUrl, pruneEmptyBlocks } from "@/lib/blocks";
import { imageUrl } from "@/lib/media";
import { formatPhone } from "@/lib/phone";
import { THEMES, THEME_IDS } from "@/lib/themes";
import { uploadDocument, uploadImage } from "@/lib/upload-client";
import { runAction } from "@/lib/run-action";

type ProfileState = {
  displayName: string;
  headline: string;
  company: string;
  bio: string;
  contactPhone: string;
  contactEmail: string;
  whatsapp: string;
  website: string;
  address: string;
  avatarKey: string | null;
  coverKey: string | null;
  theme: string;
  accent: string;
};

type EditorBlock = BlockInput & { uid: string };

let uidCounter = 0;
const nextUid = () => `b${++uidCounter}`;

function defaultBlock(type: BlockType, displayName: string): BlockInput {
  switch (type) {
    case "links":
      return { type, isVisible: true, data: { items: [{ label: "", url: "" }] } };
    case "social":
      return { type, isVisible: true, data: { items: [{ network: "instagram", url: "" }] } };
    case "gallery":
      return { type, isVisible: true, data: { images: [] } };
    case "video":
      return { type, isVisible: true, data: { url: "" } };
    case "services":
      return { type, isVisible: true, data: { items: [{ name: "", price: "", description: "" }] } };
    case "document":
      return { type, isVisible: true, data: { items: [] } };
    case "reviews":
      return { type, isVisible: true, data: { googleReviewUrl: "", items: [] } };
    case "location":
      return { type, isVisible: true, data: { address: "" } };
    case "upi":
      return { type, isVisible: true, data: { vpa: "", payeeName: displayName } };
    case "text":
      return { type, isVisible: true, data: { body: "" } };
  }
}

function stripUid(block: EditorBlock): BlockInput {
  const { uid, ...rest } = block;
  return rest;
}

export function ProfileEditor({
  profileId,
  username,
  isPublished,
  verifiedPhone,
  premiumNotice,
  initialProfile,
  initialBlocks,
}: {
  profileId: string;
  username: string;
  isPublished: boolean;
  verifiedPhone: string | null;
  premiumNotice: string | null;
  initialProfile: ProfileState;
  initialBlocks: BlockInput[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => initialBlocks.map((b) => ({ ...b, uid: nextUid() })));
  const [saved, setSaved] = useState(() => JSON.stringify({ profile: initialProfile, blocks: initialBlocks }));
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);

  const payload = useMemo(() => ({ profile, blocks: blocks.map(stripUid) }), [profile, blocks]);
  const dirty = JSON.stringify(payload) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    // Capture phase runs before Next's Link handler, so cancelling here stops in-app navigation too.
    const guardLinks = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLinks, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLinks, true);
    };
  }, [dirty]);

  const set = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const updateBlock = (uid: string, next: BlockInput) =>
    setBlocks((current) => current.map((block) => (block.uid === uid ? { ...next, uid } : block)));

  const moveBlock = (uid: string, direction: -1 | 1) =>
    setBlocks((current) => {
      const index = current.findIndex((block) => block.uid === uid);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [moved] = copy.splice(index, 1);
      if (moved) copy.splice(target, 0, moved);
      return copy;
    });

  function save() {
    startTransition(async () => {
      const response = await runAction(() => saveProfile({ ...payload, blocks: pruneEmptyBlocks(payload.blocks) }));
      if (response.ok) {
        setSaved(JSON.stringify(payload));
        setResult({ ok: true, text: response.message ?? "Saved" });
        router.refresh();
      } else {
        setResult({ ok: false, text: response.error });
      }
    });
  }

  const previewProfile: PublicProfile = {
    id: profileId,
    username,
    displayName: profile.displayName || "Your name",
    headline: profile.headline || null,
    company: profile.company || null,
    bio: profile.bio || null,
    contactPhone: profile.contactPhone || null,
    contactEmail: profile.contactEmail || null,
    whatsapp: profile.whatsapp || null,
    website: profile.website || null,
    address: profile.address || null,
    avatarKey: profile.avatarKey,
    coverKey: profile.coverKey,
    theme: profile.theme,
    accent: profile.accent || null,
    blocks: blocks.filter((block) => block.isVisible).map(stripUid),
  };

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-50/95 px-5 py-3 backdrop-blur lg:top-0 lg:-mx-10 lg:px-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="text-xs text-ink-500">
            {dirty ? "Unsaved changes" : isPublished ? "Saved. Changes go live instantly." : "Saved. Publish from Overview."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={() => setShowPreview((v) => !v)}>
            <Icon name="eye" size={16} /> {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {premiumNotice ? (
        <div className="mb-6">
          <Alert tone="info">
            {premiumNotice}{" "}
            <Link href="/dashboard/plan" className="font-medium underline">
              Renew Premium
            </Link>
          </Alert>
        </div>
      ) : null}

      {result ? (
        <div className="mb-6">
          <Alert tone={result.ok ? "success" : "error"}>{result.text}</Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cx("flex flex-col gap-6", showPreview && "hidden lg:flex")}>
          <Card className="p-5">
            <h2 className="font-medium">Photos</h2>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <ImagePicker
                label="Profile photo"
                kind="avatar"
                value={profile.avatarKey}
                onChange={(key) => set("avatarKey", key)}
                previewClass="size-20 rounded-full"
                previewWidth={192}
              />
              <ImagePicker
                label="Cover image"
                kind="cover"
                value={profile.coverKey}
                onChange={(key) => set("coverKey", key)}
                previewClass="h-16 w-48 rounded-xl sm:h-20 sm:w-60"
                previewWidth={720}
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-medium">About you</h2>
            <Field label="Display name" htmlFor="displayName">
              <Input id="displayName" value={profile.displayName} maxLength={80} onChange={(e) => set("displayName", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="headline">
                <Input id="headline" value={profile.headline} maxLength={80} placeholder="Founder" onChange={(e) => set("headline", e.target.value)} />
              </Field>
              <Field label="Company" htmlFor="company">
                <Input id="company" value={profile.company} maxLength={80} onChange={(e) => set("company", e.target.value)} />
              </Field>
            </div>
            <Field label="Bio" htmlFor="bio" hint={`${profile.bio.length}/600`}>
              <Textarea id="bio" value={profile.bio} maxLength={600} rows={4} onChange={(e) => set("bio", e.target.value)} />
            </Field>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="font-medium">Contact buttons</h2>
              <p className="text-xs text-ink-500">Shown as one-tap buttons and saved into the contact card.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone"
                htmlFor="contactPhone"
                hint={
                  !profile.contactPhone && verifiedPhone ? (
                    <button type="button" className="underline" onClick={() => set("contactPhone", verifiedPhone)}>
                      Use my verified number ({formatPhone(verifiedPhone)})
                    </button>
                  ) : undefined
                }
              >
                <Input id="contactPhone" type="tel" value={profile.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </Field>
              <Field
                label="WhatsApp"
                htmlFor="whatsapp"
                hint={
                  profile.contactPhone && profile.whatsapp !== profile.contactPhone ? (
                    <button type="button" className="underline" onClick={() => set("whatsapp", profile.contactPhone)}>
                      Same as phone
                    </button>
                  ) : undefined
                }
              >
                <Input id="whatsapp" type="tel" value={profile.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </Field>
              <Field label="Public email" htmlFor="contactEmail">
                <Input id="contactEmail" type="email" value={profile.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              </Field>
              <Field label="Website" htmlFor="website">
                <Input id="website" value={profile.website} placeholder="example.com" onChange={(e) => set("website", e.target.value)} />
              </Field>
            </div>
            <Field label="Address (saved to contact)" htmlFor="address">
              <Input id="address" value={profile.address} maxLength={300} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </Card>

          <Card className="p-5">
            <h2 className="font-medium">Appearance</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {THEME_IDS.map((id) => {
                const theme = THEMES[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set("theme", id)}
                    className={cx(
                      "rounded-xl border p-2 text-left text-xs font-medium transition",
                      profile.theme === id ? "border-ink-950 ring-2 ring-ink-950/10" : "border-ink-200",
                    )}
                  >
                    <span className="flex h-12 items-end gap-1 rounded-lg p-2" style={{ background: theme.bg }}>
                      <span className="h-3 w-8 rounded-full" style={{ background: theme.accent }} />
                      <span className="h-3 w-4 rounded-full" style={{ background: theme.surface }} />
                    </span>
                    <span className="mt-1.5 block">{theme.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="color"
                aria-label="Accent colour"
                value={profile.accent || THEMES[THEME_IDS.find((id) => id === profile.theme) ?? "onyx"].accent}
                onChange={(e) => set("accent", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
              />
              <span className="text-sm text-ink-600">Accent colour</span>
              {profile.accent ? (
                <button type="button" className="text-xs text-ink-500 underline" onClick={() => set("accent", "")}>
                  Use theme default
                </button>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-medium">Sections</h2>
                <p className="text-xs text-ink-500">Shown below your contact buttons, in this order.</p>
              </div>
            </div>
            {blocks.map((block, index) => (
              <BlockCard
                key={block.uid}
                block={block}
                index={index}
                total={blocks.length}
                onChange={(next) => updateBlock(block.uid, next)}
                onMove={(direction) => moveBlock(block.uid, direction)}
                onRemove={() => setBlocks((current) => current.filter((b) => b.uid !== block.uid))}
              />
            ))}
            <AddBlock
              onAdd={(type) =>
                setBlocks((current) => [...current, { ...defaultBlock(type, profile.displayName), uid: nextUid() }])
              }
            />
          </div>
        </div>

        <div className={cx("lg:block", showPreview ? "block" : "hidden")}>
          <div className="sticky top-24">
            <IPhoneFrame className="h-[720px]">
              <PhonePreview>
                <ProfileView profile={previewProfile} preview />
              </PhonePreview>
            </IPhoneFrame>
            <p className="mt-3 text-center text-xs text-ink-500">Live preview. Save to publish changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePicker({
  label,
  kind,
  value,
  onChange,
  previewClass,
  previewWidth,
}: {
  label: string;
  kind: "avatar" | "cover";
  value: string | null;
  onChange: (key: string | null) => void;
  previewClass: string;
  previewWidth: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const image = await uploadImage(file, kind);
      onChange(image.key);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className={cx("shrink-0 overflow-hidden bg-ink-100", previewClass)}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(value, previewWidth)} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading..." : value ? "Change" : "Upload"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

function AddBlock({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {open ? (
        <Card className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="rounded-xl border border-ink-200 px-3 py-2.5 text-left text-sm hover:border-ink-950"
            >
              {BLOCK_LABELS[type]}
            </button>
          ))}
        </Card>
      ) : (
        <Button variant="secondary" className="w-full border-dashed py-3" onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} /> Add section
        </Button>
      )}
    </div>
  );
}

function BlockCard({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  onChange: (next: BlockInput) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const iconButton = "rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30";

  return (
    <Card className={cx("overflow-hidden", !block.isVisible && "opacity-60")}>
      <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-2.5">
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon name={open ? "up" : "down"} size={16} className="text-ink-400" />
          <span className="text-sm font-medium">{block.title || BLOCK_LABELS[block.type]}</span>
          <span className="text-xs text-ink-500">{index + 1}</span>
        </button>
        <button type="button" aria-label="Move up" disabled={index === 0} className={iconButton} onClick={() => onMove(-1)}>
          <Icon name="up" size={16} />
        </button>
        <button type="button" aria-label="Move down" disabled={index === total - 1} className={iconButton} onClick={() => onMove(1)}>
          <Icon name="down" size={16} />
        </button>
        <button
          type="button"
          aria-label={block.isVisible ? "Hide section" : "Show section"}
          className={iconButton}
          onClick={() => onChange({ ...block, isVisible: !block.isVisible })}
        >
          <Icon name={block.isVisible ? "eye" : "eyeOff"} size={16} />
        </button>
        <button
          type="button"
          aria-label="Remove section"
          className={iconButton}
          onClick={() => {
            if (window.confirm("Remove this section?")) onRemove();
          }}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
      {open ? (
        <div className="flex flex-col gap-4 p-4">
          <Field label="Section heading (optional)">
            <Input
              value={block.title ?? ""}
              maxLength={60}
              placeholder={BLOCK_LABELS[block.type]}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </Field>
          <BlockFields block={block} onChange={onChange} />
        </div>
      ) : null}
    </Card>
  );
}

function RowList<T>({
  items,
  onChange,
  empty,
  addLabel,
  render,
  max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: NoInfer<T>;
  addLabel: string;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
  max: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">{render(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))))}</div>
          <button
            type="button"
            aria-label="Remove"
            className="mt-2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
      {items.length < max ? (
        <button type="button" className="self-start text-sm font-medium text-ink-700 hover:text-ink-950" onClick={() => onChange([...items, empty])}>
          + {addLabel}
        </button>
      ) : null}
    </div>
  );
}

function BlockFields({ block, onChange }: { block: BlockInput; onChange: (next: BlockInput) => void }) {
  switch (block.type) {
    case "links":
      return (
        <RowList
          items={block.data.items}
          max={20}
          empty={{ label: "", url: "" }}
          addLabel="Add link"
          onChange={(items) => onChange({ ...block, data: { items } })}
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Label" aria-label="Link label" value={item.label} maxLength={60} onChange={(e) => update({ ...item, label: e.target.value })} />
              <Input placeholder="https://" aria-label="Link address" value={item.url} onChange={(e) => update({ ...item, url: e.target.value })} />
            </div>
          )}
        />
      );

    case "social":
      return (
        <RowList
          items={block.data.items}
          max={12}
          empty={{ network: "linkedin", url: "" }}
          addLabel="Add profile"
          onChange={(items) => onChange({ ...block, data: { items } })}
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
              <Select
                aria-label="Network"
                value={item.network}
                onChange={(e) => {
                  const network = SOCIAL_NETWORKS.find((n) => n === e.target.value);
                  if (network) update({ ...item, network });
                }}
              >
                {SOCIAL_NETWORKS.map((network) => (
                  <option key={network} value={network}>
                    {network === "x" ? "X (Twitter)" : network[0]?.toUpperCase() + network.slice(1)}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Paste profile link"
                aria-label="Profile link"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value, network: networkFromUrl(e.target.value) ?? item.network })}
              />
            </div>
          )}
        />
      );

    case "services":
      return (
        <RowList
          items={block.data.items}
          max={20}
          empty={{ name: "", price: "", description: "" }}
          addLabel="Add service"
          onChange={(items) => onChange({ ...block, data: { items } })}
          render={(item, update) => (
            <div className="grid gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-[1fr_140px]">
              <Input placeholder="Service name" aria-label="Service name" value={item.name} maxLength={80} onChange={(e) => update({ ...item, name: e.target.value })} />
              <Input placeholder="Price e.g. ₹2,999" aria-label="Price" value={item.price ?? ""} maxLength={40} onChange={(e) => update({ ...item, price: e.target.value })} />
              <Textarea
                placeholder="Short description (optional)"
                aria-label="Description"
                rows={2}
                className="min-h-0 sm:col-span-2"
                value={item.description ?? ""}
                maxLength={300}
                onChange={(e) => update({ ...item, description: e.target.value })}
              />
            </div>
          )}
        />
      );

    case "gallery":
      return <GalleryFields block={block} onChange={onChange} />;

    case "video":
      return (
        <div className="grid gap-3">
          <Field label="YouTube link">
            <Input placeholder="https://youtube.com/watch?v=..." value={block.data.url} onChange={(e) => onChange({ ...block, data: { ...block.data, url: e.target.value } })} />
          </Field>
          <Field label="Caption (optional)">
            <Input value={block.data.caption ?? ""} maxLength={120} onChange={(e) => onChange({ ...block, data: { ...block.data, caption: e.target.value } })} />
          </Field>
        </div>
      );

    case "reviews":
      return (
        <div className="flex flex-col gap-3">
          <Field label="Google review link (optional)">
            <Input
              placeholder="https://g.page/r/..."
              value={block.data.googleReviewUrl ?? ""}
              onChange={(e) => onChange({ ...block, data: { ...block.data, googleReviewUrl: e.target.value } })}
            />
          </Field>
          <RowList
            items={block.data.items}
            max={10}
            empty={{ author: "", text: "", rating: 5 }}
            addLabel="Add testimonial"
            onChange={(items) => onChange({ ...block, data: { ...block.data, items } })}
            render={(item, update) => (
              <div className="grid gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-[1fr_120px]">
                <Input placeholder="Customer name" aria-label="Customer name" value={item.author} maxLength={60} onChange={(e) => update({ ...item, author: e.target.value })} />
                <Select aria-label="Rating" value={item.rating} onChange={(e) => update({ ...item, rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </Select>
                <Textarea
                  placeholder="What they said"
                  aria-label="Review text"
                  rows={2}
                  className="min-h-0 sm:col-span-2"
                  value={item.text}
                  maxLength={400}
                  onChange={(e) => update({ ...item, text: e.target.value })}
                />
              </div>
            )}
          />
        </div>
      );

    case "document":
      return <DocumentFields block={block} onChange={onChange} />;

    case "location":
      return (
        <div className="grid gap-3">
          <Field label="Address">
            <Textarea rows={2} className="min-h-0" value={block.data.address} maxLength={300} onChange={(e) => onChange({ ...block, data: { ...block.data, address: e.target.value } })} />
          </Field>
          <Field label="Google Maps link (optional)" hint="Leave empty to search the address">
            <Input value={block.data.mapsUrl ?? ""} onChange={(e) => onChange({ ...block, data: { ...block.data, mapsUrl: e.target.value } })} />
          </Field>
        </div>
      );

    case "upi":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="UPI ID">
            <Input placeholder="name@okbank" value={block.data.vpa} onChange={(e) => onChange({ ...block, data: { ...block.data, vpa: e.target.value } })} />
          </Field>
          <Field label="Payee name">
            <Input value={block.data.payeeName} maxLength={60} onChange={(e) => onChange({ ...block, data: { ...block.data, payeeName: e.target.value } })} />
          </Field>
        </div>
      );

    case "text":
      return (
        <Textarea rows={5} aria-label="About text" value={block.data.body} maxLength={1500} onChange={(e) => onChange({ ...block, data: { body: e.target.value } })} />
      );
  }
}

function GalleryFields({
  block,
  onChange,
}: {
  block: Extract<BlockInput, { type: "gallery" }>;
  onChange: (next: BlockInput) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const images = [...block.data.images];
    try {
      for (const file of Array.from(files).slice(0, 12 - images.length)) {
        const image = await uploadImage(file, "gallery");
        if (!images.some((existing) => existing.key === image.key)) images.push(image);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      onChange({ ...block, data: { images } });
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {block.data.images.map((image) => (
          <div key={image.key} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(image.key, 480)} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white"
              onClick={() => onChange({ ...block, data: { images: block.data.images.filter((i) => i.key !== image.key) } })}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
        {block.data.images.length < 12 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-xs text-ink-500 hover:border-ink-950"
          >
            <Icon name="plus" size={18} />
            {busy ? "Uploading..." : "Add photos"}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function DocumentFields({
  block,
  onChange,
}: {
  block: Extract<BlockInput, { type: "document" }>;
  onChange: (next: BlockInput) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const key = await uploadDocument(file);
      if (block.data.items.some((item) => item.key === key)) {
        setError("This file is already added");
        return;
      }
      const label = file.name.replace(/\.pdf$/i, "").slice(0, 80) || "Document";
      onChange({ ...block, data: { items: [...block.data.items, { key, label }] } });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {block.data.items.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          <Icon name="file" size={18} className="shrink-0 text-ink-400" />
          <input
            className={inputClass}
            aria-label="Document name"
            value={item.label}
            maxLength={80}
            onChange={(e) =>
              onChange({
                ...block,
                data: { items: block.data.items.map((d, i) => (i === index ? { ...d, label: e.target.value } : d)) },
              })
            }
          />
          <button
            type="button"
            aria-label="Remove document"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
            onClick={() => onChange({ ...block, data: { items: block.data.items.filter((_, i) => i !== index) } })}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
      {block.data.items.length < 10 ? (
        <Button type="button" variant="secondary" disabled={busy} className="self-start" onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading..." : "Upload PDF"}
        </Button>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
