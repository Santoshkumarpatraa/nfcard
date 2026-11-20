"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Icon } from "@/components/icons";
import { CardRender } from "@/components/marketing/card-render";
import { IPhoneFrame } from "@/components/profile/iphone-frame";
import { ProfileView } from "@/components/profile/profile-view";
import { showcaseProfile } from "@/lib/demo-profile";
import { site } from "@/lib/site";

const CANVAS_W = 500;
const CANVAS_H = 780;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => t * t * (3 - 2 * t);
const typed = (text: string, t: number) => text.slice(0, Math.round(text.length * clamp(t)));

const CHAPTERS = [
  { at: 0, title: "Meet someone new.", body: "No paper cards to hunt for. Your card lives in your wallet." },
  { at: 0.13, title: "Tap. That's it.", body: "Hold your card near their phone. Works on iPhone and Android, no app needed." },
  { at: 0.27, title: "Your profile opens instantly.", body: "Contact buttons, WhatsApp, services and more, on a page that loads in a blink." },
  { at: 0.4, title: "Saved in one tap.", body: "They add you to their contacts with your name, number and email." },
  { at: 0.53, title: "They share theirs back.", body: "Their details land in your leads and your inbox, so no follow-up is lost." },
  { at: 0.67, title: "See what's working.", body: "Views, taps, saves and clicks, right in your dashboard." },
  { at: 0.8, title: "Change anything, anytime.", body: "New role or number? Edit your profile and your card shows it instantly. No reprint." },
  { at: 0.9, title: "Lost it? Switch it off.", body: "Disable a card from your dashboard in a second. Your profile stays safe." },
];

const UPDATED_PROFILE = { ...showcaseProfile, headline: "Founder & CEO" };
const LEAD = { name: "Riya Kapoor", phone: "+91 98200 12345" };
const STATS = [
  { label: "Views", value: 1284 },
  { label: "Taps", value: 342 },
  { label: "Saves", value: 97 },
  { label: "Leads", value: 23 },
];
const BARS = [0.35, 0.55, 0.42, 0.7, 0.62, 0.88, 1];

function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let current = -1;
    // Eases the shown progress toward the scroll position so wheel steps glide instead of jump.
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const target = distance > 0 ? clamp(-rect.top / distance) : 0;
      current = current < 0 || reduceMotion ? target : current + (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0004) current = target;
      setProgress(current);
      if (current !== target) frame = requestAnimationFrame(update);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
  return progress;
}

function useFitScale(ref: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(0.8);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(1.1, width / CANVAS_W, height / CANVAS_H));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

type Point = { x: number; y: number };

