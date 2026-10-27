import type { CSSProperties } from "react";
import { Button } from "../ui/Button";
import { FigmaIcon } from "../ui/Icon";

/** Figma "Toast · High priority alert". */
export function PriorityToast({ title, body, onReply, onDismiss, style }: {
  title: string; body: string; onReply?: () => void; onDismiss?: () => void; style?: CSSProperties;
}) {
  return (
    <div style={style} className="absolute right-4 top-[68px] z-10 flex items-center gap-3 rounded-[14px] border-[1.5px] border-danger bg-surface px-4 py-3 shadow-card">
      <span className="rounded-full bg-danger-soft p-2 text-danger"><FigmaIcon name="icon-bell-danger" size={18} /></span>
      <div className="flex flex-col">
        <span className="text-body font-semibold text-danger">{title}</span>
        <span className="text-caption text-ink-2">{body}</span>
      </div>
      <Button variant="danger" onClick={onReply}>Reply now</Button>
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss" className="px-1 text-muted hover:text-ink">×</button>}
    </div>
  );
}
