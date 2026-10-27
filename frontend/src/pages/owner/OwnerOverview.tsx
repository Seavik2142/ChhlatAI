import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  DollarSign,
  Inbox,
  Package,
  Receipt,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { api } from "../../lib/api";
import { money, timeAgo } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type { Announcement, Order, Shop } from "../../lib/types";

interface Overview {
  revenue_this_month: number;
  paid_orders_this_month: number;
  pending_payments: number;
  needs_review: number;
  total_chats: number;
  waiting_staff: number;
  ai_reply_share: number;
  ai_replies_used: number;
  ai_replies_limit: number | null;
  sentiment: Record<"normal" | "interested" | "angry", number>;
  revenue_series: { date: string; revenue: number }[];
  top_products: { name: string; quantity: number }[];
  low_stock: { id: number; name: string; stock: number }[];
}

export function OwnerOverview() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const shop = shopQuery.data;

  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<Overview>("/shop/overview"),
    refetchInterval: 30_000,
  });
  const o = overviewQuery.data;

  const newsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<Announcement[]>("/announcements"),
  });
  const news = newsQuery.data;

  const recentOrdersQuery = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => api.get<Order[]>("/orders?limit=5"),
  });
  const recentOrders = recentOrdersQuery.data?.slice(0, 5) ?? [];

  const handleRefresh = () => {
    void overviewQuery.refetch();
    void recentOrdersQuery.refetch();
  };

  const repliesUsed = o?.ai_replies_used ?? shop?.ai_replies_used ?? 0;
  const repliesLimit = o?.ai_replies_limit ?? shop?.plan?.ai_replies_limit ?? 10000;
  const quotaPct = repliesLimit > 0 ? Math.min(100, Math.round((repliesUsed / repliesLimit) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Hero Greeting Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {shop?.name || "Merchant Dashboard"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {shop?.plan?.name || "PRO Plan"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "ទិដ្ឋភាពទូទៅនៃចំណូល ការបញ្ជាទិញ និងដំណើរការ AI Auto-Pilot ប្រចាំខែនេះ"
              : "Real-time revenue, order fulfillment, and AI Auto-Pilot performance this month."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw size={14} className={clsx(overviewQuery.isFetching && "animate-spin")} />
            <span>{language === "km" ? "ផ្ទុកឡើងវិញ" : "Refresh"}</span>
          </button>
          <Link
            to="/owner/inbox"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Inbox size={14} />
            <span>{language === "km" ? "បើកប្រអប់សារ" : "Open Inbox"}</span>
          </Link>
        </div>
      </div>

      {/* ── Active Announcement Alert Banner (if any) ── */}
      {news?.[0] && !announcementDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/25 bg-gradient-to-r from-indigo-50/90 via-slate-50/60 to-white dark:from-indigo-950/40 dark:via-[#111a2e] dark:to-[#111a2e] p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  {language === "km" ? "សេចក្តីប្រកាស" : "Official Update"}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{news[0].title}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">{news[0].body}</p>
            </div>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs px-2 py-1 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 4 Top-line KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue this month */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === "km" ? "ចំណូលខែនេះ (USD)" : "Revenue This Month"}
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {money(o?.revenue_this_month)}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 text-[11px]">
              <TrendingUp size={12} className="mr-0.5" />
              {o?.paid_orders_this_month ?? 0} orders
            </span>
            <span>paid transactions</span>
          </div>
        </div>

        {/* Card 2: Paid Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === "km" ? "ការបញ្ជាទិញបានទូទាត់" : "Paid Orders"}
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <Receipt size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {o?.paid_orders_this_month ?? 0}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>Awaiting check: <strong className="text-slate-800">{o?.pending_payments ?? 0}</strong></span>
            <Link to="/owner/orders" className="text-emerald-700 font-semibold hover:underline">
              View &rsaquo;
            </Link>
          </div>
        </div>

        {/* Card 3: AI Answer Rate */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === "km" ? "ឆ្លើយដោយស្វ័យប្រវត្តិ AI" : "AI Resolution Rate"}
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80">
              <Bot size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {o?.ai_reply_share ?? 0}%
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60 text-[11px]">
              Autonomous
            </span>
            <span>without human intervention</span>
          </div>
        </div>

        {/* Card 4: Total Conversations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === "km" ? "ការសន្ទនាសរុប" : "Total Conversations"}
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80">
              <Inbox size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {o?.total_chats ?? 0}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>Needs staff: <strong className="text-rose-600 font-semibold">{o?.waiting_staff ?? 0}</strong></span>
            <Link to="/owner/inbox" className="text-emerald-700 font-semibold hover:underline">
              Inbox &rsaquo;
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Section: 7-Day Revenue Trend (2/3) + Operational Attention (1/3) ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-Day Revenue Trend */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {language === "km" ? "ចំណូលរយៈពេល ៧ ថ្ងៃចុងក្រោយ" : "Revenue · Last 7 Days"}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  USD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "km"
                  ? "ចំណូលបានមកពីការបញ្ជាទិញដែលបានទូទាត់ និងផ្ទៀងផ្ទាត់រួចរាល់"
                  : "Daily paid order volume and merchant settlement totals."}
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs text-slate-500 font-medium">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Paid Orders Volume</span>
            </div>
          </div>

          <ModernRevenueBars series={o?.revenue_series ?? []} />
        </div>

        {/* Operational Attention Required Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {language === "km" ? "ការងារត្រូវយកចិត្តទុកដាក់" : "Needs Attention"}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">Live Status</span>
            </div>

            <div className="mt-4 space-y-2.5">
              <AttentionItem
                to="/owner/inbox"
                tone="danger"
                label={language === "km" ? "អតិថិជនរង់ចាំបុគ្គលិក" : "Waiting for staff"}
                value={o?.waiting_staff}
                subtitle="Customers escalated from AI"
              />
              <AttentionItem
                to="/owner/orders"
                tone="warning"
                label={language === "km" ? "វិក្កយបត្រត្រូវពិនិត្យស្លីប" : "Payments to review"}
                value={o?.needs_review}
                subtitle="ABA/Bakong slips uploaded"
              />
              <AttentionItem
                to="/owner/orders"
                tone="info"
                label={language === "km" ? "រង់ចាំការទូទាត់" : "Awaiting payment"}
                value={o?.pending_payments}
                subtitle="Unpaid customer invoices"
              />
            </div>

            {/* Sentiment Meter */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                {language === "km" ? "អារម្មណ៍អតិថិជនក្នុងឆាត" : "Chat Sentiment Distribution"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Normal {o?.sentiment?.normal ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Interested {o?.sentiment?.interested ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  Angry {o?.sentiment?.angry ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              to="/owner/orders"
              className="flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              <span>Manage all active orders &rsaquo;</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: AI Usage (1/3) + Top Products (1/3) + Low Stock (1/3) ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: AI Auto-Pilot Plan Usage */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === "km" ? "កូតាប្រើប្រាស់ AI Auto-Pilot" : "AI Quota & Usage"}
              </h3>
              <Link
                to="/owner/settings?tab=subscription"
                className="rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 uppercase hover:bg-purple-100 transition"
                title="Manage subscription plan"
              >
                {shop?.plan?.name || "PRO"} &rsaquo;
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {repliesUsed.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                of {repliesLimit?.toLocaleString() ?? "∞"} monthly AI replies used
              </p>

              {/* High-end progress bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    quotaPct > 85
                      ? "bg-gradient-to-r from-amber-500 to-rose-500"
                      : "bg-gradient-to-r from-teal-500 to-emerald-600"
                  )}
                  style={{ width: `${Math.min(100, quotaPct)}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{quotaPct}% capacity consumed</span>
                <span>{Math.max(0, repliesLimit - repliesUsed).toLocaleString()} remaining</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/owner/settings"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition"
            >
              Configure AI policies &rsaquo;
            </Link>
            <Link
              to="/owner/settings?tab=subscription"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition hover:scale-105"
            >
              <Sparkles size={11} />
              <span>{language === "km" ? "ដំឡើងកញ្ចប់" : "Upgrade Plan"}</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Top Performing Products */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {language === "km" ? "ផលិតផលលក់ដាច់បំផុត" : "Top Selling Products"}
              </h3>
              <Link to="/owner/products" className="text-xs font-semibold text-emerald-700 hover:underline">
                Catalog &rsaquo;
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(!o?.top_products || o.top_products.length === 0) && (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Package size={24} className="mx-auto mb-1 text-slate-300" />
                  No sales recorded yet this month.
                </div>
              )}

              {o?.top_products?.map((p, idx) => {
                const max = Math.max(1, ...o.top_products.map((x) => x.quantity));
                const pct = Math.round((p.quantity / max) * 100);
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className="flex size-4 items-center justify-center rounded-full bg-slate-100 text-[9.5px] font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 flex-shrink-0">{p.quantity} sold</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Based on confirmed & delivered orders</span>
          </div>
        </div>

        {/* Card 3: Inventory Stock Health */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === "km" ? "ការជូនដំណឹងទំនិញជិតអស់" : "Low Stock Alerts"}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {o?.low_stock?.length ?? 0} items
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {(!o?.low_stock || o.low_stock.length === 0) && (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" />
                  All products are well stocked above threshold.
                </div>
              )}

              {o?.low_stock?.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate("/owner/products")}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 hover:bg-slate-100/60 transition cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate pr-2">{p.name}</span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-bold flex-shrink-0",
                      p.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <Link
              to="/owner/products"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              Update inventory stock levels &rsaquo;
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Orders Table Preview ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === "km" ? "ការបញ្ជាទិញថ្មីៗ" : "Recent Orders & Transactions"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "km"
                ? "វិក្កយបត្រដែលបានបង្កើតដោយ AI ឬបុគ្គលិក"
                : "Real-time customer invoices and payment verification entries."}
            </p>
          </div>
          <Link
            to="/owner/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>{language === "km" ? "មើលទាំងអស់" : "View all orders"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders found for this shop yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Invoice</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {order.invoice_no}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{order.customer?.name || "Customer"}</div>
                      <div className="text-[10px] text-slate-400">{order.customer?.phone || "No phone"}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="line-clamp-1 max-w-[200px]">
                        {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {money(order.total)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                          order.status === "paid" || order.status === "confirmed" || order.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : order.status === "needs_review"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {timeAgo(order.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/owner/orders"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Inspect &rsaquo;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function AttentionItem({
  to,
  tone,
  label,
  value,
  subtitle,
}: {
  to: string;
  tone: "danger" | "warning" | "info";
  label: string;
  value?: number;
  subtitle: string;
}) {
  const count = value ?? 0;
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 hover:bg-slate-100/70 transition group"
    >
      <div>
        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
          {label}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      </div>

      <span
        className={clsx(
          "rounded-full px-2.5 py-0.5 text-xs font-bold",
          count > 0
            ? tone === "danger"
              ? "bg-rose-500 text-white shadow-xs"
              : tone === "warning"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-sky-500 text-white shadow-xs"
            : "bg-slate-200 text-slate-600"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

/** Modern SVG / HTML 7-day revenue bar chart with interactive tooltips */
function ModernRevenueBars({ series }: { series: { date: string; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(10, ...series.map((s) => s.revenue));
  const step = Math.pow(10, Math.floor(Math.log10(peak)));
  const max = Math.ceil(peak / step) * step;
  const H = 200;

  return (
    <div className="relative pt-2">
      <div className="flex gap-4">
        {/* Y Axis ticks */}
        <div className="relative h-[200px] w-12 text-right text-[11px] font-mono text-slate-400">
          <span className="absolute top-0 right-0 leading-none">${max}</span>
          <span className="absolute top-1/2 right-0 -translate-y-1/2 leading-none">${max / 2}</span>
          <span className="absolute bottom-0 right-0 leading-none">$0</span>
        </div>

        {/* Chart Canvas */}
        <div className="relative flex h-[200px] flex-1 items-end gap-3 sm:gap-6 border-b border-slate-200">
          {/* Dashed grid lines */}
          <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-100" />
          <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-100" />

          {series.map((s, i) => {
            const h = Math.max(4, (s.revenue / max) * H);
            const isHovered = hover === i;
            return (
              <div
                key={s.date}
                className="relative flex h-full flex-1 items-end justify-center cursor-pointer group"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={clsx(
                    "w-full max-w-10 rounded-t-md transition-all duration-200",
                    isHovered
                      ? "bg-emerald-600 shadow-md scale-y-[1.02]"
                      : hover !== null
                      ? "bg-emerald-200"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  )}
                  style={{ height: h }}
                />

                {isHovered && (
                  <div className="absolute bottom-full z-20 mb-2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] text-slate-400">
                      {new Date(s.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="font-bold text-sm text-emerald-400 mt-0.5">{money(s.revenue)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X Axis labels */}
      <div className="ml-16 mt-3 flex gap-3 sm:gap-6">
        {series.map((s) => (
          <span key={s.date} className="flex-1 text-center text-[11px] font-semibold text-slate-400 uppercase">
            {new Date(s.date).toLocaleDateString("en-GB", { weekday: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}
