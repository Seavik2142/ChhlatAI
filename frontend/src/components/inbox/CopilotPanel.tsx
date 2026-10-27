import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2, Sparkles, Wand2, X } from "lucide-react";
import { clock, money, ORDER_STATUS, PLATFORM_NAME, shortDate, toneFor } from "../../lib/format";
import type { ConversationDetail, Order, QuickReply } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SectionHeader } from "../ui/Card";
import { FigmaIcon } from "../ui/Icon";

export interface CopilotActions {
  confirm?: (o: Order) => void;
  edit?: (o: Order) => void;
  review?: (o: Order, approve: boolean) => void;
  simulateBank?: (o: Order) => void;
  sendToDelivery?: (o: Order) => void;
  shareTracking?: (o: Order) => void;
  suggest?: (instruction?: string) => void;
  insert?: (text: string) => void;
  quickReply?: (q: QuickReply) => void;
}

const ZONE: Record<string, string> = { phnom_penh: "Phnom Penh", province: "Province", grab: "Grab · 1 hour" };

export function CopilotPanel({
  c,
  quickReplies,
  actions,
  suggestion,
  suggesting,
  onClose,
}: {
  c: ConversationDetail;
  quickReplies: QuickReply[];
  actions: CopilotActions;
  suggestion?: string | null;
  suggesting?: boolean;
  onClose?: () => void;
}) {
  const [customPrompt, setCustomPrompt] = useState("");
  const order = c.orders[0];
  const facts = Object.entries(c.ai_analysis.facts ?? {});

  const handleSuggest = (instruction?: string) => {
    actions.suggest?.(instruction);
  };

  return (
    <aside className="scrollbar-thin flex h-full w-[360px] shrink-0 flex-col overflow-y-auto border-l border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] transition-colors">
      <header className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.08] px-5 py-4">
        <FigmaIcon name="icon-sparkles-brand" size={18} className="text-blue-600 dark:text-indigo-400" />
        <span className="text-h3 font-semibold text-slate-900 dark:text-white">AI Copilot</span>
        <span className="flex-1" />
        <Badge tone="brand" dot>Live</Badge>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition cursor-pointer ml-1"
            title="Close Copilot Panel"
          >
            <X size={16} />
          </button>
        )}
      </header>

      {/* Suggested Reply / AI Write Section */}
      <Section
        title="Suggested reply"
        right={
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-500/30">
            <Sparkles size={11} />
            <span>AI Draft</span>
          </span>
        }
      >
        {suggestion ? (
          <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/50 p-3 text-body text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
            {suggestion}
          </div>
        ) : (
          <p className="text-caption text-muted dark:text-slate-400">
            Use AI to draft an instant contextual response in the customer's language.
          </p>
        )}

        {/* Quick Prompt Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            disabled={suggesting}
            onClick={() => handleSuggest()}
            className="px-2 py-0.5 text-[11px] rounded-lg font-medium border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#16223b] text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
          >
            🪄 Smart Reply
          </button>
          <button
            type="button"
            disabled={suggesting}
            onClick={() => handleSuggest("Apologize politely, reassure customer and offer immediate priority dispatch.")}
            className="px-2 py-0.5 text-[11px] rounded-lg font-medium border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#16223b] text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
          >
            🙏 Apologize
          </button>
          <button
            type="button"
            disabled={suggesting}
            onClick={() => handleSuggest("Offer 5% VIP voucher VIP5OFF with a warm greeting.")}
            className="px-2 py-0.5 text-[11px] rounded-lg font-medium border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#16223b] text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
          >
            🎁 5% Voucher
          </button>
        </div>

        {/* Custom instruction prompt input */}
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Custom prompt instruction..."
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#16223b] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {suggestion && (
            <button
              type="button"
              onClick={() => actions.insert?.(suggestion)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs"
            >
              <span>Insert to message</span>
            </button>
          )}

          <button
            type="button"
            disabled={suggesting}
            onClick={() => handleSuggest(customPrompt.trim() || undefined)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs py-2 px-3 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {suggesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>{suggestion ? "Rewrite with AI" : "Suggest reply"}</span>
              </>
            )}
          </button>
        </div>
      </Section>

      {/* Customer Info Section */}
      <Section title="Customer">
        <div className="flex items-center gap-3">
          <Avatar name={c.customer.name} tone={c.customer.is_vip ? "vip" : toneFor(c.customer.id)} size={44} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body font-semibold text-slate-900 dark:text-white">{c.customer.name}</span>
            <span className="text-caption text-muted dark:text-slate-400">
              {c.customer.orders_count === 0
                ? `First chat · ${PLATFORM_NAME[c.platform]}`
                : `Customer since ${new Date(c.customer.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
            </span>
          </div>
          {c.customer.is_vip ? <Badge tone="vip">⭐ VIP</Badge> : c.customer.orders_count === 0 && <Badge>New lead</Badge>}
        </div>
        <KV label="Orders" value={c.customer.orders_count} />
        {c.customer.orders_count > 0 && <KV label="Total spent" value={money(c.customer.total_spent)} />}
        {c.customer.orders_count > 0 && <KV label="Loyalty points" value={`${c.customer.loyalty_points} pts`} />}
        {c.customer.phone && <KV label="Phone" value={c.customer.phone} />}
        {c.customer.is_vip && (
          <Note tone="vip" icon="icon-star-vip">VIP customer — be extra kind and offer the 5% VIP voucher.</Note>
        )}
      </Section>

      {/* AI Analysis Section */}
      {(facts.length > 0 || c.recommended_products.length > 0) && (
        <Section title="AI analysis" right={<Badge tone="info">Estimate</Badge>}>
          {facts.map(([k, v]) => <KV key={k} label={k} value={v} />)}
          {c.ai_analysis.confidence !== undefined && (
            <div className="flex flex-col gap-1.5">
              <div className="flex">
                <span className="flex-1 text-body text-ink-2 dark:text-slate-400">Confidence</span>
                <span className="text-body font-semibold text-success dark:text-emerald-400">{Math.round(c.ai_analysis.confidence * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-subtle dark:bg-slate-800">
                <div className="h-2 rounded-full bg-success dark:bg-emerald-500" style={{ width: `${c.ai_analysis.confidence * 100}%` }} />
              </div>
            </div>
          )}
          {c.recommended_products.length > 0 && (
            <>
              <span className="text-caption font-medium text-muted dark:text-slate-400">Already recommended</span>
              {c.recommended_products.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-ink-2 dark:text-slate-300">
                  <FigmaIcon name="icon-check-sm" size={16} className="text-success dark:text-emerald-400" />
                  <span className="text-body">{p.name}</span>
                </div>
              ))}
            </>
          )}
          <Note tone="warning" icon="icon-alert-warning-sm">AI estimate only — not a medical diagnosis.</Note>
        </Section>
      )}

      {order && <OrderSection order={order} actions={actions} />}

      {/* Quick Replies Section */}
      {quickReplies.length > 0 && (
        <Section title="Quick replies">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((q) => (
              <button
                key={q.id}
                onClick={() => actions.quickReply?.(q)}
                title={q.text}
                className="rounded-full bg-brand-soft dark:bg-indigo-950/60 px-2.5 py-1 text-caption font-medium text-brand dark:text-indigo-300 hover:bg-brand/15 dark:hover:bg-indigo-900/60 transition cursor-pointer"
              >
                {q.command}
              </button>
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}

function OrderSection({ order, actions }: { order: Order; actions: CopilotActions }) {
  const status = ORDER_STATUS[order.status];
  const shipped = order.status === "shipped" || order.status === "delivered";
  const title = `${order.created_by_ai && !shipped ? "Auto-order" : "Order"} · ${order.invoice_no}`;
  if (shipped) {
    return (
      <Section title={title} right={<Badge tone="success" dot>Paid ✓</Badge>}>
        <KV label="Paid" value={`${order.paid_at ? shortDate(order.paid_at) : "—"} · ${money(order.total)}`} medium />
        {order.bank_ref && <KV label={`${providerShort(order.payment_provider)} ref`} value={order.bank_ref} medium />}
        <Step tone="success" title="Paid & verified" sub={order.paid_at ? `${shortDate(order.paid_at)} · ${clock(order.paid_at)}` : ""} />
        {order.delivery && (
          <Step
            tone={order.delivery.status === "pickup_missed" ? "warning" : "brand"}
            title={`Sent to ${courierName(order.delivery.courier)}`}
            sub={order.delivery.status === "pickup_missed" ? "Pickup missed" : `${order.delivery.tracking_no} · ${shortDate(order.delivery.created_at)}`}
          />
        )}
        {order.delivery && actions.shareTracking && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => actions.shareTracking?.(order)}
            icon={<FigmaIcon name="icon-link" size={18} />}
          >
            Share tracking link
          </Button>
        )}
      </Section>
    );
  }
  const slip = order.slips[order.slips.length - 1];
  const paid = order.status === "paid" || order.status === "confirmed";
  return (
    <Section title={title} right={<Badge tone={status.tone} dot>{status.label}</Badge>}>
      {order.items.map((i) => (
        <KV key={i.id} label={`${i.name} × ${i.quantity}`} value={money(i.unit_price * i.quantity)} medium />
      ))}
      <KV
        label={`Delivery · ${order.delivery_address?.split(",")[0] || ZONE[order.delivery_zone ?? ""] || "—"}`}
        value={money(order.delivery_fee)}
        medium
      />
      <div className="flex items-center">
        <span className="flex-1 text-body text-ink-2 dark:text-slate-400">Total</span>
        <span className="text-h3 font-semibold text-slate-900 dark:text-white">{money(order.total)}</span>
      </div>
      {(slip || paid) && (
        <div className="flex flex-col gap-1.5">
          {slip && (
            <Check ok={!!slip.checks.amount_matches}>
              {slip.checks.amount_matches
                ? `Amount matches ${money(order.total)}`
                : `Amount ${slip.amount !== null ? money(slip.amount) : "unreadable"} ≠ ${money(order.total)}`}
            </Check>
          )}
          {slip && <Check ok={!!slip.checks.receiver_matches}>Receiver: {slip.receiver ?? "unreadable"}</Check>}
          <Check ok={paid}>Bank confirmation ({providerName(order.payment_provider)})</Check>
        </div>
      )}
      {order.status === "needs_review" ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => actions.review?.(order, false)}>Reject</Button>
          <Button variant="success" className="flex-1" onClick={() => actions.review?.(order, true)}>Approve payment</Button>
        </div>
      ) : order.status === "confirmed" ? (
        <Button
          className="w-full"
          onClick={() => actions.sendToDelivery?.(order)}
          icon={<FigmaIcon name="icon-send-btn" size={18} />}
        >
          Send to delivery
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => actions.edit?.(order)} disabled={paid}>Edit</Button>
          <Button
            variant="success"
            className="flex-1"
            disabled={order.status !== "paid"}
            onClick={() => actions.confirm?.(order)}
            icon={<FigmaIcon name="icon-printer" size={18} />}
          >
            Confirm &amp; Print
          </Button>
        </div>
      )}
      {["paid", "confirmed", "shipped", "delivered"].includes(order.status) && (
        <a
          href={order.invoice_url || `/api/v1/orders/${order.id}/invoice-image`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-2xs"
        >
          🧾 View Paid Invoice Image
        </a>
      )}
      <p className="text-caption text-muted dark:text-slate-400">
        {order.status === "needs_review"
          ? "Low confidence / mismatch — check the slip, then approve or reject"
          : order.status === "paid"
          ? "Bank confirmed · print the invoice and pack the order"
          : order.status === "confirmed"
          ? "Stock deducted · choose a courier"
          : "Enabled after the bank confirms the transaction"}
      </p>
      {order.status === "checking_slip" && actions.simulateBank && (
        <button
          onClick={() => actions.simulateBank?.(order)}
          className="self-start text-caption font-medium text-brand dark:text-indigo-400 underline cursor-pointer"
        >
          Sandbox: simulate bank confirmation
        </button>
      )}
    </Section>
  );
}

const providerName = (p: string | null) =>
  ({ aba_payway: "ABA PayWay", bakong: "Bakong", acleda: "ACLEDA" })[p ?? ""] ?? "bank";
const providerShort = (p: string | null) =>
  ({ aba_payway: "ABA", bakong: "Bakong", acleda: "ACLEDA" })[p ?? ""] ?? "Bank";
const courierName = (c: string) => ({ jnt: "J&T", vet: "Virak Buntham", grab: "Grab Express" })[c] ?? c;

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line dark:border-white/[0.08] px-5 py-4">
      <SectionHeader right={right}>{title}</SectionHeader>
      {children}
    </section>
  );
}

function KV({ label, value, medium }: { label: string; value: ReactNode; medium?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-body text-ink-2 dark:text-slate-400">{label}</span>
      <span className={clsx("text-body text-ink dark:text-slate-100", medium ? "font-medium" : "font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={clsx("flex items-center gap-2", ok ? "text-success dark:text-emerald-400" : "text-warning dark:text-amber-400")}>
      <FigmaIcon name={ok ? "icon-check-sm" : "icon-alert-warning-check"} size={16} />
      <span className={clsx("text-caption font-medium", ok ? "text-ink-2 dark:text-slate-300" : "text-warning dark:text-amber-300")}>
        {children}
      </span>
    </div>
  );
}

function Note({ tone, icon, children }: { tone: "vip" | "warning"; icon: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "flex items-start gap-2 rounded-[10px] px-2.5 py-2",
        tone === "vip"
          ? "bg-vip-soft dark:bg-yellow-950/40 text-vip dark:text-yellow-300 border border-yellow-200/40 dark:border-yellow-500/30"
          : "bg-warning-soft dark:bg-amber-950/40 text-warning dark:text-amber-300 border border-amber-200/40 dark:border-amber-500/30"
      )}
    >
      <FigmaIcon name={icon} size={16} className="mt-px" />
      <p className="flex-1 text-caption font-medium">{children}</p>
    </div>
  );
}

function Step({ tone, title, sub }: { tone: "success" | "warning" | "brand"; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={clsx(
          "size-2.5 rounded-full",
          {
            success: "bg-success dark:bg-emerald-400",
            warning: "bg-warning dark:bg-amber-400",
            brand: "bg-brand dark:bg-indigo-400",
          }[tone]
        )}
      />
      <div className="flex flex-col">
        <span className="text-body font-semibold text-slate-900 dark:text-white">{title}</span>
        {sub && <span className="text-caption text-muted dark:text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}
