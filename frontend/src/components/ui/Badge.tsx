import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tone } from "../../lib/format";

const TONE: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-2",
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  vip: "bg-vip-soft text-vip",
};
const DOT: Record<Tone, string> = {
  neutral: "bg-muted", brand: "bg-brand", success: "bg-success", warning: "bg-warning",
  danger: "bg-danger", info: "bg-info", vip: "bg-vip",
};

/** Figma component "Badge" (Tone=Neutral|Brand|Success|Warning|Danger|Info|VIP). */
export function Badge({ tone = "neutral", dot, children, className }: {
  tone?: Tone; dot?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <span className={clsx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium", TONE[tone], className)}>
      {dot && <span className={clsx("size-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}