// Finds where the profile's Save contact and Share yours buttons sit, so the demo taps land on them.
function useButtonCentres(ref: RefObject<HTMLElement | null>) {
  const [centres, setCentres] = useState<{ save?: Point; share?: Point }>({});
  useEffect(() => {
    const measure = () => {
      const root = ref.current;
      const save = root?.querySelector<HTMLElement>('[data-track="save_contact"]');
      const share = save?.parentElement?.querySelector<HTMLElement>("button");
      if (!root || !save || !share) return;
      const box = root.getBoundingClientRect();
      const scale = box.width / root.offsetWidth || 1;
      const centre = (element: HTMLElement): Point => {
        const rect = element.getBoundingClientRect();
        return { x: (rect.left + rect.width / 2 - box.left) / scale, y: (rect.top + rect.height / 2 - box.top) / scale };
      };
      setCentres({ save: centre(save), share: centre(share) });
    };
    const frame = requestAnimationFrame(measure);
    document.fonts.ready.then(measure).catch(() => undefined);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
  return centres;
}

/** Scroll-driven story of a card tap, from meeting someone to switching off a lost card. */
export function TapStory() {
  const trackRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(trackRef);
  const scale = useFitScale(sceneRef);
  const seg = (from: number, to: number) => ease(clamp((p - from) / (to - from)));

  const profileRef = useRef<HTMLDivElement>(null);
  const targets = useButtonCentres(profileRef);
  const profile = useMemo(() => <ProfileView profile={showcaseProfile} preview />, []);
  const updatedProfile = useMemo(() => <ProfileView profile={UPDATED_PROFILE} preview />, []);

  const chapter = CHAPTERS.reduce((current, item, index) => (p >= item.at ? index : current), 0);

  // People walk in and meet, then the camera zooms into the tap.
  const walk = seg(0, 0.08);
  const bob = Math.sin(walk * Math.PI * 6) * 4 * (1 - walk);
  const peopleOut = seg(0.12, 0.16);

  // Close-up: card meets phone, ripples, then the profile slides up.
  const phoneIn = seg(0.13, 0.17);
  const cardIn = seg(0.16, 0.23);
  const cardOut = seg(0.29, 0.34);
  const banner = seg(0.235, 0.255);
  const profileUp = seg(0.27, 0.32);
  const scroll = 150 * seg(0.33, 0.38) - 150 * seg(0.4, 0.43);

  const tapSave = p >= 0.43 && p < 0.448;
  const tapShare = p >= 0.535 && p < 0.553;
  const contactSheet = seg(0.448, 0.475) - seg(0.51, 0.53);
  const saved = p >= 0.495;
  const shareSheet = seg(0.553, 0.58) - seg(0.65, 0.67);
  const sent = p >= 0.645;
  const lead = seg(0.645, 0.67) - seg(0.7, 0.72);

  const stats = seg(0.71, 0.75) - seg(0.79, 0.81);
  const count = seg(0.72, 0.78);
  const editor = seg(0.81, 0.83) - seg(0.885, 0.9);
  const oldHeadline = "Founder";
  const newHeadline = "Founder & CEO";
  const headlineText =
    p < 0.835 ? oldHeadline : p < 0.845 ? typed(oldHeadline, 1 - seg(0.835, 0.845)) : typed(newHeadline, seg(0.845, 0.86));
  const updated = seg(0.865, 0.875);
  const toast = seg(0.865, 0.875) - seg(0.89, 0.9);

  const lost = seg(0.91, 0.93) - seg(0.965, 0.98);
  const switchedOff = p >= 0.94;
  const offScreen = seg(0.97, 0.99);

  const phoneDim = 1 - 0.6 * stats - 0.6 * lost;

  return (
    <section ref={trackRef} className="relative h-[820vh]" aria-label="How a tap works, step by step">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-[108px] md:flex-row md:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_45%,rgb(200_169_106/0.10),transparent)]" />

        <div className="relative z-10 order-2 flex h-48 shrink-0 flex-col justify-start px-6 md:order-1 md:h-auto md:w-[44%] md:justify-center md:pr-0 md:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          <ol className="relative min-h-[8.5rem] md:min-h-[19rem]">
            {CHAPTERS.map((item, index) => (
              <li
                key={item.title}
                className="absolute inset-x-0 top-0 transition-all duration-500"
                style={{ opacity: index === chapter ? 1 : 0, transform: `translateY(${index === chapter ? 0 : index < chapter ? -16 : 16}px)` }}
                aria-current={index === chapter ? "step" : undefined}
              >
                <p className="hidden text-xs font-medium tracking-[0.22em] text-gold-300 uppercase md:block">
                  Step {index + 1} of {CHAPTERS.length}
                </p>
                <h2 className="font-display text-[28px] leading-tight text-ink-50 md:mt-4 md:text-6xl">{item.title}</h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-300 md:mt-5 md:text-lg">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-auto mb-5 flex gap-1.5 md:mt-10 md:mb-0" aria-hidden>
            {CHAPTERS.map((item, index) => (
              <span
                key={item.title}
                className={`h-1 rounded-full transition-all duration-500 ${index === chapter ? "w-8 bg-gold-300" : "w-3 bg-white/15"}`}
              />
            ))}
          </div>
        </div>

        <div ref={sceneRef} className="relative order-1 min-h-0 flex-1 md:order-2" aria-hidden>
          <div
            className="absolute top-1/2 left-1/2"
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <People walk={walk} bob={bob} seg={seg} out={peopleOut} />

            <div
              className="absolute top-0 left-0 w-[240px]"
              style={{
                opacity: cardIn * (1 - cardOut),
                transform: `translate(${-320 + 290 * cardIn - 300 * cardOut}px, ${500 - 485 * cardIn + 420 * cardOut}px) rotate(${-30 + 16 * cardIn - 10 * cardOut}deg)`,
              }}
            >
              <CardRender finish="black" name="Aarav Mehta" title="Founder, Northwind Studio" />
            </div>
            <div
              className="absolute top-[30px] left-[65px] h-[720px] w-[370px]"
              style={{ opacity: phoneIn * phoneDim, transform: `scale(${0.9 + 0.1 * phoneIn})` }}
            >
              <IPhoneFrame className="h-full">
                <div className="absolute inset-0">
                  <LockScreen />
                  <div
                    className="absolute inset-x-2.5 top-[52px] z-10 flex items-center gap-3 rounded-[22px] bg-white/15 p-3 backdrop-blur-xl"
                    style={{ transform: `translateY(${(banner - 1) * 140}px)`, opacity: banner * (1 - profileUp) }}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gold-300 font-display text-lg text-ink-950">N</span>
                    <span className="min-w-0 text-[12px] leading-snug text-white">
                      <span className="block font-semibold">{site.name}</span>
                      Open Aarav Mehta&apos;s profile
                    </span>
                  </div>

                  <div className="absolute inset-0 overflow-hidden bg-ink-950" style={{ transform: `translateY(${(1 - profileUp) * 100}%)` }}>
                    <div style={{ transform: `translateY(${-scroll}px)` }}>
                      <div ref={profileRef} className="relative">
                        <div style={{ opacity: 1 - updated }}>{profile}</div>
                        <div className="absolute inset-0" style={{ opacity: updated }}>
                          {updatedProfile}
                        </div>
                        {[
                          { at: targets.save, active: tapSave },
                          { at: targets.share, active: tapShare },
                        ].map(({ at, active }, index) =>
                          at ? (
                            <span key={index} className="absolute size-0" style={{ left: at.x, top: at.y }}>
                              <TapDot active={active} />
                            </span>
                          ) : null,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: Math.max(contactSheet, shareSheet) * 0.45 }} />
                  <ContactSheet open={contactSheet} saved={saved} tapping={p >= 0.48 && p < 0.5} />
                  <ShareSheet open={shareSheet} p={p} seg={seg} sent={sent} />

                  <div
                    className="absolute inset-x-6 top-[58px] z-10 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-semibold text-white shadow-lg"
                    style={{ opacity: toast, transform: `translateY(${(toast - 1) * 20}px)` }}
                  >
                    <Icon name="check" size={14} /> Profile updated. No reprint.
                  </div>

                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-950 px-8 text-center"
                    style={{ opacity: offScreen }}
                  >
                    <span className="grid size-14 place-items-center rounded-full border border-white/10 text-ink-300">
                      <Icon name="shield" size={24} />
                    </span>
                    <p className="font-medium text-ink-50">This card is switched off</p>
                    <p className="text-[13px] text-ink-400">The owner has disabled it. Nothing is shared.</p>
                  </div>
                </div>
              </IPhoneFrame>
            </div>


            {[0, 1, 2].map((ring) => {
              const t = seg(0.225 + ring * 0.012, 0.265 + ring * 0.012);
              return (
                <span
                  key={ring}
                  className="absolute top-[85px] left-[100px] size-40 rounded-full border-2 border-gold-300"
                  style={{ opacity: t > 0 && t < 1 ? (1 - t) * 0.9 : 0, transform: `translate(-50%, -50%) scale(${0.3 + 1.9 * t})` }}
                />
              );
            })}

            <Panel open={lead} className="top-[80px]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-white">
                  <Icon name="mail" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-50">New lead from your card</p>
                    <span className="text-[11px] text-ink-500">now</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-300">
                    {LEAD.name} shared their details. {LEAD.phone}
                  </p>
                  <p className="mt-2 text-[11px] tracking-wide text-gold-300 uppercase">Aarav&apos;s inbox</p>
                </div>
              </div>
            </Panel>

            <Panel open={stats} className="top-[200px]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-50">This month</p>
                <span className="rounded-full bg-gold-300/15 px-2.5 py-0.5 text-[11px] font-medium text-gold-300">Premium</span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/5 p-2.5">
                    <p className="text-lg font-semibold text-ink-50 tabular-nums">{Math.round(stat.value * count).toLocaleString("en-IN")}</p>
                    <p className="text-[11px] text-ink-400">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-28 items-end gap-2">
                {BARS.map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300"
                    style={{ height: `${Math.max(4, height * 100 * seg(0.72 + index * 0.006, 0.76 + index * 0.006))}%` }}
                  />
                ))}
              </div>
            </Panel>

            <Panel open={editor} className="top-[520px]">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">Edit profile</p>
              <label className="mt-3 block text-xs text-ink-400">Headline</label>
              <div className="mt-1.5 flex h-11 items-center rounded-xl border border-gold-300/40 bg-ink-950 px-3.5 text-[15px] text-ink-50">
                {headlineText}
                <span className="ml-0.5 h-5 w-px animate-pulse bg-gold-300" />
              </div>
              <div className="mt-3 flex justify-end">
                <span className="relative rounded-full bg-gold-300 px-5 py-2 text-sm font-semibold text-ink-950">
                  {p >= 0.865 ? "Saved" : "Save"}
                  <TapDot active={p >= 0.86 && p < 0.87} />
                </span>
              </div>
            </Panel>

            <Panel open={lost} className="top-[300px]">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">Your cards</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="metal-black flex h-10 w-16 shrink-0 items-end rounded-md p-1.5 ring-1 ring-white/10">
                  <span className="h-1 w-6 rounded-full bg-gold-300/70" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-50">Metal Card</p>
                  <p className={`text-xs ${switchedOff ? "text-red-400" : "text-emerald-400"}`}>{switchedOff ? "Switched off" : "Active"}</p>
                </div>
                <span className={`relative flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-300 ${switchedOff ? "bg-white/15" : "bg-emerald-500"}`}>
                  <span className={`size-6 rounded-full bg-white shadow transition-transform duration-300 ${switchedOff ? "" : "translate-x-5"}`} />
                  <TapDot active={p >= 0.93 && p < 0.945} />
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ open, className, children }: { open: number; className: string; children: ReactNode }) {
  return (
    <div
      className={`absolute left-[30px] w-[440px] rounded-3xl border border-white/10 bg-ink-900/95 p-5 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl ${className}`}
      style={{ opacity: open, transform: `translateY(${(1 - open) * 30}px) scale(${0.96 + 0.04 * open})`, visibility: open > 0 ? "visible" : "hidden" }}
    >
      {children}
    </div>
  );
}

function TapDot({ active }: { active: boolean }) {
  return (
    <span
      className="pointer-events-none absolute top-1/2 left-1/2 size-10 rounded-full bg-white/50 transition-[opacity,transform] duration-300"
      style={{ opacity: active ? 1 : 0, transform: `translate(-50%, -50%) scale(${active ? 1 : 0.4})` }}
    />
  );
}

function LockScreen() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_30%_10%,#5b4a2a,transparent_60%),linear-gradient(180deg,#1a1712,#050505)] text-center text-white">
      <p className="mt-[92px] text-[15px] font-medium text-white/80">Friday 20 November</p>
      <p className="text-[76px] leading-none font-semibold tracking-tight">9:41</p>
    </div>
  );
}

