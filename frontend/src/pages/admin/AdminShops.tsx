import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Download,
  Edit2,
  Filter,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { formatCategory, useLanguage } from "../../lib/i18n";
import type { AdminShop, Plan, ShopStatus } from "../../lib/types";
import { BrandLogo } from "../../components/ui/BrandLogo";

// Social Channel Icon Badges
function ChannelBadge({ type }: { type: "messenger" | "telegram" | "instagram" | "tiktok" | string }) {
  if (type === "messenger" || type === "facebook") {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-xs transition hover:scale-110"
        title="Facebook Messenger"
      >
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.734 7.202V22l3.39-1.86c.92.255 1.895.394 2.876.394 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.05 12.39-2.585-2.757-5.045 2.757 5.55-5.895 2.65 2.757 4.98-2.757-5.55 5.895z" />
        </svg>
      </span>
    );
  }
  if (type === "telegram") {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full overflow-hidden shadow-xs transition hover:scale-110"
        title="Telegram Bot"
      >
        <BrandLogo brand="telegram" size={24} rounded="full" />
      </span>
    );
  }
  if (type === "instagram") {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs transition hover:scale-110"
        title="Instagram Direct"
      >
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs transition hover:scale-110"
      title="TikTok Shop"
    >
      <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.48V8.71a8.28 8.28 0 0 0 4.89 1.57v-3.46a4.85 4.85 0 0 1-1-.13z" />
      </svg>
    </span>
  );
}

const CATEGORIES = [
  "Skincare & Cosmetics",
  "Fashion & Apparel",
  "Electronics & Gadgets",
  "Food & Beverage",
  "Health & Wellness",
  "Home & Living",
  "Agriculture",
  "Coffee",
  "General",
];

