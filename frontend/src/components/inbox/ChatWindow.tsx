import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  Bot,
  Check,
  CornerDownLeft,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
  User,
  UserCheck,
  Wand2,
  X,
} from "lucide-react";
import {
  formatChatDateDivider,
  isSameDay,
  PLATFORM_NAME,
  toneFor,
} from "../../lib/format";
import type { ConversationDetail, QuickReply } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { Channel } from "../ui/Channel";
import { MessageBubble } from "./MessageBubble";

export interface ChatActions {
  takeOver: () => void;
  resumeAi: () => void;
  send: (text: string) => void;
  sendMedia?: (file: File) => void;
  orderProduct?: (productId: number) => void;
}

export interface ChatWindowProps {
  c: ConversationDetail;
  actions: ChatActions;
  quickReplies: QuickReply[];
  draft: string;
  onDraft: (v: string) => void;
  busy?: boolean;
  overlay?: ReactNode;
  onToggleCopilot?: () => void;
  copilotOpen?: boolean;
  onSuggest?: (instruction?: string) => void;
  suggestion?: string | null;
  suggesting?: boolean;
}

/**
 * MedTrackr-inspired Clean Live Chat Window
 * Contact Header, Clean Messages Canvas with Dynamic Date Dividers,
 * and Floating Composer with AI Prompts assistant, Quick Replies, and dark mode support.
 */
export function ChatWindow({
  c,
  actions,
  quickReplies,
  draft,
  onDraft,
  busy,
  overlay,
  onToggleCopilot,
  copilotOpen,
  onSuggest,
  suggestion,
  suggesting,
}: ChatWindowProps) {
  const manual = c.mode !== "ai";
  const scroller = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [c.id, c.messages.length]);

  // Find first unread message index
  const firstUnreadIndex = useMemo(() => {
    if (!c.unread_count || c.unread_count <= 0) return -1;
    const incomingMessages = c.messages.filter((m) => m.sender === "customer");
    const unreadCutoff = Math.max(0, incomingMessages.length - c.unread_count);
    const targetMsg = incomingMessages[unreadCutoff];
    return targetMsg ? c.messages.findIndex((m) => m.id === targetMsg.id) : -1;
  }, [c.messages, c.unread_count]);

  return (
    <section className="relative flex h-full w-full min-w-0 min-h-0 flex-1 flex-col bg-white dark:bg-[#090d16] overflow-hidden">
      {/* ── Contact Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            name={c.customer.name}
            tone={c.customer.is_vip ? "vip" : toneFor(c.customer.id)}
            size={40}
            platform={c.platform}
          />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                {c.customer.name}
              </span>
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700 dark:text-indigo-300 border border-blue-100/70 dark:border-indigo-500/30">
                {c.customer.is_vip ? "VIP Customer" : c.customer.orders_count > 0 ? `Orders: ${c.customer.orders_count}` : "Visit 1"}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-400 dark:text-slate-400 font-medium truncate">
              <span>Active on {PLATFORM_NAME[c.platform]}</span>
              {c.customer.phone && (
                <>
                  <span>·</span>
                  <span>{c.customer.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Action Controls */}
        <div className="flex items-center gap-2">
          {/* AI / Manual Mode Segmented Control (Desktop & Tablet) */}
          <div className="hidden sm:inline-flex items-center rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#080d19] p-0.5 shadow-2xs">
            {c.mode === "ai" ? (
              <>
                {/* Active AI Status Pill */}
                <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs ring-1 ring-slate-200/70 dark:ring-white/10">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <Bot size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>AI Active</span>
                </div>

                {/* Take over button */}
                <button
                  type="button"
                  onClick={actions.takeOver}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Pause AI and take over chat manually"
                >
                  <UserCheck size={12} className="text-slate-400" />
                  <span>Take over</span>
                </button>
              </>
            ) : (
              <>
                {/* Active Manual Status Pill */}
                <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 dark:text-amber-300 shadow-2xs ring-1 ring-slate-200/70 dark:ring-white/10">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <User size={13} className="text-amber-600 dark:text-amber-400" />
                  <span>Manual Mode</span>
                </div>

                {/* Resume AI button */}
                <button
                  type="button"
                  onClick={actions.resumeAi}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-[11.5px] font-bold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Resume AI Auto-Pilot for this conversation"
                >
                  <Sparkles size={12} className="text-emerald-100" />
                  <span>Resume AI</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile compact toggle button */}
          <div className="sm:hidden">
            {c.mode === "ai" ? (
              <button
                type="button"
                onClick={actions.takeOver}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
                title="Take over chat manually"
              >
                <UserCheck size={12} />
                <span>Take over</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={actions.resumeAi}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                title="Resume AI"
              >
                <Sparkles size={12} />
                <span>Resume</span>
              </button>
            )}
          </div>

          {/* Three dots button (Toggles AI Copilot Panel) */}
          <button
            onClick={onToggleCopilot}
            className={clsx(
              "flex size-9 items-center justify-center rounded-xl border transition cursor-pointer shadow-2xs",
              copilotOpen
                ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-indigo-500/50 dark:bg-indigo-950/60 dark:text-indigo-300"
                : "border-slate-200/80 bg-white text-slate-500 dark:border-white/10 dark:bg-[#080d19] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
            )}
            title={copilotOpen ? "Close AI Copilot & Orders" : "Open AI Copilot & Orders drawer"}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Mode Alert Bar (if customer is angry or needs staff urgently) */}
      {c.high_priority && manual && (
        <div className="flex items-center gap-2.5 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/40 px-6 py-2 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="flex-1">
            Priority Alert: Customer requested human staff. AI is paused while you assist.
          </p>
          <button
            onClick={actions.resumeAi}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition shadow-2xs cursor-pointer"
          >
            <Sparkles size={11} />
            <span>Resume AI</span>
          </button>
        </div>
      )}

      {/* ── Scrollable Messages Canvas with Dynamic Calendar Date Dividers ── */}
      <div
        ref={scroller}
        className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-4 space-y-3 scrollbar-thin bg-white dark:bg-[#090d16]"
      >
        {c.messages.map((m, idx) => {
          const prevMsg = idx > 0 ? c.messages[idx - 1] : null;
          const showDateDivider = !prevMsg || !isSameDay(prevMsg.created_at, m.created_at);
          const dateDividerText = showDateDivider ? formatChatDateDivider(m.created_at) : "";

          return (
            <div key={m.id} className="flex flex-col">
              {showDateDivider && dateDividerText && (
                <div className="flex justify-center my-3">
                  <span className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-[11px] font-medium px-3.5 py-1 rounded-full shadow-2xs tracking-wide">
                    {dateDividerText}
                  </span>
                </div>
              )}
              <MessageBubble
                m={m}
                customerName={c.customer.name}
                onOrderProduct={actions.orderProduct}
                isFirstUnread={idx === firstUnreadIndex}
              />
            </div>
          );
        })}
      </div>

      {/* ── Bottom Floating Composer ── */}
      <Composer
        c={c}
        actions={actions}
        quickReplies={quickReplies}
        draft={draft}
        onDraft={onDraft}
        onSuggest={onSuggest}
        suggestion={suggestion}
        suggesting={suggesting}
      />

      {overlay}
    </section>
  );
}