function ContactSheet({ open, saved, tapping }: { open: number; saved: boolean; tapping: boolean }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f7] px-5 pt-3 pb-8 text-black"
      style={{ transform: `translateY(${(1 - open) * 105}%)` }}
    >
      <span className="mx-auto block h-1 w-9 rounded-full bg-black/20" />
      <div className="mt-5 flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-gradient-to-b from-[#a5a5ab] to-[#86868c] text-xl font-semibold text-white">AM</span>
        <p className="mt-3 text-lg font-semibold">Aarav Mehta</p>
        <p className="text-[13px] text-black/50">Founder, Northwind Studio</p>
      </div>
      <div className="mt-4 divide-y divide-black/10 rounded-xl bg-white text-[13px]">
        <p className="px-3.5 py-2.5">
          <span className="block text-[11px] text-black/45">mobile</span>
          <span className="text-[#007aff]">+91 90000 00000</span>
        </p>
        <p className="px-3.5 py-2.5">
          <span className="block text-[11px] text-black/45">email</span>
          <span className="text-[#007aff]">hello@example.com</span>
        </p>
      </div>
      <div
        className={`relative mt-4 flex h-11 items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold transition-colors duration-300 ${
          saved ? "bg-emerald-500 text-white" : "bg-[#007aff] text-white"
        }`}
      >
        {saved ? (
          <>
            <Icon name="check" size={16} /> Saved to Contacts
          </>
        ) : (
          "Add to Contacts"
        )}
        <TapDot active={tapping} />
      </div>
    </div>
  );
}

