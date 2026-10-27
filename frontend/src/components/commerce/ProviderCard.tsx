import clsx from "clsx";
import type { ReactNode } from "react";
import type { PaymentProvider } from "../../lib/types";
import { BrandLogo } from "../ui/BrandLogo";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FigmaIcon } from "../ui/Icon";
import { Toggle } from "../ui/Toggle";

const META = {
  bakong: { name: "Bakong KHQR", sub: "National Bank of Cambodia · pay from any bank app",
            account: "Bakong account ID", secret: "API token" },
  aba_payway: { name: "ABA PayWay", sub: "ABA Bank payment gateway",
                account: "Merchant ID", secret: "API key" },
  acleda: { name: "ACLEDA Toan Chet Pay", sub: "ACLEDA Bank e-commerce gateway (XPAY)",
            account: "Merchant ID", secret: "Secret key" },
} as const;

/** Figma "Provider · …" card from Settings → Payments (1x of the spotlight's 0.5 scale). */
export function ProviderCard({ p, onManage, onToggleInvoices }: {
  p: PaymentProvider; onManage?: () => void; onToggleInvoices?: (v: boolean) => void;
}) {
  const m = META[p.provider];
  const days = p.token_expires_at ? Math.ceil((new Date(p.token_expires_at).getTime() - Date.now()) / 86_400_000) : null;
  return (
    <div className="flex h-full flex-col gap-4 rounded-[14px] border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3">
        <BrandLogo brand={p.provider} size={44} rounded="xl" />
        <span className="flex-1" />
        {p.is_connected ? <Badge tone="success" dot>Connected</Badge> : <Badge dot>Not connected</Badge>}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-h3 font-semibold">{m.name}</span>
        <span className="text-caption text-muted">{m.sub}</span>
      </div>
      <span className="h-px bg-line" />
      <Row label="Environment">
        {p.is_connected ? (
          <Badge tone={p.environment === "production" ? "success" : "warning"}>
            {p.environment === "production" ? "Production" : "Sandbox"}
          </Badge>
        ) : <Badge>—</Badge>}
      </Row>
      <Row label={m.account}>{p.account_id ?? "—"}</Row>
      {p.provider === "bakong" && <Row label="Merchant name">{p.merchant_name ?? "—"}</Row>}
      <Row label={m.secret}>{p.secret_masked}</Row>
      <div className="flex flex-wrap gap-1.5">
        {p.methods.map((x) => (
          <span key={x} className="rounded-full border border-line bg-subtle px-2 py-0.5 text-caption font-medium text-ink-2">{x}</span>
        ))}
      </div>
      {p.provider === "bakong" && p.is_connected && days !== null && (
        <Note tone="warning" icon="pp-icon-alert">Token expires in {days} days</Note>
      )}
      {p.provider === "aba_payway" && p.is_connected && p.environment !== "production" && (
        <Note tone="info" icon="pp-icon-info">Request production keys to go live</Note>
      )}
      {!p.is_connected && (
        <Note tone="neutral" icon="pp-icon-info-muted">Needs merchant ID and secret key from the bank</Note>
      )}
      <span className="flex-1" />
      <div className="flex items-center gap-2">
        {p.is_connected && (
          <>
            <Toggle checked={p.use_for_invoices} onChange={onToggleInvoices} label="Use for AI invoices" />
            <span className="text-caption font-medium text-ink-2">Use for AI invoices</span>
          </>
        )}
        <span className="flex-1" />
        {p.is_connected ? (
          <Button variant="secondary" onClick={onManage} icon={<FigmaIcon name="pp-icon-settings" size={18} />}>Manage</Button>
        ) : (
          <Button onClick={onManage} icon={<FigmaIcon name="pp-icon-plug" size={18} />}>Connect {m.name}</Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-body text-ink-2">{label}</span>
      <span className="text-body font-medium text-ink">{children}</span>
    </div>
  );
}

function Note({ tone, icon, children }: { tone: "warning" | "info" | "neutral"; icon: string; children: ReactNode }) {
  return (
    <div className={clsx("flex items-center gap-2 rounded-[10px] px-2.5 py-2",
      { warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", neutral: "bg-subtle text-ink-2" }[tone])}>
      <FigmaIcon name={icon} size={16} />
      <span className="flex-1 text-caption font-medium">{children}</span>
    </div>
  );
}

/** Figma "Paid toast". */
export function PaidToast({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-4 py-3 shadow-float">
      <span className="rounded-full bg-success-soft p-2"><FigmaIcon name="icon-check-circle" size={18} original /></span>
      <span className="flex flex-col">
        <span className="text-body font-semibold">{title}</span>
        <span className="text-caption text-muted">{body}</span>
      </span>
    </div>
  );
}