function Composer({
  c,
  actions,
  quickReplies,
  draft,
  onDraft,
  onSuggest,
  suggestion,
  suggesting,
}: {
  c: ConversationDetail;
  actions: ChatActions;
  quickReplies: QuickReply[];
  draft: string;
  onDraft: (v: string) => void;
  onSuggest?: (instruction?: string) => void;
  suggestion?: string | null;
  suggesting?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  const slash = draft.startsWith("/") && !draft.includes(" ");
  const matches = slash ? quickReplies : [];
  const best = useMemo(
    () => Math.max(0, quickReplies.findIndex((q) => q.command.startsWith(draft.toLowerCase()))),
    [draft, quickReplies]
  );
  const [picked, setActive] = useState<number | null>(null);
  const active = picked ?? best;

  const submit = () => {
    const text = slash && matches[active] ? matches[active].text : draft.trim();
    if (!text) return;
    actions.send(text);
    onDraft("");
    setShowQuickMenu(false);
    setShowAiMenu(false);
  };

  const handleApplyPreset = (instruction?: string) => {
    if (onSuggest) {
      onSuggest(instruction);
    }
  };

  return (
    <div className="shrink-0 bg-white dark:bg-[#0c1322] border-t border-slate-100 dark:border-white/[0.08] px-5 pb-4 pt-2">
      <div className="relative">
        {/* ── AI Write Prompts & Smart Reply Popover ── */}
        {showAiMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-[560px] rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-white dark:bg-[#111a2e] p-3 shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  <Wand2 size={14} />
                </span>
                <span className="text-[12.5px] font-bold text-slate-900 dark:text-white">
                  AI Write &amp; Reply Prompts
                </span>
                <span className="text-[10.5px] rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30">
                  Claude / Gemini
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAiMenu(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Prompt Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                disabled={suggesting}
                onClick={() => handleApplyPreset()}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#16223b] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span>Smart Auto-Reply</span>
              </button>
              <button
                type="button"
                disabled={suggesting}
                onClick={() => handleApplyPreset("Apologize politely for any delay, reassure that the order is prioritized, and confirm shipping status.")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#16223b] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <span>🙏 Apologize &amp; Reassure</span>
              </button>
              <button
                type="button"
                disabled={suggesting}
                onClick={() => handleApplyPreset("Offer a friendly 5% VIP discount code VIP5OFF and thank them for shopping with us.")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#16223b] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <span>🎁 Offer 5% VIP Voucher</span>
              </button>
              <button
                type="button"
                disabled={suggesting}
                onClick={() => handleApplyPreset("Explain delivery fee ($1.50 in Phnom Penh via Grab Express 1 hour, provinces 24-48 hours via VET Express) and ask for delivery location.")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#16223b] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <span>🚚 Delivery Timelines</span>
              </button>
              <button
                type="button"
                disabled={suggesting}
                onClick={() => handleApplyPreset("Provide ABA KHQR payment instructions and kindly ask for recipient name and phone number.")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#16223b] px-2.5 py-1 text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <span>💳 Request Payment &amp; Info</span>
              </button>
            </div>

            {/* Custom Prompt Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customPrompt.trim()) handleApplyPreset(customPrompt.trim());
              }}
              className="flex items-center gap-2 mb-3"
            >
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Give AI a custom prompt instruction (e.g. recommend acne cream in Khmer)..."
                className="flex-1 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#0c1322] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={suggesting || !customPrompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition active:scale-95 cursor-pointer"
              >
                {suggesting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Writing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </form>

            {/* AI Generated Suggestion Box */}
            {suggesting && !suggestion && (
              <div className="flex items-center justify-center gap-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30 p-4 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Analyzing conversation history &amp; crafting response...</span>
              </div>
            )}

            {suggestion && (
              <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 p-3 mb-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Drafted Suggestion
                  </span>
                  <span className="text-[10px] text-slate-400">Ready to edit or send</span>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap mb-2.5 bg-white/70 dark:bg-[#0c1322]/80 p-2.5 rounded-lg border border-indigo-100 dark:border-white/10">
                  {suggestion}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDraft(suggestion);
                      setShowAiMenu(false);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    {copiedDraft ? <Check size={13} className="text-emerald-500" /> : <CornerDownLeft size={13} />}
                    <span>Insert into message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      actions.send(suggestion);
                      setShowAiMenu(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3 py-1 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Send now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Replies Autocomplete Popover (when typing / or clicked +) ── */}
        {(showQuickMenu || (slash && matches.length > 0)) && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-[480px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111a2e] p-2 shadow-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Quick Reply Templates
              </span>
              <button
                type="button"
                onClick={() => setShowQuickMenu(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
              {quickReplies.map((q, i) => (
                <div
                  key={q.id}
                  onMouseEnter={() => setActive(i)}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-left transition group",
                    i === active
                      ? "bg-blue-50 dark:bg-indigo-950/60 text-blue-900 dark:text-indigo-200"
                      : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onDraft(q.text);
                      setShowQuickMenu(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 cursor-pointer text-left"
                    title="Click to insert into draft"
                  >
                    <span className="rounded-lg bg-blue-100/70 dark:bg-indigo-900/50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:text-indigo-300 flex-shrink-0">
                      {q.command}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-slate-600 dark:text-slate-300">
                      {q.text}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onDraft(q.text);
                        setShowQuickMenu(false);
                      }}
                      className="px-2 py-0.5 text-[10.5px] rounded-md font-semibold bg-slate-200/70 dark:bg-white/10 hover:bg-blue-600 hover:text-white dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      title="Insert into draft to review"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        actions.send(q.text);
                        onDraft("");
                        setShowQuickMenu(false);
                      }}
                      className="px-2 py-0.5 text-[10.5px] rounded-md font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white transition cursor-pointer"
                      title="Send immediately"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Floating Composer Card ── */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111a2e] p-2.5 sm:p-3 shadow-xs focus-within:border-blue-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-indigo-950/50 transition">
          {/* Hidden File Input */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*,audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) actions.sendMedia?.(f);
              e.target.value = "";
            }}
          />

          {/* Text Input / Textarea */}
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => {
              onDraft(e.target.value);
              setActive(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (slash && e.key === "ArrowDown") {
                e.preventDefault();
                setActive(Math.min(active + 1, matches.length - 1));
              }
              if (slash && e.key === "ArrowUp") {
                e.preventDefault();
                setActive(Math.max(active - 1, 0));
              }
            }}
            placeholder="Type a message..."
            className="w-full resize-none border-0 bg-transparent px-1 py-0.5 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[34px] max-h-[140px]"
          />

          {/* Bottom Toolbar inside the Composer card */}
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.08] pt-2">
            {/* Left action tools: AI Write, Templates (+), clip, smile, image */}
            <div className="flex items-center gap-1.5">
              {/* ✨ Prompts / AI Write Button */}
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(!showAiMenu);
                  setShowQuickMenu(false);
                }}
                className={clsx(
                  "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95",
                  showAiMenu
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-200"
                    : "border-indigo-200/90 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-blue-500/20 text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/20 hover:to-blue-500/20"
                )}
                title="AI Write, suggest replies, and prompt presets"
              >
                <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span>AI Write</span>
              </button>

              {/* Templates (+) */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickMenu(!showQuickMenu);
                  setShowAiMenu(false);
                }}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Quick replies and templates (+)"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Attach document or receipt"
              >
                <Paperclip size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onDraft(draft + " 😊 ");
                }}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Add emoji"
              >
                <Smile size={15} />
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Send photo"
              >
                <ImageIcon size={15} />
              </button>
            </div>

            {/* Right Action: Omnichannel Channel pill + Send Button */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10">
                <Channel platform={c.platform} size={13} />
                <span>{PLATFORM_NAME[c.platform]}</span>
              </span>

              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3.5 py-1.5 text-[12.5px] font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
