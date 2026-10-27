import clsx from "clsx";
import { useState } from "react";
import { money } from "../../lib/format";
import type { Courier, Order } from "../../lib/types";
import { Button } from "../ui/Button";
import { FigmaIcon } from "../ui/Icon";
import { Toggle } from "../ui/Toggle";
import { BrandLogo } from "../ui/BrandLogo";

export const COURIERS: { key: Courier; name: string; sub: string; zone: string }[] = [
  { key: "jnt", name: "J&T Express", sub: "API · pickup today 2–4 PM", zone: "phnom_penh" },
  { key: "vet", name: "Virak Buntham (VET)", sub: "Provinces · next morning", zone: "province" },
  { key: "grab", name: "Grab Express", sub: "Phnom Penh · within 1 hour", zone: "grab" },
];

/** Figma "Send to delivery · INV-…" card (1x of the spotlight's 0.85 scale). */
export function SendToDelivery({ order, fees, onSend, onPrint, sending }: {
  order: Pick<Order, "invoice_no" | "customer" | "delivery_address" | "items" | "status" | "total" | "delivery_zone">;
  fees: Record<string, number>;
  onSend?: (courier: Courier, cod: boolean) => void;
  onPrint?: () => void;
  sending?: boolean;
}) {
  const initial = COURIERS.find((c) => c.zone === order.delivery_zone)?.key ?? "jnt";
  const [courier, setCourier] = useState<Courier>(initial);
  const [cod, setCod] = useState(false);
  const paid = !["awaiting_payment", "checking_slip", "needs_review"].includes(order.status);
  const items = order.items.reduce((n, i) => n + i.quantity, 0);
  const chosen = COURIERS.find((c) => c.key === courier)!;
  return (
    <div className="flex w-[420px] max-w-full flex-col gap-4 rounded-[14px] border border-line bg-surface p-6 shadow-float">
      <div className="flex flex-col gap-0.5">
        <span className="text-h3 font-semibold">Send to delivery · {order.invoice_no}</span>
        <span className="text-caption text-ink-2">បញ្ជូនទៅក្រុមហ៊ុនដឹកជញ្ជូន — no re-typing in the courier app</span>
      </div>
      <div className="flex flex-col gap-1 rounded-[10px] bg-subtle p-3">
        <span className="text-body font-semibold">{order.customer.name}{order.customer.phone && ` · ${order.customer.phone}`}</span>
        <span className="text-caption text-ink-2">
          {order.delivery_address ?? "No address yet"} · {items} item{items === 1 ? "" : "s"} · {paid ? "paid" : "unpaid"}
        </span>
      </div>
      <span className="label-caps text-muted">Courier</span>
      {COURIERS.map((c) => (
        <button key={c.key} onClick={() => setCourier(c.key)} className={clsx(
          "flex items-center gap-3 rounded-[10px] p-3 text-left",
          courier === c.key ? "border-2 border-brand bg-brand-soft" : "border border-line bg-surface hover:bg-subtle")}>
          <span className={clsx("flex size-4 items-center justify-center rounded-full border-2",
            courier === c.key ? "border-brand" : "border-line-strong")}>
            {courier === c.key && <span className="size-2 rounded-full bg-brand" />}
          </span>
          <BrandLogo brand={c.key} size={32} rounded="lg" />
          <span className="flex flex-1 flex-col">
            <span className="text-body font-semibold">{c.name}</span>
            <span className="text-caption text-muted">{c.sub}</span>
          </span>
          <span className="text-body font-semibold">{money(fees[c.zone] ?? 0)}</span>
        </button>
      ))}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-body font-semibold">Cash on delivery</span>
          <span className="text-caption text-muted">
            {cod ? `Courier collects ${money(order.total)}` : `Courier collects $0.00${paid ? " (already paid)" : ""}`}
          </span>
        </div>
        <Toggle checked={cod} onChange={setCod} tone="brand" label="Cash on delivery" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onPrint} icon={<FigmaIcon name="icon-printer-dark" size={18} />}>Print slip (QR)</Button>
        <span className="flex-1" />
        <Button onClick={() => onSend?.(courier, cod)} loading={sending}
          icon={<FigmaIcon name="icon-send-btn" size={18} />}>Send to {chosen.name.split(" ")[0]}</Button>
      </div>
    </div>
  );
}