function ShareSheet({ open, p, seg, sent }: { open: number; p: number; seg: (from: number, to: number) => number; sent: boolean }) {
  const field = (label: string, value: string, active: boolean) => (
    <div>
      <p className="text-[11px] text-ink-400">{label}</p>
      <div className={`mt-1 flex h-10 items-center rounded-xl border bg-ink-950 px-3 text-[13px] text-ink-50 ${active ? "border-gold-300/60" : "border-white/10"}`}>
        {value}
        {active ? <span className="ml-0.5 h-4 w-px animate-pulse bg-gold-300" /> : null}
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white/10 bg-ink-900 px-5 pt-3 pb-8"
      style={{ transform: `translateY(${(1 - open) * 105}%)` }}
    >
      <span className="mx-auto block h-1 w-9 rounded-full bg-white/20" />
      <p className="mt-4 text-[15px] font-semibold text-ink-50">Share your details with Aarav</p>
      <div className="mt-4 flex flex-col gap-3">
        {field("Name", typed(LEAD.name, seg(0.585, 0.61)), p >= 0.58 && p < 0.61)}
        {field("Phone", typed(LEAD.phone, seg(0.61, 0.63)), p >= 0.61 && p < 0.635)}
      </div>
      <div
        className={`relative mt-5 flex h-11 items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold transition-colors duration-300 ${
          sent ? "bg-emerald-500 text-white" : "bg-gold-300 text-ink-950"
        }`}
      >
        {sent ? (
          <>
            <Icon name="check" size={16} /> Sent
          </>
        ) : (
          "Send"
        )}
        <TapDot active={p >= 0.635 && p < 0.65} />
      </div>
    </div>
  );
}

