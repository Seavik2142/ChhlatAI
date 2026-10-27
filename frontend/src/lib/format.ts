import type { OrderStatus, Platform } from "./types";

export const money = (n: number | null | undefined) => `$${(n ?? 0).toFixed(2)}`;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function formatChatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

export function isSameDay(isoA: string, isoB: string): boolean {
  try {
    const da = new Date(isoA);
    const db = new Date(isoB);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  } catch {
    return false;
  }
}

export function formatChatDateDivider(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffMs = today.getTime() - target.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

export const clock = (iso: string) => formatChatTime(iso);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Avatar tints cycle through the soft status colours used in the design.
const TONES = ["vip", "info", "brand", "success", "danger", "warning"] as const;
export type Tone = (typeof TONES)[number] | "neutral";
export const toneFor = (id: number): Tone => TONES[id % TONES.length];

export const PLATFORM_NAME: Record<Platform, string> = {
  telegram: "Telegram", facebook: "Messenger", instagram: "Instagram", tiktok: "TikTok",
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "Awaiting payment", tone: "neutral" },
  checking_slip: { label: "Checking slip", tone: "warning" },
  needs_review: { label: "Needs review", tone: "danger" },
  paid: { label: "Paid ✓", tone: "success" },
  confirmed: { label: "Confirmed", tone: "brand" },
  shipped: { label: "Shipped", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