export function AdminShops() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"all" | "active" | "trial" | "suspended">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShop, setEditingShop] = useState<AdminShop | null>(null);
  const [deletingShop, setDeletingShop] = useState<AdminShop | null>(null);

  // Add shop form state
  const [addForm, setAddForm] = useState({
    name: "",
    slug: "",
    category: "Fashion & Apparel",
    phone: "",
    address: "",
    plan_id: "" as string | number,
    status: "active" as ShopStatus,
    ai_enabled: true,
    ai_instructions: "Polite, professional customer assistant in Khmer & English.",
    owner_name: "",
    owner_email: "",
    owner_password: "",
  });
  const [addError, setAddError] = useState("");

  // Edit shop form state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    phone: "",
    address: "",
    plan_id: "" as string | number,
    status: "active" as ShopStatus,
    ai_enabled: true,
    ai_instructions: "",
    owner_name: "",
    owner_email: "",
  });
  const [editError, setEditError] = useState("");

  // Data queries
  const apiShops = useQuery({
    queryKey: ["admin-shops"],
    queryFn: () => api.get<AdminShop[]>("/admin/shops"),
  });

  const apiPlans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.get<Plan[]>("/admin/plans"),
  });

  const shops = apiShops.data ?? [];
  const plans = apiPlans.data ?? [];

  // Mutations
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ShopStatus }) =>
      api.patch(`/admin/shops/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const createShopMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/shops", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowAddModal(false);
      setAddError("");
      setAddForm({
        name: "",
        slug: "",
        category: "Fashion & Apparel",
        phone: "",
        address: "",
        plan_id: "",
        status: "active",
        ai_enabled: true,
        ai_instructions: "Polite, professional customer assistant in Khmer & English.",
        owner_name: "",
        owner_email: "",
        owner_password: "",
      });
    },
    onError: (err: any) => {
      setAddError(err?.message || "Failed to create shop. Please verify details.");
    },
  });

  const updateShopMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      api.patch(`/admin/shops/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setEditingShop(null);
      setEditError("");
    },
    onError: (err: any) => {
      setEditError(err?.message || "Failed to update shop.");
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/shops/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setDeletingShop(null);
    },
  });

  const handleToggleSuspend = (id: number, currentStatus: ShopStatus) => {
    const newStatus: ShopStatus = currentStatus === "suspended" ? "active" : "suspended";
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleOpenEdit = (shop: AdminShop) => {
    setEditingShop(shop);
    setEditError("");
    setEditForm({
      name: shop.name,
      category: shop.category || "General",
      phone: shop.phone || "",
      address: shop.address || "",
      plan_id: shop.plan?.id ?? "",
      status: shop.status,
      ai_enabled: shop.ai_enabled ?? true,
      ai_instructions: shop.ai_instructions || "",
      owner_name: shop.owner_name || "",
      owner_email: shop.owner_email || "",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    updateShopMutation.mutate({
      id: editingShop.id,
      payload: {
        name: editForm.name.trim(),
        category: editForm.category,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        plan_id: editForm.plan_id ? Number(editForm.plan_id) : null,
        status: editForm.status,
        ai_enabled: editForm.ai_enabled,
        ai_instructions: editForm.ai_instructions,
        owner_name: editForm.owner_name.trim() || null,
        owner_email: editForm.owner_email.trim() || null,
      },
    });
  };

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError("Shop name is required");
      return;
    }
    createShopMutation.mutate({
      name: addForm.name.trim(),
      slug: addForm.slug.trim() || undefined,
      category: addForm.category,
      phone: addForm.phone.trim() || undefined,
      address: addForm.address.trim() || undefined,
      plan_id: addForm.plan_id ? Number(addForm.plan_id) : undefined,
      status: addForm.status,
      ai_enabled: addForm.ai_enabled,
      ai_instructions: addForm.ai_instructions,
      owner_name: addForm.owner_name.trim() || undefined,
      owner_email: addForm.owner_email.trim() || undefined,
      owner_password: addForm.owner_password || undefined,
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    if (shops.length === 0) return;
    const headers = [
      "ID",
      "Shop Name",
      "Slug",
      "Category",
      "Owner Name",
      "Owner Email",
      "Phone",
      "Plan",
      "Status",
      "Channels",
      "Messages / Mo",
      "Revenue ($)",
      "Next Bill",
      "AI Enabled",
    ];

    const rows = filteredShops.map((s) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.slug,
      `"${(s.category || "").replace(/"/g, '""')}"`,
      `"${(s.owner_name || "").replace(/"/g, '""')}"`,
      s.owner_email || "",
      s.phone || "",
      s.plan?.name || "Free",
      s.status,
      `"${(s.channels || []).join(", ")}"`,
      s.messages_count ?? 0,
      (s.revenue ?? 0).toFixed(2),
      s.next_bill || "—",
      s.ai_enabled ? "Yes" : "No",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chhlat_shops_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = shops.length;
    const active = shops.filter((s) => s.status === "active").length;
    const trial = shops.filter((s) => s.status === "trial").length;
    const suspended = shops.filter((s) => s.status === "suspended").length;
    const totalRev = shops.reduce((acc, s) => acc + (s.revenue || 0), 0);
    const totalMsgs = shops.reduce((acc, s) => acc + (s.messages_count || 0), 0);
    return { total, active, trial, suspended, totalRev, totalMsgs };
  }, [shops]);

  // Filtering
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (tab === "active" && s.status !== "active") return false;
      if (tab === "trial" && s.status !== "trial") return false;
      if (tab === "suspended" && s.status !== "suspended") return false;
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSlug = s.slug.toLowerCase().includes(q);
        const matchOwner = s.owner_name?.toLowerCase().includes(q);
        const matchEmail = s.owner_email?.toLowerCase().includes(q);
        const matchCat = s.category?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchOwner && !matchEmail && !matchCat) return false;
      }
      return true;
    });
  }, [shops, tab, selectedCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 sm:px-8 sm:py-8 space-y-7">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Store size={20} />
            </div>
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("shops.title", "Shops management")}
            </h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {t("shops.subtitle", "All merchant accounts, subscription tiers, and connected channels")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={shops.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-50 transition cursor-pointer"
          >
            <Download size={15} className="text-slate-400 dark:text-slate-500" />
            <span>{t("shops.exportCsv", "Export CSV")}</span>
          </button>

          <button
            onClick={() => {
              setAddError("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus size={15} />
            <span>{t("shops.addShop", "Add shop")}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Stores */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("shops.kpi.totalShops", "Total Stores")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Building2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {metrics.total}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Platform-wide merchants</span>
          </p>
        </div>

        {/* Active Stores */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("shops.kpi.activeMerchants", "Active Merchants")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {metrics.active}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}% of stores active` : "0%"}
          </p>
        </div>

        {/* Trial Stores */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("shops.kpi.inTrial", "In Trial")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <Sparkles size={15} />
            </div>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-sky-600 dark:text-sky-400">
            {metrics.trial}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Evaluating platform</p>
        </div>

        {/* Suspended Stores */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("shops.kpi.suspended", "Suspended")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={15} />
            </div>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {metrics.suspended}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Paused / Delinquent</p>
        </div>

        {/* Volume / Revenue */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("shops.kpi.totalRevenue", "Merchant Volume")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <DollarSign size={15} />
            </div>
          </div>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ${metrics.totalRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {metrics.totalMsgs.toLocaleString()} total messages
          </p>
        </div>
      </div>

      {/* ── Filter Tabs & Search Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: t("shops.all", "All shops"), count: metrics.total },
            { id: "active", label: t("shops.active", "Active"), count: metrics.active },
            { id: "trial", label: t("shops.trial", "Trial"), count: metrics.trial },
            { id: "suspended", label: t("shops.suspended", "Suspended"), count: metrics.suspended },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setTab(pill.id as any)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                tab === pill.id
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-medium ${
                  tab === pill.id
                    ? "bg-slate-800 dark:bg-indigo-700 text-slate-200"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-8 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat, language)}
                </option>
              ))}
            </select>
            <Filter size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t("shops.searchPlaceholder", "Search shops, slugs, or owners…")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8.5 pr-8 py-1.5 text-[12px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs focus:border-indigo-500 focus:outline-none transition"
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
        </div>
      </div>

      {/* ── Shops Table Card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAFC]/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">{t("shops.table.shop", "Shop")}</th>
                <th className="py-3.5 px-6">Owner</th>
                <th className="py-3.5 px-6">{t("shops.table.plan", "Plan")}</th>
                <th className="py-3.5 px-6">{t("shops.table.channels", "Channels")}</th>
                <th className="py-3.5 px-6">{t("shops.table.msgs", "Msgs / Month")}</th>
                <th className="py-3.5 px-6">{t("shops.table.nextBill", "Next Bill")}</th>
                <th className="py-3.5 px-6">{t("shops.table.status", "Status")}</th>
                <th className="py-3.5 px-6 text-right">{t("shops.table.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {apiShops.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <RefreshCw size={16} className="animate-spin text-indigo-600" />
                      <span>Loading merchant stores…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="mx-auto max-w-xs">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                        <Store size={22} />
                      </div>
                      <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">No shops found</p>
                      <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">
                        {t("shops.noShops", "No shops found matching your filter criteria.")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition group">
                    {/* Shop Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold shadow-xs ${
                            shop.avatar_bg ?? "bg-indigo-600 text-white"
                          }`}
                        >
                          {shop.initials ?? shop.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{shop.name}</span>
                            {shop.ai_enabled && (
                              <span
                                className="flex size-4 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                                title="AI Assistant Active"
                              >
                                <Sparkles size={10} />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              /{shop.slug}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              • {formatCategory(shop.category, language)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="py-4 px-6">
                      <div className="text-[12px]">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{shop.owner_name || "Merchant Owner"}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          <span>{shop.owner_email || `owner@${shop.slug}.kh`}</span>
                        </p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          shop.plan?.name === "Enterprise"
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60"
                            : shop.plan?.name === "Pro"
                            ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/60"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                        }`}
                      >
                        {shop.plan?.name ?? "Free"}
                      </span>
                    </td>

                    {/* Channels */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        {(shop.channels && shop.channels.length > 0
                          ? shop.channels
                          : ["telegram"]
                        ).map((ch) => (
                          <ChannelBadge key={ch} type={ch} />
                        ))}
                      </div>
                    </td>

                    {/* Msgs / Month */}
                    <td className="py-4 px-6">
                      <div className="font-mono text-[12px] font-medium text-slate-700 dark:text-slate-300">
                        {(shop.messages_count ?? 1206).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        ${(shop.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })} rev
                      </div>
                    </td>

                    {/* Next Bill */}
                    <td className="py-4 px-6 text-[12px]">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {shop.next_bill ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {shop.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                      {shop.status === "trial" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
                          <span className="size-1.5 rounded-full bg-sky-500" />
                          Trial
                        </span>
                      )}
                      {shop.status === "suspended" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(shop)}
                          title="Edit Store"
                          className="flex items-center gap-1 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                        >
                          <Edit2 size={12} className="text-slate-400 dark:text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* Suspend / Reactivate */}
                        {shop.status === "suspended" ? (
                          <button
                            onClick={() => handleToggleSuspend(shop.id, shop.status)}
                            title="Reactivate Store"
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleSuspend(shop.id, shop.status)}
                            title="Suspend Store"
                            className="flex items-center gap-1 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-[12px] font-medium text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/60 transition cursor-pointer"
                          >
                            <Ban size={12} className="text-slate-400 dark:text-slate-500 group-hover:text-rose-500" />
                            <span>Suspend</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingShop(shop)}
                          title="Delete Store"
                          className="flex size-7 items-center justify-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-2xs hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/60 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50">
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredShops.length}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{shops.length}</span> merchant stores
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">All data synced live</span>
          </div>
        </div>
      </div>

      {/* ── Add Shop Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">
                    {t("shops.createTitle", "Register Merchant Store")}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    {t("shops.createSubtitle", "Create an organization, assign plan tier, and configure primary owner")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateShop} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {addError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 p-3 text-[12px] text-rose-700 dark:text-rose-400">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Store Profile Section */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Store Profile & Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.name", "Shop Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phnom Penh Silk & Crafts"
                      value={addForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                        setAddForm((prev) => ({ ...prev, name, slug: prev.slug === "" || prev.slug.startsWith(name.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-")) ? slug : prev.slug }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.slug", "URL Slug")}
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[12px] mr-1">chhlat.ai/</span>
                      <input
                        type="text"
                        placeholder="phnom-penh-silk"
                        value={addForm.slug}
                        onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                        className="w-full bg-transparent font-mono text-[12px] text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.category", "Business Category")}
                    </label>
                    <select
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {formatCategory(cat, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.phone", "Phone Number")}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +855 12 345 678"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("shops.address", "Physical Address")}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #45, St 271, Sangkat Toul Tumpoung, Phnom Penh"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Primary Owner Credentials Section */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Primary Merchant Owner Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.ownerName", "Primary Owner Name")}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Serey Vathanak"
                      value={addForm.owner_name}
                      onChange={(e) => setAddForm({ ...addForm, owner_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.ownerEmail", "Owner Gmail / Email")}
                    </label>
                    <input
                      type="email"
                      placeholder="vathanak.store@gmail.com"
                      value={addForm.owner_email}
                      onChange={(e) => setAddForm({ ...addForm, owner_email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.ownerPassword", "Initial Password")}
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for Chhlat@2026"
                      value={addForm.owner_password}
                      onChange={(e) => setAddForm({ ...addForm, owner_password: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Account Status Section */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Subscription Tier & Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.plan", "Subscription Tier")}
                    </label>
                    <select
                      value={addForm.plan_id}
                      onChange={(e) => setAddForm({ ...addForm, plan_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Default (Free Tier)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price_monthly}/mo ({p.ai_replies_limit} AI replies)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.status", "Account Status")}
                    </label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value as ShopStatus })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="active">Active (Full Operation)</option>
                      <option value="trial">Trial (Evaluation Mode)</option>
                      <option value="suspended">Suspended (Restricted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Configuration Section */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      AI Assistant Configuration
                    </h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Enable automatic bot replies for this merchant</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.ai_enabled}
                      onChange={(e) => setAddForm({ ...addForm, ai_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("shops.aiInstructions", "AI Prompt / Instructions")}
                  </label>
                  <textarea
                    rows={2}
                    value={addForm.ai_instructions}
                    onChange={(e) => setAddForm({ ...addForm, ai_instructions: e.target.value })}
                    placeholder="Instructions for the AI assistant when answering customer queries..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t("shops.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createShopMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {createShopMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                  <span>{t("shops.createShop", "Create Store")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Shop Modal ── */}
      {editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">
                    {t("shops.editTitle", "Edit Merchant Store")}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    {editingShop.name} (/{editingShop.slug})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingShop(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {editError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 p-3 text-[12px] text-rose-700 dark:text-rose-400">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Store Profile */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Store Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.name", "Shop Name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.category", "Business Category")}
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {formatCategory(cat, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.phone", "Phone Number")}
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.address", "Physical Address")}
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Primary Owner Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.ownerName", "Primary Owner Name")}
                    </label>
                    <input
                      type="text"
                      value={editForm.owner_name}
                      onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.ownerEmail", "Owner Gmail / Email")}
                    </label>
                    <input
                      type="email"
                      value={editForm.owner_email}
                      onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Account Status */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Subscription Tier & Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.plan", "Subscription Tier")}
                    </label>
                    <select
                      value={editForm.plan_id}
                      onChange={(e) => setEditForm({ ...editForm, plan_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Default (Free Tier)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price_monthly}/mo ({p.ai_replies_limit} AI replies)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("shops.status", "Account Status")}
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ShopStatus })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="active">Active (Full Operation)</option>
                      <option value="trial">Trial (Evaluation Mode)</option>
                      <option value="suspended">Suspended (Restricted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Configuration */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      AI Assistant Configuration
                    </h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Enable automatic bot replies for this merchant</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.ai_enabled}
                      onChange={(e) => setEditForm({ ...editForm, ai_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("shops.aiInstructions", "AI Prompt / Instructions")}
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.ai_instructions}
                    onChange={(e) => setEditForm({ ...editForm, ai_instructions: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12px] text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t("shops.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={updateShopMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {updateShopMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                  <span>{t("shops.saveChanges", "Save Changes")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">
                  {t("shops.deleteShop", "Delete Store")}
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  {deletingShop.name} (ID: #{deletingShop.id})
                </p>
              </div>
            </div>

            <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("shops.deleteConfirm", "Are you sure you want to permanently delete this shop and its associated data?")}
            </p>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-3 text-[11px] text-slate-500 dark:text-slate-400">
              This will remove all associated products, channel configurations, and team roles for this shop.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingShop(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t("shops.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={deleteShopMutation.isPending}
                onClick={() => deleteShopMutation.mutate(deletingShop.id)}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 transition"
              >
                {deleteShopMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                <span>Delete Store</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
