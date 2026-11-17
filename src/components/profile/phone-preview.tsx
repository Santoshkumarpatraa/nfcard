"use client";

import type { ReactNode } from "react";

/** Scrollable phone-sized preview whose links and buttons are inert, so demos and drafts can be browsed but not acted on. */
export function PhonePreview({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`h-full overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest("a, button")) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}
