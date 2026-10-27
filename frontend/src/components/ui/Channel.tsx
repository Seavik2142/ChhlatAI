import clsx from "clsx";
import type { CSSProperties } from "react";
import type { Platform } from "../../lib/types";

const BG: Record<Platform, string> = {
  telegram: "bg-telegram", facebook: "bg-facebook", instagram: "bg-instagram", tiktok: "bg-tiktok",
};

/** Figma component "Channel" (Platform=Facebook|Instagram|Telegram|TikTok). */
export function Channel({ platform, size = 24, className, style }: {
  platform: Platform; size?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <span className={clsx("relative inline-block shrink-0 overflow-hidden rounded-full", BG[platform], className)}
      style={{ width: size, height: size, ...style }} title={platform}>
      <img src={`/figma/ch-${platform}.svg`} alt={platform} className="absolute inset-0 size-full" />
    </span>
  );
}

export function ChannelRow({ size = 24, gap = 6 }: { size?: number; gap?: number }) {
  return (
    <span className="inline-flex" style={{ gap }}>
      {(["telegram", "facebook", "instagram", "tiktok"] as const).map((p) => <Channel key={p} platform={p} size={size} />)}
    </span>
  );
}
