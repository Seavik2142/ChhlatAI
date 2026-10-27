import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Download,
  MessageSquare,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useLanguage, formatCategory } from "../../lib/i18n";
import type { DashboardMetrics } from "../../lib/types";
import { BrandLogo } from "../../components/ui/BrandLogo";

// Social Channel Icon Pills
function ChannelBadge({ type }: { type: "messenger" | "telegram" | "instagram" | "tiktok" | string }) {
  if (type === "messenger" || type === "facebook") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-xs" title="Facebook Messenger">
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.734 7.202V22l3.39-1.86c.92.255 1.895.394 2.876.394 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.05 12.39-2.585-2.757-5.045 2.757 5.55-5.895 2.65 2.757 4.98-2.757-5.55 5.895z"/></svg>
      </span>
    );
  }
  if (type === "telegram") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full overflow-hidden shadow-xs" title="Telegram">
        <BrandLogo brand="telegram" size={24} rounded="full" />
      </span>
    );
  }
  if (type === "instagram") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs" title="Instagram">
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </span>
    );
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs" title="TikTok">
      <svg viewBox="0 0 24 24" className="size-3.5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.48V8.71a8.28 8.28 0 0 0 4.89 1.57v-3.46a4.85 4.85 0 0 1-1-.13z"/></svg>
    </span>
  );
}