function People({
  walk,
  bob,
  seg,
  out,
}: {
  walk: number;
  bob: number;
  seg: (from: number, to: number) => number;
  out: number;
}) {
  const style: CSSProperties = {
    opacity: 1 - out,
    transform: `scale(${1 + 1.4 * out})`,
    transformOrigin: "250px 430px",
    visibility: out < 1 ? "visible" : "hidden",
  };
  const bubbleA = seg(0.04, 0.07);
  const bubbleB = seg(0.075, 0.1);

  return (
    <div className="absolute inset-0" style={style}>
      <div className="absolute inset-x-6 top-[712px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="absolute top-[400px] left-[50px]" style={{ transform: `translate(${(walk - 1) * 280}px, ${bob}px)` }}>
        <Bubble open={bubbleA} side="left">
          Hi, I&apos;m Aarav.
        </Bubble>
        <Person arm={seg(0.09, 0.13)} tone="#26262a" accent="#d7bd84" skin="#b98564" item="card" />
      </div>

      <div className="absolute top-[400px] right-[50px]" style={{ transform: `translate(${(1 - walk) * 280}px, ${-bob}px)` }}>
        <Bubble open={bubbleB} side="right">
          Riya. Great to meet you!
        </Bubble>
        <div style={{ transform: "scaleX(-1)" }}>
          <Person arm={seg(0.08, 0.12)} tone="#5a5a62" accent="#ead9b0" skin="#8d5a3b" item="phone" long />
        </div>
      </div>
    </div>
  );
}

