import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Megaphone,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { api } from "../../lib/api";
import { timeAgo } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type { Broadcast, Shop } from "../../lib/types";

export function OwnerBroadcast() {
  const { language } = useLanguage();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    message: "សួស្តី {name} 🙏 ខាងហាងយើងខ្ញុំមានការផ្តល់ជូនពិសេស ១៥% លើមុខទំនិញថ្មីៗ!",
    audience: "all",
    personalize: true,
  });
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const shop = shopQuery.data;

  const listQuery = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => api.get<Broadcast[]>("/broadcasts"),
    refetchInterval: 10_000,
  });
  const list = listQuery.data ?? [];

  const sizeQuery = useQuery({
    queryKey: ["audience", form.audience],
    queryFn: () => api.get<{ count: number }>(`/broadcasts/audience?audience=${form.audience}`),
  });
  const audienceCount = sizeQuery.data?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const b = await api.post<Broadcast>("/broadcasts", form);
      return api.post<Broadcast>(`/broadcasts/${b.id}/send`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["broadcasts"] });
      setSuccessNotice(`Broadcast campaign "${form.title}" initiated successfully!`);
      setForm({ ...form, title: "", message: "" });
      setTimeout(() => setSuccessNotice(null), 5000);
    },
  });

  const insertTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      message: prev.message + ` ${tag}`,
    }));
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === "km" ? "ការផ្សព្វផ្សាយទីផ្សារ AI" : "AI Marketing Broadcast"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "ផ្ញើសារប្រូម៉ូសិនទៅកាន់អតិថិជនចាស់ៗតាម Telegram និង Messenger ដោយមិនអស់ថ្លៃសេវា ជាមួយ AI"
              : "Zero-cost direct promotional messaging to past customers on Telegram and Messenger — personalized by AI."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
            <Sparkles size={14} className="text-emerald-600" />
            <span>AI Dynamic Personalization</span>
          </span>
        </div>
      </div>

      {/* Success banner */}
      {successNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ── 2 Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Campaign Composer & Mobile Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Campaign Form Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone size={16} className="text-indigo-600" />
              <span>Compose Campaign</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Khmer New Year 15% VIP Special"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Target Audience Segment</label>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200/60">
                  {audienceCount} eligible recipient(s)
                </span>
              </div>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Past Customers ({audienceCount})</option>
                <option value="buyers">Past Buyers Only (Completed at least 1 order)</option>
                <option value="vip">⭐ VIP High Spenders (Over shop threshold)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Message Content Template *</label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Insert tag:</span>
                  <button
                    type="button"
                    onClick={() => insertTag("{name}")}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    + {`{name}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag("{product}")}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    + {`{product}`}
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your broadcast message..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {`{name}`} is replaced with the customer's display name. {`{product}`} is replaced with their last purchased item.
              </p>
            </div>

            {/* AI Personalization Switch */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <input
                type="checkbox"
                id="personalize-toggle"
                checked={form.personalize}
                onChange={(e) => setForm({ ...form, personalize: e.target.checked })}
                className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="personalize-toggle" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Enable AI Individual Personalization</span>
                <span className="text-slate-500 block text-[11px] mt-0.5 leading-relaxed">
                  The AI model will tailor the opening tone and phrasing for each customer based on their past purchase history and conversation habits.
                </span>
              </label>
            </div>

            {/* Policy Notes */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <b>Channel Delivery Notice:</b> Telegram allows direct broadcasts without time limits. Facebook Messenger standard messaging window applies (within 24 hours of last customer contact unless utilizing approved Meta sponsored/utility tags).
              </div>
            </div>

            <button
              disabled={!form.title.trim() || !form.message.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
            >
              <Send size={15} />
              <span>
                {createMutation.isPending
                  ? "Transmitting Broadcast..."
                  : `Launch Campaign to ${audienceCount} Customer(s) · $0 Free`}
              </span>
            </button>

            {createMutation.error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {createMutation.error.message}
              </p>
            )}
          </div>

          {/* Smartphone Chat Preview Mockup */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-slate-800">
              <Smartphone size={15} className="text-indigo-600" />
              <span>Live Recipient Chat Preview (Telegram & Messenger)</span>
            </div>

            <div className="mt-4 mx-auto max-w-sm rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-inner">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200 text-xs">
                <div className="size-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {shop?.name?.slice(0, 1) || "S"}
                </div>
                <div>
                  <p className="font-bold text-[11px] text-slate-900 leading-tight">{shop?.name || "Your Shop"}</p>
                  <p className="text-[9px] text-slate-400">Official Store Bot</p>
                </div>
              </div>

              {/* Chat Bubble */}
              <div className="rounded-2xl rounded-tl-xs bg-white p-3 shadow-xs border border-slate-200/60 space-y-1">
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {form.message
                    .replace(/\{name\}/g, "Sokha")
                    .replace(/\{product\}/g, "Gentle Foam Cleanser")}
                </p>
                <div className="flex justify-end pt-1">
                  <span className="text-[9px] text-slate-400">Just now · Sent via AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Campaign History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Campaign History</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {list.length} campaigns
              </span>
            </div>

            {list.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No campaigns launched yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Compose your first message on the left to send promotional announcements.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[680px] overflow-y-auto scrollbar-thin">
                {list.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2 hover:bg-slate-100/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{b.title}</h3>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 uppercase",
                          b.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {b.status === "sent" ? `Delivered: ${b.sent_count}` : b.status}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">
                      {b.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10.5px] text-slate-400">
                      <span className="capitalize">Audience: <b>{b.audience}</b></span>
                      <span>{timeAgo(b.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
