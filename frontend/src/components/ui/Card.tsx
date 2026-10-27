import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({ children, className, elevated }: { children: ReactNode; className?: string; elevated?: boolean }) {
  return (
    <div className={clsx("rounded-lg border border-line bg-surface", elevated && "shadow-card", className)}>{children}</div>
  );
}

/** Figma component "StatCard". */
export function StatCard({ label, value, icon, delta, note = "vs last month" }: {
  label: string; value: ReactNode; icon?: ReactNode; delta?: number; note?: string;
}) {
  return (
    <Card elevated className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-body text-ink-2">{label}</span>
        {icon && <span className="flex size-8 items-center justify-center rounded-md bg-brand-soft text-brand">{icon}</span>}
      </div>
      <span className="text-[28px] font-bold leading-9 text-ink">{value}</span>
      {delta !== undefined && (
        <span className="flex items-center gap-1.5 text-caption">
          <span className={clsx("font-semibold", delta >= 0 ? "text-success" : "text-danger")}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
          <span className="text-muted">{note}</span>
        </span>
      )}
    </Card>
  );
}

export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label-caps text-[11px] tracking-[0.66px] text-muted">{children}</span>
      <span className="flex-1" />
      {right}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="flex-1">
        <h1 className="text-[24px] font-bold leading-8 text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-ink-2">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line p-8 text-center text-body text-muted">{children}</div>;
}

export function Modal({ open, onClose, title, children, width = 480 }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full overflow-auto rounded-lg bg-surface p-6 shadow-float" style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center">
          <h2 className="flex-1 text-h2 font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md px-2 text-h2 text-muted hover:bg-subtle" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
