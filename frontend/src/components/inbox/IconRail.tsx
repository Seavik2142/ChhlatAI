import clsx from "clsx";
import { Avatar } from "../ui/Avatar";
import { FigmaIcon } from "../ui/Icon";
import { RailItem } from "../ui/NavItem";

export type RailKey = "chat" | "products" | "orders" | "profile" | "help";

const ITEMS: { key: RailKey; icon: string; label: string }[] = [
  { key: "chat", icon: "rail-chat", label: "Live chat" },
  { key: "products", icon: "rail-products", label: "Products" },
  { key: "orders", icon: "rail-orders", label: "My orders" },
  { key: "profile", icon: "rail-profile", label: "Profile" },
];

/** Staff Panel icon rail (Figma "Icon rail", 80px). */
export function IconRail({ active, chatCount, userName, online, onNavigate }: {
  active: RailKey; chatCount?: number; userName: string; online: boolean; onNavigate?: (k: RailKey) => void;
}) {
  return (
    <nav className="flex h-full w-20 shrink-0 flex-col items-center gap-1.5 border-r border-line bg-surface px-2.5 py-4">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-white">
        <FigmaIcon name="rail-zap" size={20} />
      </span>
      <span className="my-px h-px w-10 bg-line" />
      {ITEMS.map((i) => (
        <RailItem key={i.key} active={active === i.key} icon={i.icon} label={i.label}
          count={i.key === "chat" ? chatCount : undefined} onClick={() => onNavigate?.(i.key)} />
      ))}
      <span className="flex-1" />
      <RailItem active={active === "help"} icon="rail-help" label="Help" onClick={() => onNavigate?.("help")} />
      <span className="my-px h-px w-10 bg-line" />
      <span className="relative size-9">
        <Avatar name={userName} solid size={36} />
        <span className={clsx("absolute left-[27px] top-[27px] size-2.5 rounded-full border-2 border-surface",
          online ? "bg-success" : "bg-muted")} />
      </span>
      <span className={clsx("text-[11px] font-medium leading-[18px]", online ? "text-success" : "text-muted")}>
        {online ? "Online" : "Away"}
      </span>
    </nav>
  );
}
