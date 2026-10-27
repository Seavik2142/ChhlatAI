import clsx from "clsx";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { FigmaIcon } from "./Icon";

/** Figma component "Sidebar/Nav item" (State=Default|Active), dark sidebar variant. */
export function NavItem({ to, icon, children, end, badge }: {
  to: string; icon: ReactNode; children: ReactNode; end?: boolean; badge?: number;
}) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => clsx(
      "flex min-h-9 items-center gap-3 rounded-md px-3 py-1.5 text-body leading-5 transition-colors",
      isActive ? "bg-sidebar-active font-semibold text-white" : "font-medium text-sidebar-text hover:bg-sidebar-active/60")}>
      <span className="flex size-5 items-center justify-center">{icon}</span>
      <span className="flex-1">{children}</span>
      {!!badge && <span className="rounded-full bg-danger px-1.5 text-micro font-medium text-white">{badge}</span>}
    </NavLink>
  );
}

/** Figma component "Sidebar/Rail item" (State=Default|Active) used by the Staff Panel icon rail. */
export function RailItem({ active, icon, label, count, onClick }: {
  active?: boolean; icon: string; label: string; count?: number; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={clsx(
      "relative flex h-14 w-15 flex-col items-center gap-1 rounded-md px-0.5 pb-1.5 pt-2",
      active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-subtle")}>
      <FigmaIcon name={icon} size={22} />
      <span className="whitespace-nowrap text-[11px] font-medium leading-[14px]">{label}</span>
      {!!count && (
        <span className="absolute left-[34px] top-[3px] min-w-[18px] rounded-full border-2 border-surface bg-danger px-[5px] text-[11px] font-medium leading-4 text-white">
          {count}
        </span>
      )}
    </button>
  );
}

