import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink-950 text-white hover:bg-ink-800",
  secondary: "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  gold: "bg-gold-300 text-ink-950 hover:bg-gold-200",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={buttonClass(variant, className)} />;
}

export const inputClass =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-950 placeholder:text-ink-500 sm:text-[15px] focus:border-ink-950 focus:ring-2 focus:ring-ink-950/10 focus:outline-none disabled:bg-ink-50";

// A caller-given width (w-24, w-64...) replaces the default full width instead of fighting it.
const sizedInputClass = (className?: string) => (className && /(^|\s)w-/.test(className) ? inputClass.replace("w-full ", "") : inputClass);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(sizedInputClass(className), className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputClass, "min-h-24", className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputClass, "pr-8", className)} />;
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  // Without an id to point at, the whole field becomes the label so its single input is still named for screen readers.
  const Wrapper = htmlFor ? "div" : "label";
  return (
    <Wrapper className="flex flex-col gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium text-ink-800">{label}</span>
      )}
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
    </Wrapper>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-ink-200 bg-white", className)}>{children}</div>;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-ink-200 bg-ink-50 text-ink-700",
  };
  return <div className={cx("rounded-xl border px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "amber" | "red"; children: ReactNode }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
  };
  return <span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-ink-100", className)} />;
}

export { cx };
