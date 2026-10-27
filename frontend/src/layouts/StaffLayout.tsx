import {
  ChevronDown,
  HelpCircle,
  Inbox,
  Languages,
  LogOut,
  Package,
  PanelLeft,
  Receipt,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";
import { ThemeToggle } from "../lib/theme";
import type { InboxList, Shop } from "../lib/types";

export function StaffLayout() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [localUnread, setLocalUnread] = useState(0);
  const qc = useQueryClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  // Shop details query
  const shopQuery = useQuery({
    queryKey: ["shop"],
    queryFn: () => api.get<Shop>("/shop"),
  });
  const shop = shopQuery.data;

  // Conversations query for unread chats count
  const conversationsQuery = useQuery({
    queryKey: ["conversations", "unread-badge"],
    queryFn: () => api.get<InboxList>("/conversations?tab=all"),
    refetchInterval: 15_000,
  });

  const queryUnread = conversationsQuery.data?.items.reduce(
    (acc, c) => acc + (c.unread_count > 0 ? 1 : 0),
    0
  ) ?? 0;
  const unreadCount = Math.max(localUnread, queryUnread);

  // Online / Away status toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: (online: boolean) => api.patch("/auth/me", { is_online: online }),
    onSuccess: () => {
      void refresh();
      qc.invalidateQueries();
    },
  });

  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate(!user?.is_online);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const staffName = user?.full_name || "Chat Staff";
  const staffEmail = user?.email || "";
  const staffInitials = (function (name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "ST";
  })(staffName);

  interface NavItemDef {
    to: string;
    label: string;
    icon: typeof Inbox;
    end?: boolean;
    badge?: string | number;
    badgeTone?: "danger" | "warning";
  }

  const navItems: NavItemDef[] = [
    {
      to: "/staff",
      label: language === "km" ? "ការសន្ទនាផ្ទាល់" : "Live Customer Chat",
      icon: Inbox,
      end: true,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeTone: "danger",
    },
    {
      to: "/staff/products",
      label: language === "km" ? "ផលិតផលរហ័ស" : "Quick Products",
      icon: Package,
    },
    {
      to: "/staff/orders",
      label: language === "km" ? "ការបញ្ជាទិញ & កម្រៃ" : "My Orders & Commission",
      icon: Receipt,
    },
    {
      to: "/staff/profile",
      label: language === "km" ? "គណនីរបស់ខ្ញុំ" : "My Profile",
      icon: UserIcon,
    },
    {
      to: "/staff/help",
      label: language === "km" ? "ជំនួយ & គន្លឹះ" : "Help & Scripts",
      icon: HelpCircle,
    },
  ];

  const isChatPage = location.pathname === "/staff" || location.pathname === "/staff/";

  const getPageTitle = () => {
    if (location.pathname.startsWith("/staff/products")) {
      return language === "km" ? "ផលិតផល & តម្លៃរហ័ស" : "Quick Products & Quotations";
    }
    if (location.pathname.startsWith("/staff/orders")) {
      return language === "km" ? "ការបញ្ជាទិញ & កម្រៃជើងសារ" : "My Orders & Commission";
    }
    if (location.pathname.startsWith("/staff/profile")) {
      return language === "km" ? "គណនីបុគ្គលិក" : "Staff Account Profile";
    }
    if (location.pathname.startsWith("/staff/help")) {
      return language === "km" ? "ជំនួយ & គន្លឹះឆ្លើយតប" : "Help & Response Guides";
    }
    return language === "km" ? "ការសន្ទនាផ្ទាល់" : "Live Chat";
  };

  return (
    <div className={clsx("flex bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200", isChatPage ? "h-screen overflow-hidden" : "min-h-screen")}>
      {/* ── Left Modern White Sidebar (Matching Shop Owner Clean Design) ── */}
      <aside
        className={clsx(
          "sticky top-0 h-screen flex-shrink-0 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-40 select-none",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Top: Brand & Navigation */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className={clsx("flex items-center pb-3 border-b border-slate-100 dark:border-slate-800", collapsed ? "flex-col gap-3" : "justify-between")}>
            <Link to="/staff" className="flex items-center gap-2 overflow-hidden py-0.5" title="Chhlat AI">
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
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer shadow-2xs"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft size={14} />
            </button>
          </div>

          {/* Active Store & Staff Role Badge */}
          {!collapsed && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50/80 px-2.5 py-1.5 border border-slate-200/60 group">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                <span className="truncate text-[12px] font-semibold text-slate-800">
                  {shop?.name || "Merchant Shop"}
                </span>
              </div>
              <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded uppercase">
                Staff
              </span>
            </div>
          )}

          {/* Online / Away Quick Switch */}
          {!collapsed ? (
            <div
              onClick={handleToggleOnline}
              className="mt-2.5 flex items-center justify-between rounded-xl p-2 border border-slate-200/70 bg-white hover:bg-slate-50 transition cursor-pointer group shadow-2xs"
              title="Click to toggle availability"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={clsx(
                    "size-2.5 rounded-full transition-all",
                    user?.is_online ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-slate-300 ring-2 ring-slate-100"
                  )}
                />
                <span className="text-[11.5px] font-semibold text-slate-700 truncate">
                  {user?.is_online
                    ? language === "km" ? "ត្រៀមឆ្លើយតប (Online)" : "Available for chats"
                    : language === "km" ? "ផ្អាកឆ្លើយតប (Away)" : "Away / Offline"}
                </span>
              </div>
              <span
                className={clsx(
                  "text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase transition",
                  user?.is_online ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-slate-100 text-slate-500"
                )}
              >
                {user?.is_online ? "ON" : "OFF"}
              </span>
            </div>
          ) : (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={handleToggleOnline}
                title={user?.is_online ? "Status: Online (Click to go Away)" : "Status: Away (Click to go Online)"}
                className={clsx(
                  "size-8 rounded-xl border flex items-center justify-center transition cursor-pointer shadow-2xs",
                  user?.is_online
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                )}
              >
                <span className={clsx("size-2.5 rounded-full", user?.is_online ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300")} />
              </button>
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
                        ? "bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/90"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
            onClick={() => navigate("/staff/help")}
            className={clsx(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer",
              collapsed && "justify-center"
            )}
            title="Help & Guides"
          >
            <HelpCircle size={18} className="text-slate-400" />
            {!collapsed && <span>{language === "km" ? "ជំនួយ" : "Help"}</span>}
          </button>

          {/* User Profile Card (Bottom of Sidebar) */}
          <div ref={userMenuRef} className="relative pt-1">
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={clsx(
                "flex items-center justify-between rounded-xl p-2 transition hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200/60",
                collapsed && "justify-center"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="relative flex-shrink-0">
                  <div
                    className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-[12px] font-bold text-white shadow-xs ring-1 ring-slate-200"
                    title="Profile"
                  >
                    {staffInitials}
                  </div>
                  <span
                    className={clsx(
                      "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white",
                      user?.is_online ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  />
                </div>
                {!collapsed && (
                  <div className="overflow-hidden leading-tight flex-1 text-left">
                    <p className="truncate text-[12.5px] font-bold text-slate-900">
                      {staffName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400 font-medium">
                      Chat Staff
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
                  <p className="text-[11px] font-bold text-slate-800 truncate">{staffName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{staffEmail}</p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={clsx("size-2 rounded-full", user?.is_online ? "bg-emerald-500" : "bg-slate-300")} />
                    <span>{user?.is_online ? "Set to Away" : "Set to Online"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {user?.is_online ? "Online" : "Away"}
                  </span>
                </button>

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
                  to="/staff/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserIcon size={14} className="text-slate-500" />
                  <span>My Profile</span>
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

      {/* ── Main Canvas (Top Sticky Header + Page Content) ── */}
      <div className={clsx("flex-1 flex flex-col min-w-0 min-h-0", isChatPage && "h-full overflow-hidden")}>
        {/* Top Sticky Header (Hidden on Chat Page so Live Customer Chat occupies 100% height) */}
        {!isChatPage && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur">
            {/* Page Title & Breadcrumb */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <span className="hidden sm:inline-block text-slate-300">|</span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                {shop?.name || "Merchant Shop"} · Staff Portal
              </span>
            </div>

            {/* Right Header Utilities */}
            <div className="flex items-center gap-2.5">
              {/* Online / Away Status Pill */}
              <button
                type="button"
                onClick={handleToggleOnline}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-semibold transition cursor-pointer",
                  user?.is_online
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                )}
                title="Click to change your online status"
              >
                <span className={clsx("size-2 rounded-full", user?.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                <span>{user?.is_online ? "Online" : "Away"}</span>
              </button>

              {/* Jump to Live Chat */}
              <button
                type="button"
                onClick={() => navigate("/staff")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Back to Live Customer Chat"
              >
                <Inbox size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">{language === "km" ? "ទៅកាន់ការជជែក" : "Live Chat"}</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Switch Language (EN / KM)"
              >
                <Languages size={14} className="text-slate-500 dark:text-slate-400" />
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                  {language}
                </span>
              </button>

              {/* Dark / Light Mode Toggle */}
              <ThemeToggle id="staff-theme-toggle-btn" />

              {/* Staff Avatar */}
              <div
                onClick={() => navigate("/staff/profile")}
                className="flex size-8 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-[11px] font-bold text-white shadow-xs ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer"
                title="View Profile"
              >
                {staffInitials}
              </div>
            </div>
          </header>
        )}

        {/* Content Area */}
        <main className={clsx("flex-1 min-w-0", isChatPage ? "h-full overflow-hidden" : "min-h-0 overflow-y-auto")}>
          <Outlet context={{ setUnread: setLocalUnread }} />
        </main>
      </div>
    </div>
  );
}
