import { useState } from "react";
import clsx from "clsx";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { timeAgo, toneFor } from "../../lib/format";
import type { ConversationSummary, InboxList as InboxData } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { ConversationTags } from "./tags";

export type InboxTab = "all" | "staff" | "ai" | "vip";

/**
 * MedTrackr-inspired Clean Messages Column
 * Large header, modern search + filter button, segmented control switcher, and clean contact cards.
 */
export function InboxList({
  data,
  tab,
  onTab,
  query,
  onQuery,
  selectedId,
  onSelect,
  meId,
}: {
  data: InboxData | undefined;
  tab: InboxTab;
  onTab: (t: InboxTab) => void;
  query: string;
  onQuery: (q: string) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  online: boolean;
  meId?: number;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const counts = data?.counts;

  return (
    <section className="flex h-full w-[340px] md:w-[360px] shrink-0 min-h-0 flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] overflow-hidden">
      {/* Messages Header */}
      <header className="flex shrink-0 flex-col gap-3 p-4 pb-2.5">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Messages
          </h1>
          {counts?.staff && counts.staff > 0 ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200/60">
              {counts.staff} urgent
            </span>
          ) : null}
        </div>

        {/* Search Bar + Filter Button */}
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#080d19] px-3.5 py-2 text-slate-400 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#080d19] focus-within:ring-1 focus-within:ring-blue-500 transition shadow-2xs">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search chats, customer..."
              className="w-full bg-transparent text-[13px] text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </label>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex size-9 items-center justify-center rounded-xl border transition shadow-2xs cursor-pointer",
              showFilters
                ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300"
                : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#080d19] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
            )}
            title="Filter options"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Sub-filters popup when filter icon clicked */}
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200/70 dark:border-white/10 text-xs animate-in fade-in duration-100">
            <button
              onClick={() => onTab("staff")}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition cursor-pointer",
                tab === "staff"
                  ? "bg-rose-500 text-white"
                  : "bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10"
              )}
            >
              Needs Staff {counts?.staff ? `(${counts.staff})` : ""}
            </button>
            <button
              onClick={() => onTab("vip")}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition cursor-pointer",
                tab === "vip"
                  ? "bg-amber-500 text-white"
                  : "bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10"
              )}
            >
              VIP Clients
            </button>
            <button
              onClick={() => onTab("ai")}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition cursor-pointer",
                tab === "ai"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10"
              )}
            >
              AI Auto-Pilot
            </button>
          </div>
        )}

        {/* Segmented Control Switcher (Active / Inactive) */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-[#16223b] dark:border dark:border-white/[0.08] p-1 text-[13px] font-semibold text-slate-500 dark:text-slate-400 select-none">
          <button
            onClick={() => onTab("staff")}
            className={clsx(
              "flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer",
              tab === "staff"
                ? "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-800 dark:text-white"
                : "hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Active
          </button>
          <button
            onClick={() => onTab("all")}
            className={clsx(
              "flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer",
              tab === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-800 dark:text-white"
                : "hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Inactive
          </button>
        </div>
      </header>

      {/* Conversation List */}
      <ul className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
        {data?.items.map((c) => (
          <ConversationRow
            key={c.id}
            c={c}
            selected={c.id === selectedId}
            onClick={() => onSelect(c.id)}
            meId={meId}
          />
        ))}

        {data && data.items.length === 0 && (
          <li className="flex flex-col items-center justify-center p-10 text-center text-slate-400 dark:text-slate-500">
            <Sparkles size={24} className="mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">No messages found</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Try searching with a different keyword</p>
          </li>
        )}
      </ul>
    </section>
  );
}

function ConversationRow({
  c,
  selected,
  onClick,
  meId,
}: {
  c: ConversationSummary;
  selected: boolean;
  onClick: () => void;
  meId?: number;
}) {
  const isTypingOrWaiting = c.mode === "waiting_staff";

  return (
    <li>
      <button
        onClick={onClick}
        className={clsx(
          "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all cursor-pointer",
          selected
            ? "bg-slate-100/90 text-slate-900 shadow-2xs dark:bg-indigo-950/60 dark:text-white dark:border dark:border-indigo-500/30"
            : "hover:bg-slate-50/90 text-slate-600 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
        )}
      >
        {/* Circular Avatar with Platform Badge */}
        <div className="relative flex-shrink-0">
          <Avatar
            name={c.customer.name}
            tone={c.customer.is_vip ? "vip" : toneFor(c.customer.id)}
            size={42}
            platform={c.platform}
          />
        </div>

        {/* Message Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="truncate text-[13.5px] font-bold text-slate-900 dark:text-white tracking-tight">
              {c.customer.name}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 flex-shrink-0 ml-1.5">
              {timeAgo(c.last_message_at)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {isTypingOrWaiting ? (
              <span className="truncate text-[12px] font-medium text-blue-600 dark:text-indigo-400 italic">
                typing...
              </span>
            ) : (
              <span className="truncate text-[12px] text-slate-500 dark:text-slate-400 font-normal">
                {c.last_message_preview || "No message content"}
              </span>
            )}

            {/* Blue dot indicator for unread messages (MedTrackr style) */}
            {c.unread_count > 0 && (
              <span className="size-2 flex-shrink-0 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>

          {/* Optional VIP or Tags */}
          {c.customer.is_vip && (
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200/50 dark:border-amber-500/30">
                VIP
              </span>
              <ConversationTags c={c} meId={meId} />
            </div>
          )}
        </div>
      </button>
    </li>
  );
}