export function AdminDashboard() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");

  const overview = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<DashboardMetrics>("/admin/stats"),
  });

  // Traffic bars straight from live backend DB
  const trafficBars = overview.data?.traffic_bars ?? [];

  // Recently joined shops straight from live backend DB
  const recentShops = overview.data?.recent_shops ?? [];

  const revenueByPlan = overview.data?.revenue_by_plan ?? [];

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-6 sm:px-8 sm:py-7 space-y-6">
      {/* ── Page Header (Figma) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("dashboard.title", "Platform overview")}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {t("dashboard.subtitle", "Total shops, API traffic and subscription revenue")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <Users size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Manage Users</span>
          </Link>

          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer">
            <Download size={15} />
            <span>{t("header.export", "Export report")}</span>
          </button>
        </div>
      </div>

      {/* ── 5 Priority Metrics Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total shops */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("dashboard.kpi.totalShops", "Total shops")}</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50">
              <Store size={17} />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            {overview.data?.shops_total ?? overview.data?.total_shops ?? 0}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Live</span>
            <span className="text-slate-500 dark:text-slate-400">
              {overview.data?.shops_active ?? 0} {t("dashboard.kpi.active", "active")} · {overview.data?.shops_trial ?? 0} {t("dashboard.kpi.trial", "trial")}
            </span>
          </div>
        </div>

        {/* Platform Users */}
        <Link
          to="/admin/users"
          className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Platform Users</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50/90 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/50 group-hover:scale-105 transition-transform">
              <Users size={17} />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            {overview.data?.total_users ?? 0}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-500 dark:text-slate-400">
              {overview.data?.users_owner ?? 0} owners · {overview.data?.users_staff ?? 0} staff
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              &rsaquo;
            </span>
          </div>
        </Link>

        {/* API requests today */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("dashboard.kpi.apiToday", "API requests today")}</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50">
              <Zap size={17} />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            {(overview.data?.api_requests_today ?? 0).toLocaleString()}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">● Real-time</span>
            <span className="text-slate-500 dark:text-slate-400">
              {(overview.data?.api_requests_month ?? overview.data?.total_messages ?? 0).toLocaleString()} {t("dashboard.kpi.thisMonth", "this month")}
            </span>
          </div>
        </div>

        {/* Subscription revenue (MRR) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("dashboard.kpi.mrr", "Subscription revenue (MRR)")}</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50">
              <DollarSign size={17} />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            ${(overview.data?.mrr ?? 0).toLocaleString()}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Active</span>
            <span className="text-slate-500 dark:text-slate-400">
              {overview.data?.revenue_by_plan?.length ?? 0} tiers · {overview.data?.shops_active ?? 0} paying
            </span>
          </div>
        </div>

        {/* Active AI conversations */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("dashboard.kpi.activeConversations", "Active AI conversations")}</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50">
              <MessageSquare size={17} />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            {(overview.data?.conversations ?? 0).toLocaleString()}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Live</span>
            <span className="text-slate-500 dark:text-slate-400">{overview.data?.ai_replies ?? 0} {t("dashboard.kpi.aiReplies", "AI replies")}</span>
          </div>
        </div>
      </div>

      {/* ── Middle Visual Charts Section (Figma) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Chart: API requests (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{t("dashboard.chart.apiRequests", "API requests")}</h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {t("dashboard.chart.apiSub", "Messages processed per day across all shops")}
              </p>
            </div>

            {/* Toggle Daily / Monthly */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 text-[12px] font-medium">
              <button
                onClick={() => setPeriod("daily")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition cursor-pointer ${
                  period === "daily"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                {t("dashboard.chart.daily", "Daily")}
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                  period === "monthly"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {t("dashboard.chart.monthly", "Monthly")}
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization matching Figma */}
          {trafficBars.length === 0 ? (
            <div className="mt-8 flex h-48 items-center justify-center text-slate-400 dark:text-slate-500 text-[13px] border-b border-slate-100 dark:border-slate-800 pb-2">
              No message traffic recorded yet
            </div>
          ) : (
            <div className="mt-8 flex h-48 items-end gap-2 sm:gap-3 px-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              {trafficBars.map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center justify-end gap-2 group h-full">
                  <div
                    className="w-full rounded-t-md bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400"
                    style={{ height: `${Math.round(bar.height * 1.6)}px` }}
                    title={`${bar.count ? bar.count.toLocaleString() : 0} messages`}
                  />
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Revenue by plan (1 Col) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{t("dashboard.chart.revenuePlan", "Revenue by plan")}</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">{t("dashboard.chart.revenueSub", "Monthly recurring revenue")}</p>

            <div className="mt-6 space-y-5">
              {revenueByPlan.map((item, idx) => {
                const color = idx === 0 ? "bg-indigo-600 dark:bg-indigo-500" : idx === 1 ? "bg-sky-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700";
                return (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between text-[13px]">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.plan}</span>
                        <span className="ml-2 text-[12px] text-slate-400 dark:text-slate-500">{item.shops} {t("workspace.shops", "shops")}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">${item.mrr}</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.max(item.percentage, item.mrr > 0 ? 5 : 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Total MRR */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
            <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{t("dashboard.chart.totalMrr", "Total MRR")}</span>
            <span className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ${(overview.data?.mrr ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recently joined shops Table (Figma) ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">{t("dashboard.recent.title", "Recently joined shops")}</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.recent.subtitle", "Latest merchant onboarding")}</p>
          </div>
          <Link
            to="/admin/shops"
            className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <span>{t("dashboard.recent.viewAll", "View all")}</span>
            <span>&rsaquo;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAFC]/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">{t("table.shop", "Shop")}</th>
                <th className="py-3.5 px-6">{t("table.category", "Category")}</th>
                <th className="py-3.5 px-6">{t("table.plan", "Plan")}</th>
                <th className="py-3.5 px-6">{t("table.channels", "Channels")}</th>
                <th className="py-3.5 px-6">{t("table.joined", "Joined")}</th>
                <th className="py-3.5 px-6">{t("table.status", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-[13px]">
                    No merchant shops found
                  </td>
                </tr>
              ) : (
                recentShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Shop */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 items-center justify-center rounded-full text-[11px] font-bold ${shop.avatarBg}`}>
                        {shop.initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{shop.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">owner: {shop.owner}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                    {formatCategory(shop.category, language)}
                  </td>

                  {/* Plan Badge */}
                  <td className="py-4 px-6">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      shop.plan === "Enterprise"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60"
                        : shop.plan === "Pro"
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {shop.plan}
                    </span>
                  </td>

                  {/* Channels */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      {shop.channels.map((ch) => (
                        <ChannelBadge key={ch} type={ch} />
                      ))}
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[12px]">
                    {shop.joined}
                  </td>

                  {/* Status Pill */}
                  <td className="py-4 px-6">
                    {shop.status === "Active" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                    {shop.status === "Trial" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
                        <span className="size-1.5 rounded-full bg-sky-500" />
                        Trial
                      </span>
                    )}
                    {shop.status === "Payment due" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Payment due
                      </span>
                    )}
                    {shop.status === "Suspended" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                        <span className="size-1.5 rounded-full bg-rose-500" />
                        Suspended
                      </span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
