import clsx from "clsx";
import { initials, type Tone } from "../../lib/format";
import type { Platform } from "../../lib/types";
import { Channel } from "./Channel";

const TONE: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-2", brand: "bg-brand-soft text-brand", success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", info: "bg-info-soft text-info",
  vip: "bg-vip-soft text-vip",
};

/** Figma component "Avatar", optionally with the customer's channel badge ("Avatar + channel"). */
export function Avatar({ name, tone = "brand", size = 40, platform, solid, className }: {
  name: string; tone?: Tone; size?: number; platform?: Platform; solid?: boolean; className?: string;
}) {
  return (
    <span className={clsx("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className={clsx("flex size-full items-center justify-center rounded-full font-semibold",
          solid ? "bg-brand text-on-brand" : TONE[tone])}
        style={{ fontSize: size <= 44 ? 14 : 16, lineHeight: "22px" }}
      >
        {initials(name)}
      </span>
      {platform && (
        // Badge sits at 65% / 65% and is 40% of the avatar, as in the Figma inbox rows.
        <span className="absolute flex" style={{ left: "65%", top: "65%" }}>
          <Channel platform={platform} size={Math.round(size * 0.4)} />
        </span>
      )}
    </span>
  );
}
