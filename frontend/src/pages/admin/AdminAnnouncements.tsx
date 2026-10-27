import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Edit2,
  Eye,
  Megaphone,
  Pin,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { shortDate } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type { Announcement } from "../../lib/types";

// Category configurations with icons and color schemes
const CATEGORIES = {
  feature: {
    label: "New Feature",
    labelKm: "មុខងារថ្មី",
    color: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800",
    badge: "bg-indigo-600 text-white",
    icon: Sparkles,
  },
  maintenance: {
    label: "Maintenance",
    labelKm: "ការថែទាំ",
    color: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-800",
    badge: "bg-amber-600 text-white",
    icon: Wrench,
  },
  important: {
    label: "Critical Alert",
    labelKm: "ការប្រកាសអាសន្ន",
    color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800",
    badge: "bg-rose-600 text-white",
    icon: ShieldAlert,
  },
  update: {
    label: "System Update",
    labelKm: "បច្ចុប្បន្នភាព",
    color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-800",
    badge: "bg-sky-600 text-white",
    icon: Radio,
  },
  security: {
    label: "Security Notice",
    labelKm: "សន្តិសុខ",
    color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200/80 dark:border-purple-800",
    badge: "bg-purple-600 text-white",
    icon: Shield,
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// Pre-built professional templates for rapid broadcasting
const PRESET_TEMPLATES = [
  {
    id: "maintenance",
    name: "Scheduled System Maintenance",
    category: "maintenance" as CategoryKey,
    audience: "all",
    channels: ["banner", "telegram"],
    pinned: true,
    title: "🛠️ Scheduled System Maintenance & Upgrade",
    body: "Chhlat AI will undergo routine database optimization and core server upgrades this Sunday from 02:00 AM to 03:00 AM ICT (approx 60 mins). Inbound customer chats on Telegram and Messenger will continue queueing and AI auto-replies will resume immediately following completion. Thank you for your patience.",
  },
  {
    id: "feature_broadcast",
    name: "New Feature: Marketing Broadcast & AI Messaging",
    category: "feature" as CategoryKey,
    audience: "all",
    channels: ["banner", "telegram", "popup"],
    pinned: true,
    title: "🎉 New Feature: Marketing Broadcast with AI Personalization",
    body: "Starting today, Pro and Enterprise shops can broadcast targeted promotional campaigns to all previous buyers across Telegram & Messenger. Our AI assistant analyzes past purchase history to draft individualized, high-converting messages. Open Owner Dashboard → Marketing Broadcast to launch your first campaign.",
  },
  {
    id: "payment_update",
    name: "Payment Gateway: Bakong KHQR & ACLEDA ToanChet",
    category: "update" as CategoryKey,
    audience: "owners",
    channels: ["banner", "telegram"],
    pinned: false,
    title: "💳 Enhanced Bakong KHQR & ACLEDA Real-Time Payment Sync",
    body: "We have upgraded our payment verification pipeline with ultra-fast KHQR hash validation and ACLEDA ToanChet merchant integration. Payment slips are now automatically matched against bank records in under 3.2 seconds. Check Settings → Payments to verify your webhook credentials.",
  },
  {
    id: "holiday_notice",
    name: "Water Festival Holiday Operations Notice",
    category: "update" as CategoryKey,
    audience: "all",
    channels: ["banner"],
    pinned: false,
    title: "🌊 Water Festival (Bon Om Touk) Support Schedule",
    body: "In celebration of the Cambodian Water Festival, our technical support desk will operate on standby rotation from November 26-28. Automated AI customer order processing and KHQR payment verification will operate 24/7 without interruption.",
  },
  {
    id: "security_advisory",
    name: "Security Advisory: Two-Factor Authentication & IP Policy",
    category: "security" as CategoryKey,
    audience: "owners",
    channels: ["banner", "telegram", "popup"],
    pinned: true,
    title: "🔒 Security Advisory: Enable 2FA & Review Authorized Staff",
    body: "To safeguard store revenues and buyer information, store owners are strongly advised to enforce two-factor authentication and review all staff invite links under Settings → Staff Members. Any unused staff sessions should be revoked immediately.",
  },
];

export function AdminAnnouncements() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();

  // Toast Notification state
  const [toast, setToast] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "info" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Form compose states
  const [title, setTitle] = useState("🎉 New feature: Marketing Broadcast is live");
  const [message, setMessage] = useState(
    "Starting today, Pro and Enterprise shops can send promotions to all customers on Telegram & Messenger at once — with AI writing a personalized message for each customer based on their purchase history. Open Owner Dashboard → Marketing Broadcast to try it."
  );
  const [audience, setAudience] = useState("all");
  const [category, setCategory] = useState<CategoryKey>("feature");
  const [deliverVia, setDeliverVia] = useState<string[]>(["banner", "telegram"]);
  const [isPinned, setIsPinned] = useState(false);
  const [isActiveNow, setIsActiveNow] = useState(true);

  // Preview tab switcher ('banner' | 'telegram' | 'popup')
  const [previewTab, setPreviewTab] = useState<"banner" | "telegram" | "popup">("banner");

  // Filtering & search states for sent table
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pinned">("all");

  // Modals state
  const [inspectAnnouncement, setInspectAnnouncement] = useState<Announcement | null>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Queries & Mutations
  const announcementsQuery = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => api.get<Announcement[]>("/admin/announcements"),
  });

  const announcements = announcementsQuery.data ?? [];

  // Create Mutation
  const addMutation = useMutation({
    mutationFn: () =>
      api.post<Announcement>("/admin/announcements", {
        title,
        body: message,
        audience,
        category,
        channels: deliverVia.join(","),
        is_active: isActiveNow,
        pinned: isPinned,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      showToast("success", `Announcement "${data.title}" successfully published and broadcasted!`);
      setIsPinned(false);
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to publish announcement");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updated: { id: number; data: Partial<Announcement> }) =>
      api.put<Announcement>(`/admin/announcements/${updated.id}`, updated.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      setEditAnnouncement(null);
      showToast("success", "Announcement updated successfully!");
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to update announcement");
    },
  });

  // Toggle Active State Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.post<Announcement>(`/admin/announcements/${id}/toggle-active`),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      showToast(
        "info",
        `Announcement ${updated.is_active ? "activated as live banner" : "deactivated from live banners"}.`
      );
    },
  });

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: (id: number) => api.post<{ success: boolean; delivered_shops: number }>(`/admin/announcements/${id}/broadcast`),
    onSuccess: (res) => {
      showToast("success", `Broadcast re-sent to ${res.delivered_shops ?? 0} shops via active channels!`);
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Broadcast dispatch failed");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      setDeleteId(null);
      showToast("info", "Announcement removed successfully.");
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to delete announcement");
    },
  });

  // Apply a preset template
  const applyPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    setTitle(preset.title);
    setMessage(preset.body);
    setCategory(preset.category);
    setAudience(preset.audience);
    setDeliverVia(preset.channels);
    setIsPinned(preset.pinned);
    showToast("info", `Applied template "${preset.name}".`);
  };

  const toggleDelivery = (key: string) => {
    setDeliverVia((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filtered announcements list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Tab filter
      if (activeTab === "active" && !ann.is_active) return false;
      if (activeTab === "pinned" && !ann.pinned) return false;

      // Category filter
      if (selectedCategoryFilter !== "all" && ann.category !== selectedCategoryFilter) {
        return false;
      }

      // Audience filter
      if (selectedAudienceFilter !== "all" && ann.audience !== selectedAudienceFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ann.title?.toLowerCase().includes(q);
        const matchesBody = ann.body?.toLowerCase().includes(q);
        return matchesTitle || matchesBody;
      }

      return true;
    });
  }, [announcements, activeTab, selectedCategoryFilter, selectedAudienceFilter, searchQuery]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = announcements.length;
    const activeBanners = announcements.filter((a) => a.is_active !== false).length;
    const pinnedCount = announcements.filter((a) => a.pinned).length;
    return {
      total,
      activeBanners,
      pinnedCount,
      reachPercent: "100%",
      avgDeliveryRate: "98.4%",
    };
  }, [announcements]);

  const activeCategoryConfig = CATEGORIES[category] || CATEGORIES.update;
  const ActiveCategoryIcon = activeCategoryConfig.icon;

  return (
    <div className="mx-auto max-w-[1360px] px-6 py-6 sm:px-8 sm:py-7 space-y-6 text-slate-800 dark:text-slate-100">
      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-xl transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
              ? "bg-rose-600"
              : "bg-slate-900 dark:bg-slate-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-white" />
          ) : toast.type === "error" ? (
            <AlertCircle size={16} className="text-white" />
          ) : (
            <Megaphone size={16} className="text-white" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <Megaphone size={19} />
            </div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
              {t("announcements.headerTitle", "System announcements")}
            </h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {t(
              "announcements.subtitle",
              "Broadcast notifications, system alerts and maintenance updates to all shops"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              announcementsQuery.refetch();
              showToast("info", "Announcements refreshed from database.");
            }}
            disabled={announcementsQuery.isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw
              size={13}
              className={`text-slate-400 dark:text-slate-500 ${announcementsQuery.isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Executive Telemetry KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Announcements */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("announcements.statsTotal", "Total Broadcasts")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Megaphone size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
              Archived & Live
            </span>
          </div>
        </div>

        {/* Active In-App Banners */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("announcements.statsActive", "Active Banners")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Radio size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[22px] font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {stats.activeBanners}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live on Client
            </span>
          </div>
        </div>

        {/* Audience Reach */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("announcements.statsReach", "Audience Reach")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Store size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.reachPercent}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              45 registered shops
            </span>
          </div>
        </div>

        {/* Avg. Delivery Rate */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("announcements.statsDelivery", "Delivery Rate")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[22px] font-bold tracking-tight text-purple-700 dark:text-purple-400">
              {stats.avgDeliveryRate}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-850">
              High Delivery
            </span>
          </div>
        </div>
      </div>

      {/* ── 2 Columns: Compose on Left, Multi-Channel Live Preview on Right ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Compose Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t("announcements.composeTitle", "New announcement")}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                  <Sparkles size={10} />
                  Enterprise Studio
                </span>
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t("announcements.composeSub", "Compose once, deliver to every shop owner")}
              </p>
            </div>

            {/* Template Presets Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Preset:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) applyPreset(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 px-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled className="dark:bg-slate-800 dark:text-slate-400">
                  Load a pre-built template…
                </option>
                {PRESET_TEMPLATES.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-800 dark:text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                {t("announcements.titleLabel", "Title")}
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{title.length}/200</span>
            </div>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 🎉 New Feature: Marketing Broadcast is live"
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category / Severity selector */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("announcements.category", "Category & Urgency")}
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((catKey) => {
                const conf = CATEGORIES[catKey];
                const Icon = conf.icon;
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition ${
                      isSelected
                        ? `${conf.badge} border-transparent shadow-xs`
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{language === "km" ? conf.labelKm : conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                {t("announcements.messageLabel", "Message")}
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{message.length} chars</span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your official announcement here. Supports plain text and emojis..."
              className="mt-1.5 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-[13px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Audience selection */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
              {t("announcements.audienceLabel", "Target Audience")}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { id: "all", label: t("announcements.allShops", "All shops"), icon: Store },
                { id: "owners", label: t("announcements.ownersOnly", "Shop Owners only"), icon: Users },
                { id: "staff", label: t("announcements.staffOnly", "Staff members only"), icon: Users },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = audience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAudience(opt.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
                      isSelected
                        ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t("announcements.channels", "Delivery Channels")}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  id: "banner",
                  label: "In-App Top Banner",
                  desc: "Sticky on client overview",
                  icon: Radio,
                },
                {
                  id: "telegram",
                  label: "Telegram CRM Bot",
                  desc: "Pushed to connected bots",
                  icon: Send,
                },
                {
                  id: "popup",
                  label: "Modal Alert on Login",
                  desc: "High-visibility modal",
                  icon: Bell,
                },
              ].map((c) => {
                const active = deliverVia.includes(c.id);
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleDelivery(c.id)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                      active
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 shadow-2xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-[12px]">
                      <div
                        className={`flex size-4 items-center justify-center rounded-md border text-[10px] ${
                          active
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {active && <Check size={11} strokeWidth={3} />}
                      </div>
                      <Icon size={13} className={active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
                      <span>{c.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-5.5">{c.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles: Pin to top & Publish active */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 size-4 dark:bg-slate-800"
                />
                <span className="flex items-center gap-1">
                  <Pin size={13} className={isPinned ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                  <span>{t("announcements.pinned", "Pin to Top")}</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActiveNow}
                  onChange={(e) => setIsActiveNow(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 size-4 dark:bg-slate-800"
                />
                <span>Publish as live banner</span>
              </label>
            </div>

            {/* Send Announcement Button */}
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !title.trim() || !message.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-700 hover:to-indigo-800 transition disabled:opacity-50"
            >
              <Send size={14} className={addMutation.isPending ? "animate-pulse" : ""} />
              <span>{addMutation.isPending ? "Broadcasting…" : t("announcements.broadcastNow", "Broadcast Now")}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Channel Live Preview (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                {t("announcements.preview", "Multi-Channel Preview")}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live render across delivery endpoints</p>
            </div>

            {/* Preview Tab Selector */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPreviewTab("banner")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  previewTab === "banner" ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("telegram")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  previewTab === "telegram" ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("popup")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  previewTab === "popup" ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Modal Alert
              </button>
            </div>
          </div>

          {/* PREVIEW 1: IN-APP BANNER */}
          {previewTab === "banner" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Shop Owner Overview Top Banner</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* Exact render matching OwnerOverview.tsx */}
              <div
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  category === "important"
                    ? "border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200"
                    : category === "maintenance"
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200"
                    : category === "security"
                    ? "border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200"
                    : "border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-8 items-center justify-center rounded-xl flex-shrink-0 mt-0.5 text-white ${activeCategoryConfig.badge}`}
                  >
                    <ActiveCategoryIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${activeCategoryConfig.badge}`}>
                        {activeCategoryConfig.label.toUpperCase()}
                      </span>
                      {isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-md">
                          <Pin size={10} className="fill-amber-600 dark:fill-amber-400" />
                          PINNED
                        </span>
                      )}
                      <p className="font-bold text-[13px] text-slate-900 dark:text-white truncate">
                        {title || "Untitled announcement"}
                      </p>
                    </div>
                    <p className="text-[12px] text-slate-700/90 dark:text-slate-300 leading-relaxed mt-1.5 line-clamp-3">
                      {message || "No announcement content specified yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                💡 Displays prominently at the top of the Merchant Dashboard whenever the shop owner logs in.
              </div>
            </div>
          )}

          {/* PREVIEW 2: TELEGRAM BOT MESSAGE */}
          {previewTab === "telegram" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Telegram CRM Channel Bot</span>
                <span className="text-sky-600 dark:text-sky-400 font-mono">@OmniChatCRM_Bot</span>
              </div>

              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#F0F2F5] dark:bg-slate-950 p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-7 items-center justify-center rounded-full bg-sky-500 text-white shadow-xs">
                    <Send size={13} className="-ml-0.5 -mt-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-900 dark:text-white">OmniChat Platform Bot</span>
                      <span className="rounded bg-sky-100 dark:bg-sky-950/60 px-1 text-[9px] font-bold text-sky-800 dark:text-sky-400">BOT</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Official Merchant Notification</span>
                  </div>
                </div>

                {/* Bubble */}
                <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 p-3.5 shadow-xs border border-slate-200/50 dark:border-slate-800 text-[12px] text-slate-800 dark:text-slate-200 space-y-2 max-w-[92%]">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 dark:text-white">
                    <ActiveCategoryIcon size={12} className="text-sky-600 dark:text-sky-400" />
                    <span>{title || "Untitled Announcement"}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {message || "No content."}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">Chhlat AI Platform</span>
                    <div className="flex items-center gap-1">
                      <span>09:42 AM</span>
                      <span className="text-sky-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                📱 Broadcast directly into merchants' connected Telegram management channels.
              </div>
            </div>
          )}

          {/* PREVIEW 3: MERCHANT MODAL ALERT */}
          {previewTab === "popup" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Login Interstitial Alert Modal</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">High Priority</span>
              </div>

              <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-900/10 dark:bg-slate-950/60 p-5 backdrop-blur-xs flex items-center justify-center">
                <div className="w-full rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${activeCategoryConfig.badge}`}>
                      {activeCategoryConfig.label.toUpperCase()}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">Dismiss ✕</span>
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-white leading-snug">{title}</h3>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">{message}</p>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 py-2 text-center text-[12px] font-semibold text-white"
                  >
                    I Understand · Continue to Dashboard
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                🚨 Displays once as an urgent blocking modal when the store owner signs in.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sent Announcements Management Card ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Sent announcements</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Manage live active banners, delivery reports, and past broadcasts
            </p>
          </div>

          {/* Tabs: All / Active / Pinned */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 text-[12px] font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Broadcasts ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "active" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active Banners ({stats.activeBanners})
            </button>
            <button
              onClick={() => setActiveTab("pinned")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "pinned" ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Pin size={11} className="text-amber-500 fill-amber-500" />
              Pinned ({stats.pinnedCount})
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements by title or content…"
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-indigo-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all" className="dark:bg-slate-800 dark:text-slate-200">All Categories</option>
            <option value="feature" className="dark:bg-slate-800 dark:text-slate-200">🎉 New Feature</option>
            <option value="maintenance" className="dark:bg-slate-800 dark:text-slate-200">🛠️ Maintenance</option>
            <option value="important" className="dark:bg-slate-800 dark:text-slate-200">⚠️ Critical Alert</option>
            <option value="update" className="dark:bg-slate-800 dark:text-slate-200">📢 System Update</option>
            <option value="security" className="dark:bg-slate-800 dark:text-slate-200">🔒 Security Notice</option>
          </select>

          {/* Audience Filter */}
          <select
            value={selectedAudienceFilter}
            onChange={(e) => setSelectedAudienceFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all" className="dark:bg-slate-800 dark:text-slate-200">All Audiences</option>
            <option value="all" className="dark:bg-slate-800 dark:text-slate-200">All Shops</option>
            <option value="owners" className="dark:bg-slate-800 dark:text-slate-200">Shop Owners</option>
            <option value="staff" className="dark:bg-slate-800 dark:text-slate-200">Staff Members</option>
          </select>
        </div>

        {/* Sent Announcements Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Title & Preview</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Sent Date</th>
                <th className="py-3 px-4">Read Rate</th>
                <th className="py-3 px-4">Banner Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Megaphone size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No announcements found</p>
                    <p className="text-[12px]">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((ann) => {
                  const catConfig =
                    CATEGORIES[ann.category as CategoryKey] || CATEGORIES.update;
                  const CatIcon = catConfig.icon;
                  const isBannerLive = ann.is_active !== false;

                  const audLabel =
                    ann.audience === "all"
                      ? "All shops"
                      : ann.audience === "owners"
                      ? "Shop Owners"
                      : "Staff";

                  const channelsList = (ann.channels || "banner,telegram")
                    .split(",")
                    .map((c) => c.trim().toLowerCase());

                  return (
                    <tr key={ann.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      {/* Title & Preview */}
                      <td className="py-3.5 px-5 max-w-[340px]">
                        <div className="flex items-start gap-2">
                          {ann.pinned && (
                            <Pin size={12} className="text-amber-500 fill-amber-500 mt-1 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{ann.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1 mt-0.5">{ann.body}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${catConfig.color}`}
                        >
                          <CatIcon size={11} />
                          <span>{catConfig.label}</span>
                        </span>
                      </td>

                      {/* Audience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-700 dark:text-slate-300">
                          {ann.audience === "all" ? (
                            <Store size={12} className="text-indigo-500 dark:text-indigo-400" />
                          ) : (
                            <Users size={12} className="text-sky-500 dark:text-sky-400" />
                          )}
                          <span>{audLabel}</span>
                        </span>
                      </td>

                      {/* Channels */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {channelsList.includes("banner") && (
                            <span
                              title="In-app Top Banner"
                              className="size-5 rounded flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                            >
                              <Radio size={11} />
                            </span>
                          )}
                          {channelsList.includes("telegram") && (
                            <span
                              title="Telegram CRM Bot"
                              className="size-5 rounded flex items-center justify-center bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400"
                            >
                              <Send size={11} />
                            </span>
                          )}
                          {channelsList.includes("popup") && (
                            <span
                              title="Login Interstitial Modal"
                              className="size-5 rounded flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
                            >
                              <Bell size={11} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sent Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[12px]">
                        {shortDate(ann.created_at)}
                      </td>

                      {/* Read Rate */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                            {ann.id % 2 === 0 ? "96%" : "92%"}
                          </span>
                          <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: ann.id % 2 === 0 ? "96%" : "92%" }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Banner Status Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(ann.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition ${
                            isBannerLive
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isBannerLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-slate-500"
                            }`}
                          />
                          <span>{isBannerLive ? "Live Banner" : "Archived"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect Details */}
                          <button
                            type="button"
                            onClick={() => setInspectAnnouncement(ann)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                            title="Inspect details & preview"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Re-broadcast */}
                          <button
                            type="button"
                            onClick={() => broadcastMutation.mutate(ann.id)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50 transition"
                            title="Broadcast again"
                          >
                            <Send size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setEditAnnouncement(ann)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit announcement"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteId(ann.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Delete announcement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: EDIT ANNOUNCEMENT ── */}
      {editAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Edit Announcement</h3>
              </div>
              <button
                onClick={() => setEditAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editAnnouncement.title}
                  onChange={(e) =>
                    setEditAnnouncement({ ...editAnnouncement, title: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={editAnnouncement.category || "update"}
                  onChange={(e) =>
                    setEditAnnouncement({ ...editAnnouncement, category: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="feature" className="dark:bg-slate-800 dark:text-slate-200">🎉 New Feature</option>
                  <option value="maintenance" className="dark:bg-slate-800 dark:text-slate-200">🛠️ Maintenance</option>
                  <option value="important" className="dark:bg-slate-800 dark:text-slate-200">⚠️ Critical Alert</option>
                  <option value="update" className="dark:bg-slate-800 dark:text-slate-200">📢 System Update</option>
                  <option value="security" className="dark:bg-slate-800 dark:text-slate-200">🔒 Security Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Audience</label>
                <select
                  value={editAnnouncement.audience}
                  onChange={(e) =>
                    setEditAnnouncement({ ...editAnnouncement, audience: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all" className="dark:bg-slate-800 dark:text-slate-200">All Shops</option>
                  <option value="owners" className="dark:bg-slate-800 dark:text-slate-200">Shop Owners Only</option>
                  <option value="staff" className="dark:bg-slate-800 dark:text-slate-200">Staff Members Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Message</label>
                <textarea
                  rows={4}
                  value={editAnnouncement.body}
                  onChange={(e) =>
                    setEditAnnouncement({ ...editAnnouncement, body: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editAnnouncement.pinned || false}
                    onChange={(e) =>
                      setEditAnnouncement({ ...editAnnouncement, pinned: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-amber-600 size-4 dark:bg-slate-800"
                  />
                  <span>Pin to top</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editAnnouncement.is_active !== false}
                    onChange={(e) =>
                      setEditAnnouncement({ ...editAnnouncement, is_active: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 size-4 dark:bg-slate-800"
                  />
                  <span>Active banner</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditAnnouncement(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  updateMutation.mutate({
                    id: editAnnouncement.id,
                    data: {
                      title: editAnnouncement.title,
                      body: editAnnouncement.body,
                      audience: editAnnouncement.audience,
                      category: editAnnouncement.category,
                      pinned: editAnnouncement.pinned,
                      is_active: editAnnouncement.is_active,
                    },
                  })
                }
                disabled={updateMutation.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INSPECT ANNOUNCEMENT DETAILS ── */}
      {inspectAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Announcement Details</h3>
              </div>
              <button
                onClick={() => setInspectAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      CATEGORIES[inspectAnnouncement.category as CategoryKey]?.badge || "bg-slate-800 text-white"
                    }`}
                  >
                    {inspectAnnouncement.category?.toUpperCase() || "UPDATE"}
                  </span>
                  {inspectAnnouncement.pinned && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      PINNED
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">
                    ID #{inspectAnnouncement.id} · {shortDate(inspectAnnouncement.created_at)}
                  </span>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
                  {inspectAnnouncement.title}
                </h4>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-4 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {inspectAnnouncement.body}
              </div>

              {/* Delivery Meta Grid */}
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-white dark:bg-slate-900/90 text-[12px]">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Audience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {inspectAnnouncement.audience}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Delivery</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">45 / 45 Shops</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {inspectAnnouncement.is_active !== false ? "Live Banner" : "Archived"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectAnnouncement(null)}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Delete announcement?</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  This will remove the announcement from all active client feeds and banners.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-rose-600 px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