function Bubble({ open, side, children }: { open: number; side: "left" | "right"; children: ReactNode }) {
  return (
    <div
      className={`absolute -top-16 w-max max-w-[170px] rounded-2xl bg-white px-3.5 py-2 text-[13px] font-medium text-ink-950 shadow-lg ${
        side === "left" ? "left-2 rounded-bl-sm" : "right-2 rounded-br-sm"
      }`}
      style={{ opacity: open, transform: `translateY(${(1 - open) * 8}px) scale(${0.9 + 0.1 * open})` }}
    >
      {children}
    </div>
  );
}

function Person({
  arm,
  tone,
  accent,
  skin,
  item,
  long = false,
}: {
  arm: number;
  tone: string;
  accent: string;
  skin: string;
  item: "card" | "phone";
  long?: boolean;
}) {
  return (
    <svg width="130" height="310" viewBox="0 0 130 310" fill="none">
      <rect x="40" y="196" width="21" height="112" rx="10" fill="#1b1b1e" />
      <rect x="66" y="196" width="21" height="112" rx="10" fill="#1b1b1e" />
      <path d="M28 96c0-14 12-24 26-24h20c14 0 26 10 26 24v104H28Z" fill={tone} />
      <path d="M64 74 56 100l8 40 8-40Z" fill={accent} opacity="0.9" />
      <rect x="57" y="58" width="14" height="18" rx="6" fill={skin} />
      <circle cx="64" cy="40" r="25" fill={skin} />
      <path d={long ? "M38 42c-2-20 12-30 28-30 15 0 27 10 26 28-6-8-16-12-27-12-11 0-20 5-27 14Z" : "M40 36c2-15 13-23 25-23 14 0 24 9 25 22-8-6-16-8-25-8s-17 3-25 9Z"} fill="#141416" />
      <g style={{ transform: `rotate(${-78 * arm}deg)`, transformOrigin: "92px 92px", transition: "none" }}>
        <rect x="84" y="84" width="17" height="92" rx="8.5" fill={tone} />
        <circle cx="92.5" cy="178" r="9" fill={skin} />
        {item === "card" ? (
          <rect x="80" y="182" width="36" height="23" rx="3" fill="#0f0f10" stroke={accent} strokeWidth="1.2" opacity={arm} />
        ) : (
          <rect x="83" y="176" width="20" height="36" rx="4" fill="#0b0b0c" stroke="#3a3a3e" strokeWidth="1.5" opacity={arm} />
        )}
      </g>
      <rect x="27" y="84" width="17" height="92" rx="8.5" fill={tone} style={{ filter: "brightness(0.85)" }} />
      <circle cx="35.5" cy="178" r="9" fill={skin} style={{ filter: "brightness(0.9)" }} />
    </svg>
  );
}
