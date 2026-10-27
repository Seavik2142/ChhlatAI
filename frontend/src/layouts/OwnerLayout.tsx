import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Inbox,
  Languages,
  LayoutDashboard,
  Layers,
  LogOut,
  Megaphone,
  Package,
  PanelLeft,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { timeAgo } from "../lib/format";
import { useLanguage } from "../lib/i18n";
import { ThemeToggle } from "../lib/theme";
import type { Notification, Shop } from "../lib/types";

interface OverviewData {
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

export interface NavEntry {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export { OwnerLayout as SidebarLayout };

export function OwnerLayout(_props?: { title?: string; subtitle?: string; nav?: NavEntry[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"all" | "unread">("all");
  const notificationRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Close notifications when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

  // Shop details query
  const shopQuery = useQuery({
    queryKey: ["shop"],
    queryFn: () => api.get<Shop>("/shop"),
  });
  const shop = shopQuery.data;

  // Real overview metrics
  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/shop/overview"),
    refetchInterval: 30_000,
  });
  const o = overviewQuery.data;

  // Real notifications query from backend DB
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
    refetchInterval: 15_000,
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch<Notification>(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post("/notifications/read-all", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => api.del(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.del("/notifications"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationConfig = (n: Notification) => {
    switch (n.kind) {
      case "payment":
        return {
          icon: CreditCard,
          label: "Payment",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          link: "/owner/orders",
        };
      case "low_stock":
        return {
          icon: Package,
          label: "Inventory",
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200/60",
          link: "/owner/products",
        };
      case "wait_staff":
      case "high_priority":
        return {
          icon: AlertCircle,
          label: "Live Chat",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200/60",
          link: n.conversation_id ? `/owner/inbox` : "/owner/inbox",
        };
      case "broadcast":
      case "announcement":
        return {
          icon: Megaphone,
          label: "Broadcast",
          badgeBg: "bg-sky-50 text-sky-700 border-sky-200/60",
          link: "/owner/broadcast",
        };
      default:
        return {
          icon: Bell,
          label: "Notice",
          badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
          link: "/owner",
        };
    }
  };

  const renderNotificationPopover = () => {
    const displayedNotifications =
      notificationTab === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    return (
      <div
        className="absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">Notifications</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                {unreadCount} unread
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                All caught up
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer ml-1"
                title="Clear all notifications"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        {notifications.length > 0 && (
          <div className="flex items-center border-b border-slate-100 px-3 py-1.5 bg-white text-[12px] gap-1">
            <button
              type="button"
              onClick={() => setNotificationTab("all")}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition cursor-pointer",
                notificationTab === "all"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setNotificationTab("unread")}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-medium transition cursor-pointer",
                notificationTab === "unread"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>
        )}

        {/* Notifications Scroll List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
              <p className="text-[13px] font-semibold text-slate-800">
                {notificationTab === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                {notificationTab === "unread"
                  ? "You've read all messages, order updates, and alerts."
                  : "Real-time updates about orders, payments, and chats will appear here."}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const cfg = getNotificationConfig(n);
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) {
                      markReadMutation.mutate(n.id);
                    }
                    setShowNotifications(false);
                    navigate(cfg.link);
                  }}
                  className={clsx(
                    "group relative flex items-start gap-3 p-3.5 transition cursor-pointer",
                    !n.is_read ? "bg-slate-50/80 hover:bg-slate-100/80" : "bg-white hover:bg-slate-50/60"
                  )}
                >
                  {/* Unread Indicator Bar */}
                  {!n.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                  )}

                  {/* Icon badge */}
                  <div
                    className={clsx(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border text-xs shadow-xs",
                      cfg.badgeBg
                    )}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={clsx(
                          "text-[12.5px] leading-snug truncate",
                          !n.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        )}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={clsx(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border",
                          cfg.badgeBg
                        )}
                      >
                        {cfg.label}
                      </span>

                      {/* Row Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(n.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(n.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-2.5 text-center flex items-center justify-between px-4">
          <Link
            to="/owner/orders"
            onClick={() => setShowNotifications(false)}
            className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            Orders & Payments &rsaquo;
          </Link>
          <Link
            to="/owner/inbox"
            onClick={() => setShowNotifications(false)}
            className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            Live Customer Chat &rsaquo;
          </Link>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const ownerName = user?.full_name || "Shop Owner";
  const ownerEmail = user?.email || "";
  const ownerInitials = (function (name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "SO";
  })(ownerName);

  const repliesUsed = o?.ai_replies_used ?? shop?.ai_replies_used ?? 0;
  const repliesLimit = o?.ai_replies_limit ?? shop?.plan?.ai_replies_limit ?? 10000;
  const quotaPct = repliesLimit > 0 ? Math.min(100, Math.round((repliesUsed / repliesLimit) * 100)) : 0;

  interface NavItemDef {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    end?: boolean;
    badge?: string | number;
    badgeTone?: "danger" | "warning";
  }

  const navItems: NavItemDef[] = [
    {
      to: "/owner",
      label: language === "km" ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/owner/inbox",
      label: language === "km" ? "សារ" : "Message",
      icon: Inbox,
      badge: o?.waiting_staff && o.waiting_staff > 0 ? o.waiting_staff : undefined,
      badgeTone: "danger" as const,
    },
    {
      to: "/owner/products",
      label: language === "km" ? "ម៉ឺនុយ & ទិន្នន័យ AI" : "AI Ingestion & Menu",
      icon: Sparkles,
      badge: o?.low_stock && o.low_stock.length > 0 ? `${o.low_stock.length} low` : undefined,
      badgeTone: "warning" as const,
    },
    {
      to: "/owner/orders",
      label: language === "km" ? "ការបញ្ជាទិញ" : "Orders",
      icon: Receipt,
      badge: o?.needs_review && o.needs_review > 0 ? `${o.needs_review} review` : undefined,
      badgeTone: "danger" as const,
    },
    {
      to: "/owner/broadcast",
      label: language === "km" ? "ផ្សព្វផ្សាយ" : "Broadcast",
      icon: Megaphone,
    },
    {
      to: "/owner/settings",
      label: language === "km" ? "ការកំណត់" : "Settings",
      icon: Settings,
    },
  ];

  const isInboxPage = location.pathname.startsWith("/owner/inbox");

  return (
    <div className={clsx("flex bg-[#F8FAFC] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200", isInboxPage ? "h-screen overflow-hidden" : "min-h-screen")}>
      {/* ── Left Modern White Sidebar (MedTrackr Clean Style) ── */}
      <aside
        className={clsx(
          "sticky top-0 h-screen flex-shrink-0 flex flex-col justify-between border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] transition-all duration-300 z-40 select-none",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Top: Logo & Main Nav */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className={clsx("flex items-center pb-3 border-b border-slate-100 dark:border-slate-800", collapsed ? "flex-col gap-3" : "justify-between")}>
            <Link to="/owner" className="flex items-center gap-2 overflow-hidden py-0.5" title="Chhlat AI">
              {collapsed ? (
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 p-1 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <img src="/logocllhatAI-mark.svg" alt="Chhlat AI" className="size-7 object-contain" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <img
                    src="/logocllhatAI.svg"
                    alt="Chhlat AI"
                    className="h-8 w-auto object-contain max-w-[150px] dark:hidden"
                  />
                  <img
                    src="/logocllhatAI-dark.svg"
                    alt="Chhlat AI"
                    className="h-8 w-auto object-contain max-w-[150px] hidden dark:block"
                  />
                </div>
              )}
            </Link>

            {/* Sidebar Collapse Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shadow-2xs"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft size={14} />
            </button>
          </div>

          {/* Active Store Badge (Clean Compact) */}
          {!collapsed && (
            <div
              onClick={() => navigate("/owner/settings")}
              className="mt-3 flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/80 px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition cursor-pointer group"
              title="Click to view shop settings"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950" />
                <span className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {shop?.name || "Merchant Shop"}
                </span>
              </div>
              <Link
                to="/owner/settings?tab=subscription"
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60 uppercase transition hover:scale-105"
                title="View & manage subscription plan"
              >
                {shop?.plan?.name || "PRO"}
              </Link>
            </div>
          )}

          {/* Main Navigation Links */}
          <nav className="mt-4 space-y-1.5 flex-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                      isActive
                        ? "bg-white dark:bg-[#16223b] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200/90 dark:border-white/10"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-100"
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={clsx(
                            "transition-colors",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </div>

                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={clsx(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                            item.badgeTone === "danger"
                              ? "bg-rose-500 text-white"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Help & Profile */}
        <div className="border-t border-slate-100 p-3 space-y-1 shrink-0">
          {/* Help link */}
          <button
            onClick={() => alert("Chhlat AI Support: Need assistance? Reach out to support@chhlat.ai or check our docs.")}
            className={clsx(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer",
              collapsed && "justify-center"
            )}
            title="Help & Support"
          >
            <HelpCircle size={18} className="text-slate-400" />
            {!collapsed && <span>{language === "km" ? "ជំនួយ" : "Help"}</span>}
          </button>

          {/* User Profile Card (Bottom of Sidebar) */}
          <div className="relative pt-1">
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={clsx(
                "flex items-center justify-between rounded-xl p-2 transition hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200/60",
                collapsed && "justify-center"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[12px] font-bold text-white shadow-xs ring-1 ring-slate-200"
                  title="Profile"
                >
                  {ownerInitials}
                </div>
                {!collapsed && (
                  <div className="overflow-hidden leading-tight flex-1 text-left">
                    <p className="truncate text-[12.5px] font-bold text-slate-900">
                      {ownerName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400 font-medium">
                      Admin
                    </p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <ChevronDown size={15} className={clsx("text-slate-400 transition-transform", showUserMenu && "rotate-180")} />
              )}
            </div>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{ownerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{ownerEmail}</p>
                  <div className="mt-1 flex items-center justify-between text-[9.5px] text-slate-500">
                    <span>AI Quota</span>
                    <span className="font-semibold text-blue-600">{quotaPct}%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Languages size={14} className="text-slate-500" />
                    <span>Language</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                    {language}
                  </span>
                </button>
                <Link
                  to="/owner/settings?tab=subscription"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Layers size={14} className="text-indigo-500" />
                  <span>{language === "km" ? "កញ្ចប់សេវា & ការជាវ" : "Subscription & Plans"}</span>
                </Link>
                <Link
                  to="/owner/settings?tab=security"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <ShieldCheck size={14} className="text-slate-500" />
                  <span>{language === "km" ? "គណនី & សុវត្ថិភាព" : "Profile & Security"}</span>
                </Link>
                <Link
                  to="/owner/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings size={14} className="text-slate-500" />
                  <span>Shop Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
      <div className={clsx("flex-1 flex flex-col min-w-0 min-h-0", isInboxPage && "h-full overflow-hidden")}>
        {/* Top Sticky Header (Hidden on Inbox Page so Live Chat occupies full height) */}
        {!isInboxPage && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c1322]/95 px-6 backdrop-blur">
            {/* Breadcrumb / Search */}
            <div className="flex items-center gap-3">
              <div className="relative w-72 sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === "km" ? "ស្វែងរកផលិតផល, ការបញ្ជាទិញ..." : "Search products, orders, chat..."}
                  className="h-9 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 pl-9 pr-10 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-2xs">
                  ⌘K
                </span>
              </div>

            {/* AI Auto-Pilot Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 px-2.5 py-1 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{shop?.ai_enabled ? "AI Auto-Pilot Active" : "Manual Mode"}</span>
            </div>
          </div>

          {/* Right Header Utilities: Language, Notifications, Quick Action */}
          <div className="flex items-center gap-3">
            {/* Quick Action Button */}
            <button
              onClick={() => navigate("/owner/products")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Product</span>
            </button>

            {/* Language Toggle Button */}
            <button
              id="owner-language-toggle-btn"
              aria-label="Toggle language"
              type="button"
              onClick={toggleLanguage}
              className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-emerald-400 dark:hover:border-emerald-500/50 transition cursor-pointer active:scale-95"
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
                  language === "km" ? "bg-emerald-600" : "bg-slate-900"
                )}
              >
                {language}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle id="owner-theme-toggle-btn" />

            {/* Notification Bell with interactive popover */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={clsx(
                  "relative flex size-9 items-center justify-center rounded-lg border transition cursor-pointer",
                  showNotifications
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                )}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Shop Alerts & Notifications"}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && renderNotificationPopover()}
            </div>

            {/* Shop Owner Profile Header Pill */}
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 pl-1.5 pr-2.5 py-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-slate-800 dark:bg-slate-700 text-[10px] font-bold text-white shadow-xs">
                {ownerInitials}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <span className="block text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                  {ownerName}
                </span>
                <span className="block text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mt-0.5">
                  Shop Owner
                </span>
              </div>
            </div>
          </div>
        </header>
        )}

        {/* ── Page Content Container ── */}
        <main
          className={clsx(
            "flex-1 min-w-0 min-h-0",
            isInboxPage ? "h-full overflow-hidden" : "overflow-y-auto scrollbar-thin"
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Standard responsive container for merchant owner pages. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8", className)}>
      {children}
    </div>
  );
}
