import {
  Activity,
  AlertOctagon,
  Bell,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Flame,
  HelpCircle,
  Languages,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MoreVertical,
  PanelLeft,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AdminNotification, AIStats, DashboardMetrics } from "../lib/types";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";
import { timeAgo } from "../lib/format";
import { ThemeToggle } from "../lib/theme";

interface NavItemDef {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
  badgeTone?: "neutral" | "danger" | "accent" | "success";
  end?: boolean;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  // Real-time Notification Center state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "alerts">("all");
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showNotifications || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications, showUserMenu]);

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<AdminNotification[]>("/admin/notifications"),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post("/admin/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.del("/admin/notifications"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (notificationFilter === "unread") return !n.is_read;
    if (notificationFilter === "alerts") return n.kind === "error" || n.kind === "high_priority" || n.kind === "payment";
    return true;
  });

  function getNotificationBadge(kind: string) {
    switch (kind) {
      case "error":
        return {
          icon: AlertOctagon,
          bg: "bg-rose-100 text-rose-600 border-rose-200/60",
        };
      case "payment":
        return {
          icon: CreditCard,
          bg: "bg-amber-100 text-amber-700 border-amber-200/60",
        };
      case "high_priority":
        return {
          icon: Flame,
          bg: "bg-purple-100 text-purple-700 border-purple-200/60",
        };
      case "shop":
        return {
          icon: Store,
          bg: "bg-emerald-100 text-emerald-700 border-emerald-200/60",
        };
      case "announcement":
        return {
          icon: Megaphone,
          bg: "bg-sky-100 text-sky-700 border-sky-200/60",
        };
      default:
        return {
          icon: ShieldAlert,
          bg: "bg-indigo-100 text-indigo-700 border-indigo-200/60",
        };
    }
  }

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<DashboardMetrics>("/admin/stats"),
  });
  const aiStatsQuery = useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: () => api.get<AIStats>("/admin/ai-stats"),
  });
  const logsQuery = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => api.get<any[]>("/admin/logs"),
  });
  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<any[]>("/admin/coupons"),
  });

  const totalShops = statsQuery.data?.shops_total ?? 0;
  const totalUsers = statsQuery.data?.total_users ?? 0;
  const errorCount = logsQuery.data?.length ?? 0;
  const spend = aiStatsQuery.data?.monthly_spend ?? 0;
  const budget = aiStatsQuery.data?.monthly_budget ?? 2000;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
  const activeCouponsCount = (couponsQuery.data ?? []).filter((c) => c.is_active).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const adminName = user?.full_name || "Platform Admin";
  const adminEmail = user?.email || "admin@omnichat.kh";
  const adminInitials = (function (name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "AD";
  })(adminName);

  const navGroups: NavGroupDef[] = [
    {
      title: t("group.overview", "OVERVIEW"),
      items: [
        { to: "/admin", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard, end: true },
      ],
    },
    {
      title: t("group.management", "MANAGEMENT"),
      items: [
        { to: "/admin/shops", label: t("nav.shops", "Shops"), icon: Store, badge: totalShops, badgeTone: "neutral" },
        { to: "/admin/users", label: t("nav.users", "Users & Accounts"), icon: Users, badge: totalUsers, badgeTone: "neutral" },
        {
          to: "/admin/plans",
          label: t("nav.billing", "Subscriptions & Billing"),
          icon: CreditCard,
          badge: activeCouponsCount > 0 ? `${activeCouponsCount} promo` : undefined,
          badgeTone: "accent",
        },
      ],
    },
    {
      title: t("group.platform", "PLATFORM"),
      items: [
        {
          to: "/admin/ai",
          label: t("nav.ai", "AI Models & Prompts"),
          icon: Bot,
          badge: "v3.8 Flash",
          badgeTone: "accent",
        },
        { to: "/admin/announcements", label: t("nav.announcements", "Announcements"), icon: Megaphone },
      ],
    },
    {
      title: t("group.system", "SYSTEM"),
      items: [
        { to: "/admin/settings", label: t("nav.system", "System Settings"), icon: Settings },
        {
          to: "/admin/logs",
          label: t("nav.logs", "Audit Logs & Health"),
          icon: Activity,
          badge: errorCount > 0 ? `${errorCount} err` : "Healthy",
          badgeTone: errorCount > 0 ? "danger" : "success",
        },
      ],
    },
  ];

  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(navSearch.toLowerCase().trim())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* ── Left Professional Enterprise Sidebar ── */}
      <aside
        className={clsx(
          "sticky top-0 h-screen flex-shrink-0 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-40 select-none shadow-[1px_0_4px_0_rgba(15,23,42,0.02)]",
          collapsed ? "w-[72px]" : "w-[270px]"
        )}
      >
        {/* Top: Logo, Root Workspace Console & Fast Navigation Search */}
        <div className="p-3.5 pb-2">
          {/* Brand Header */}
          <div className={clsx("flex items-center", collapsed ? "flex-col gap-2.5" : "justify-between px-1")}>
            <Link to="/admin" className="flex items-center gap-2 overflow-hidden py-0.5 group" title="Chhlat AI Platform Admin">
              {collapsed ? (
                <div className="flex size-9.5 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 shadow-2xs group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:border-slate-300 transition-all">
                  <img
                    src="/logocllhatAI-mark.svg"
                    alt="Chhlat AI"
                    className="size-7 object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src="/logocllhatAI.svg"
                    alt="Chhlat AI"
                    className="h-7.5 w-auto object-contain max-w-[145px] dark:hidden"
                  />
                  <img
                    src="/logocllhatAI-dark.svg"
                    alt="Chhlat AI"
                    className="h-7.5 w-auto object-contain max-w-[145px] hidden dark:block"
                  />
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-100 shadow-2xs uppercase border border-slate-700">
                    <Shield size={10} className="text-indigo-400" />
                    Admin
                  </span>
                </div>
              )}
            </Link>

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex size-7.5 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 cursor-pointer"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft size={16} />
            </button>
          </div>

          {/* Platform Admin Root Badge (Executive Console Context) */}
          <div className="mt-3">
            {!collapsed ? (
              <div
                className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-slate-50/90 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/90 p-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                title="Super Admin Root Console"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* High-end Brand Avatar with Live Pulsing Dot */}
                    <div className="relative flex-shrink-0">
                      <div className="flex size-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xs ring-1 ring-slate-900/10">
                        <img
                          src="/logocllhatAI-mark.svg"
                          alt="Chhlat AI"
                          className="size-5 object-contain"
                        />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12.5px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          Platform Admin
                        </p>
                        <span className="rounded bg-indigo-100/90 dark:bg-indigo-950/80 px-1 py-0.2 text-[8.5px] font-extrabold tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 uppercase">
                          ROOT
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                        <span>Cluster ap-se1</span>
                        <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{totalShops} shops</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/60">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="relative flex size-9.5 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                  title={`Platform Admin (${totalShops} shops active)`}
                  onClick={() => setCollapsed(false)}
                >
                  <div className="flex size-7.5 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xs">
                    <img
                      src="/logocllhatAI-mark.svg"
                      alt="Chhlat AI"
                      className="size-4.5 object-contain"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Jump / Search Module Filter */}
          {!collapsed && (
            <div className="relative mt-2.5">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder={t("nav.searchNav", "Quick jump...")}
                className="w-full h-7.5 pl-7.5 pr-7 text-[11.5px] rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 transition-all"
              />
              {navSearch ? (
                <button
                  type="button"
                  onClick={() => setNavSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  <X size={11} />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 py-0.2 text-[8.5px] font-mono text-slate-400 dark:text-slate-500 shadow-3xs">
                  /
                </kbd>
              )}
            </div>
          )}
        </div>

        {/* Nav Categories */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-thin">
          {filteredNavGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        clsx(
                          "group relative flex items-center justify-between rounded-xl transition-all duration-150 select-none",
                          collapsed ? "p-2.5 justify-center" : "px-2.5 py-2 text-[13px]",
                          isActive
                            ? "bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs border border-indigo-100/70 dark:border-indigo-900/50"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent font-medium"
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Left Active Accent Pill Bar */}
                          {isActive && !collapsed && (
                            <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600 shadow-xs" />
                          )}

                          <div className={clsx("flex items-center min-w-0", collapsed ? "justify-center" : "gap-2.5")}>
                            <Icon
                              size={17}
                              className={clsx(
                                "transition-transform duration-150 shrink-0",
                                isActive
                                  ? "text-indigo-600 dark:text-indigo-400 scale-105"
                                  : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:scale-105"
                              )}
                            />
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>

                          {!collapsed && item.badge !== undefined && (
                            <span
                              className={clsx(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none border transition-colors shrink-0",
                                item.badgeTone === "danger"
                                  ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50 font-bold"
                                  : item.badgeTone === "accent"
                                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-900/50 font-semibold"
                                  : item.badgeTone === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/50 font-semibold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-700"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}

                          {collapsed && isActive && (
                            <span className="absolute right-1 top-1.5 size-1.5 rounded-full bg-indigo-600 ring-1 ring-white dark:ring-slate-900" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredNavGroups.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-xs">
              <p>No navigation matches "{navSearch}"</p>
              <button
                type="button"
                onClick={() => setNavSearch("")}
                className="mt-1 text-indigo-600 font-semibold hover:underline text-[11px] cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
        </nav>

        {/* Bottom Sidebar: Infrastructure Health, Help & User Profile */}
        <div className="border-t border-slate-200/80 dark:border-slate-800 p-3 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/40">
          {/* Infrastructure Health & Telemetry Card */}
          {!collapsed ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    {t("header.systemOperational", "All systems operational")}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/60">
                  99.98%
                </span>
              </div>

              {/* API Budget telemetry */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t("header.apiBudget", "API budget")}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    ${Math.round(spend)} <span className="text-slate-400 dark:text-slate-500 font-normal">/ ${budget.toLocaleString()}</span>
                  </span>
                </div>
                {/* Modern multi-gradient progress bar */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-750">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      budgetPct > 80
                        ? "bg-rose-500"
                        : budgetPct > 50
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-indigo-500 to-emerald-500"
                    )}
                    style={{ width: `${Math.max(4, budgetPct)}%` }}
                  />
                </div>
              </div>

              {/* View Audit & System Status link */}
              <Link
                to="/admin/logs"
                className="mt-2.5 flex items-center justify-between text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition group/link"
              >
                <span>{t("header.viewSystemStatus", "View system status & logs")}</span>
                <ChevronRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                to="/admin/logs"
                className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs"
                title="System Status: 99.98% Operational"
              >
                <ShieldCheck size={16} />
              </Link>
            </div>
          )}

          {/* Help & Support Button */}
          <button
            onClick={() => alert("Chhlat AI Platform Support: support@chhlatai.com")}
            className={clsx(
              "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs cursor-pointer",
              collapsed && "justify-center p-2"
            )}
            title={t("header.helpSupport", "Help & Support")}
          >
            <HelpCircle size={15} className="text-slate-400 dark:text-slate-500" />
            {!collapsed && <span>{t("header.helpSupport", "Help & Support")}</span>}
          </button>

          {/* User Profile Card */}
          <div className="relative" ref={userMenuRef}>
            <div
              className={clsx(
                "flex items-center justify-between rounded-xl p-1.5 transition border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700",
                collapsed && "justify-center border-none bg-transparent shadow-none p-0"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {collapsed ? (
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative flex size-8.5 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-800 text-[11px] font-bold text-white shadow-xs hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition cursor-pointer"
                    title={`Admin: ${adminName}`}
                  >
                    {adminInitials}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                  </button>
                ) : (
                  <Link
                    to="/admin/settings"
                    className="relative flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-800 text-[11px] font-bold text-white shadow-xs hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition"
                    title="Admin Settings"
                  >
                    {adminInitials}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                  </Link>
                )}
                {!collapsed && (
                  <Link
                    to="/admin/settings"
                    className="overflow-hidden leading-tight flex-1 text-left group"
                    title="Open Admin Settings"
                  >
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[12px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {adminName}
                      </p>
                    </div>
                    <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {adminEmail}
                    </p>
                  </Link>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-0.5">
                  <Link
                    to="/admin/settings"
                    className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    title="Settings"
                  >
                    <Settings size={14} />
                  </Link>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            {showUserMenu && (
              <div
                className={clsx(
                  "absolute rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xl z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100",
                  collapsed
                    ? "left-full bottom-0 ml-2.5 w-52"
                    : "bottom-full left-0 mb-2 w-full"
                )}
              >
                <Link
                  to="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>Admin Settings</span>
                </Link>
                <Link
                  to="/admin/logs"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Activity size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>Audit Logs & Telemetry</span>
                </Link>
                <Link
                  to="/owner"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Store size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>Switch to Merchant View</span>
                </Link>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{t("header.signOut", "Sign out")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Canvas (Top Navigation + Page Content) ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header (Figma) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-6 backdrop-blur">
          {/* Global Search Bar */}
          <div className="relative w-80 sm:w-96">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t("header.search", "Search shops, invoices, logs...")}
              className="h-9 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 pl-9 pr-10 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-2xs">
              ⌘K
            </span>
          </div>

          {/* Right Header Utilities: Language Switcher, Notifications, User Pill */}
          <div className="flex items-center gap-3">
            {/* Single Language Toggle Icon Button */}
            <button
              id="header-language-toggle-btn"
              aria-label="Toggle language"
              type="button"
              onClick={toggleLanguage}
              className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400 dark:hover:border-indigo-500/50 transition cursor-pointer active:scale-95"
              title={
                language === "en"
                  ? "Current: English (Click to switch to ភាសាខ្មែរ)"
                  : "បច្ចុប្បន្ន: ភាសាខ្មែរ (Click to switch to English)"
              }
            >
              <Languages size={17} />
              <span
                className={clsx(
                  "absolute -bottom-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8.5px] font-bold text-white ring-2 ring-white dark:ring-slate-800 uppercase transition-colors",
                  language === "km" ? "bg-indigo-600" : "bg-slate-900"
                )}
              >
                {language}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle id="admin-theme-toggle-btn" />

            {/* Notification Bell with interactive popover */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={clsx(
                  "relative flex size-9 items-center justify-center rounded-lg border transition cursor-pointer",
                  showNotifications
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                )}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2.5 w-[380px] sm:w-[420px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => readAllMutation.mutate()}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck size={13} />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 px-4 py-2 bg-white dark:bg-slate-900 text-[11.5px]">
                    <button
                      type="button"
                      onClick={() => setNotificationFilter("all")}
                      className={clsx(
                        "rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer",
                        notificationFilter === "all"
                          ? "bg-slate-900 dark:bg-indigo-600 text-white"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationFilter("unread")}
                      className={clsx(
                        "rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer",
                        notificationFilter === "unread"
                          ? "bg-slate-900 dark:bg-indigo-600 text-white"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationFilter("alerts")}
                      className={clsx(
                        "rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer",
                        notificationFilter === "alerts"
                          ? "bg-slate-900 dark:bg-indigo-600 text-white"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      Alerts
                    </button>
                  </div>

                  {/* Notifications Scroll List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-12 px-4 text-center">
                        <CheckCircle2 size={30} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                          You're all caught up!
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No new notifications matching your filter.
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => {
                        const badge = getNotificationBadge(n.kind);
                        const Icon = badge.icon;
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markReadMutation.mutate(n.id);
                              if (n.link) {
                                navigate(n.link);
                                setShowNotifications(false);
                              }
                            }}
                            className={clsx(
                              "group flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/80",
                              !n.is_read ? "bg-indigo-50/20 dark:bg-indigo-950/20" : "bg-white dark:bg-slate-900"
                            )}
                          >
                            <div
                              className={clsx(
                                "flex size-8 shrink-0 items-center justify-center rounded-xl border mt-0.5",
                                badge.bg
                              )}
                            >
                              <Icon size={14} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={clsx(
                                    "text-[12.5px] truncate leading-snug",
                                    !n.is_read
                                      ? "font-bold text-slate-900 dark:text-slate-100"
                                      : "font-medium text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {timeAgo(n.created_at)}
                                </span>
                              </div>

                              <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                {n.body}
                              </p>

                              <div className="mt-1.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {n.shop_name && (
                                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600 dark:text-slate-400">
                                      {n.shop_name}
                                    </span>
                                  )}
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                                    {n.kind}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                  {!n.is_read && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markReadMutation.mutate(n.id);
                                      }}
                                      className="rounded p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                      title="Mark as read"
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotificationMutation.mutate(n.id);
                                    }}
                                    className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                    title="Dismiss notification"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {!n.is_read && (
                              <span className="size-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/admin/settings");
                        setShowNotifications(false);
                      }}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer"
                    >
                      System Diagnostics &rsaquo;
                    </button>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearAllMutation.mutate()}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Circle linking to Admin Settings */}
            <Link
              to="/admin/settings"
              className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-950 hover:ring-indigo-300 transition"
              title={`${adminName} (${adminEmail}) — Click for Admin Settings`}
            >
              {adminInitials}
            </Link>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
