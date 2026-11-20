import type { ReactNode } from "react";

/** iPhone-style device frame (Dynamic Island, status bar, side buttons) around a scrollable preview. */
export function IPhoneFrame({ children, className = "h-[720px]" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[370px] ${className}`}>
      <span aria-hidden className="absolute top-[110px] -left-[3px] h-7 w-[3px] rounded-l bg-[#3a3a3e]" />
      <span aria-hidden className="absolute top-[160px] -left-[3px] h-12 w-[3px] rounded-l bg-[#3a3a3e]" />
      <span aria-hidden className="absolute top-[222px] -left-[3px] h-12 w-[3px] rounded-l bg-[#3a3a3e]" />
      <span aria-hidden className="absolute top-[180px] -right-[3px] h-20 w-[3px] rounded-r bg-[#3a3a3e]" />
      <div className="relative h-full rounded-[56px] bg-gradient-to-b from-[#4a4a4f] via-[#2a2a2d] to-[#4a4a4f] p-[3px] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.7)]">
        <div className="relative h-full rounded-[53px] bg-black p-[9px]">
          <div className="relative h-full overflow-hidden rounded-[45px] bg-black">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between px-8 pt-1 text-[14px] font-semibold text-white mix-blend-difference"
            >
              <span>9:41</span>
              <span className="flex items-center gap-1.5">
                <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="1" />
                  <rect x="4.5" y="5" width="3" height="6" rx="1" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
                  <rect x="13.5" y="0" width="3" height="11" rx="1" />
                </svg>
                <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                  <path d="M7.5 2.2c2 0 3.8.8 5.2 2l1.1-1.1A9 9 0 0 0 7.5.6 9 9 0 0 0 1.2 3.1l1.1 1.1a7.4 7.4 0 0 1 5.2-2Zm0 3.2c1.1 0 2.2.4 3 1.2l1.1-1.1a5.8 5.8 0 0 0-8.2 0l1.1 1.1c.8-.8 1.9-1.2 3-1.2Zm0 3.2c.4 0 .8.2 1 .4L7.5 10.1 6.5 9c.2-.2.6-.4 1-.4Z" />
                </svg>
                <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
                  <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity="0.4" />
                  <rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" />
                  <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="currentColor" opacity="0.5" />
                </svg>
              </span>
            </div>
            <div aria-hidden className="absolute top-[11px] left-1/2 z-30 h-[32px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
            {children}
            <div aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-white/70 mix-blend-difference" />
          </div>
        </div>
      </div>
    </div>
  );
}
