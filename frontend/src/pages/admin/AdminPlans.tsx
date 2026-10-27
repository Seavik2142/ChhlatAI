import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  FileText,
  Layers,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../lib/i18n";
import type { AdminShop, PaymentHistoryItem, Plan, SubscriptionCoupon } from "../../lib/types";

export function AdminPlans() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modals state
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistoryItem | null>(null);
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<Plan | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<PaymentHistoryItem | null>(null);

  // Coupon state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SubscriptionCoupon | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<SubscriptionCoupon | null>(null);
  const [couponFilter, setCouponFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // Queries
  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.get<Plan[]>("/admin/plans"),
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => api.get<PaymentHistoryItem[]>("/admin/payments"),
  });

  const shopsQuery = useQuery({
    queryKey: ["admin-shops"],
    queryFn: () => api.get<AdminShop[]>("/admin/shops"),
  });

  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<SubscriptionCoupon[]>("/admin/coupons"),
  });

  const plans = plansQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const shops = shopsQuery.data ?? [];
  const coupons = couponsQuery.data ?? [];

  // Mutations
  const updatePaymentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/payments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payments"] }),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => api.del(`/admin/payments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      setDeleteConfirmInvoice(null);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setDeleteConfirmPlan(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to delete plan");
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => api.del(`/admin/coupons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteConfirmCoupon(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || "Failed to delete coupon");
    },
  });

  const toggleCouponStatusMutation = useMutation({
    mutationFn: (cpn: SubscriptionCoupon) =>
      api.put(`/admin/coupons/${cpn.id}`, { ...cpn, is_active: !cpn.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const toggleInvoiceStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Overdue" : "Paid";
    updatePaymentStatus.mutate({ id, status: nextStatus });
  };

  // KPIs Calculations
  const metrics = useMemo(() => {
    let totalMRR = 0;
    let activeSubs = 0;
    plans.forEach((p) => {
      const count = p.shops_count ?? 0;
      activeSubs += count;
      totalMRR += count * p.price_monthly;
    });

    let collectedThisMonth = 0;
    let outstandingAmount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    payments.forEach((p) => {
      const num = parseFloat(p.amount.replace(/[^0-9.]/g, "")) || 0;
      if (p.status.toLowerCase() === "paid") {
        collectedThisMonth += num;
        paidCount++;
      } else if (p.status.toLowerCase() === "overdue") {
        outstandingAmount += num;
        overdueCount++;
      }
    });

    return {
      totalMRR,
      activeSubs,
      collectedThisMonth,
      outstandingAmount,
      paidCount,
      overdueCount,
    };
  }, [plans, payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus =
        filterStatus === "all" || p.status.toLowerCase() === filterStatus.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.shop.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [payments, filterStatus, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Invoice ID", "Shop", "Plan", "Payment Method", "Date", "Amount", "Status", "Reference"];
    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${p.shop}"`,
      `"${p.plan}"`,
      `"${p.method}"`,
      `"${p.date}"`,
      `"${p.amount}"`,
      `"${p.status}"`,
      `"${p.reference || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chhlat_billing_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8 space-y-8 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("plans.title", "Subscriptions & billing")}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Billing
            </span>
          </div>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
            {t("plans.subtitle", "Pricing tiers and each shop owner's payment history")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCoupon(null);
              setIsCouponModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 px-3.5 py-2 text-[13px] font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer active:scale-95"
          >
            <Tag size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t("plans.newCoupon", "New Coupon")}</span>
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer active:scale-95"
          >
            <Receipt size={15} className="text-slate-500 dark:text-slate-400" />
            <span>{t("plans.recordPayment", "Record Payment")}</span>
          </button>

          <button
            onClick={() => {
              setEditingPlan(null);
              setIsPlanModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 transition cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>{t("plans.newTier", "New pricing tier")}</span>
          </button>
        </div>
      </div>

      {/* ── Executive Billing KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: MRR */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("plans.mrr", "Monthly Recurring Revenue")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ${metrics.totalMRR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={13} />
              +14.2%
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">Projected normalized monthly run rate</p>
        </div>

        {/* KPI 2: Active Subscriptions */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("plans.activeSubs", "Active Subscriptions")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Store size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {metrics.activeSubs}
            </span>
            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">merchants enrolled</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {plans.map((p) => (
              <span key={p.code} className="inline-flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{p.shops_count ?? 0}</span> {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* KPI 3: Collected This Month */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("plans.collected", "Collected This Month")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ${metrics.collectedThisMonth.toFixed(2)}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {metrics.paidCount} Paid
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">Reconciled via ABA KHQR & Bakong</p>
        </div>

        {/* KPI 4: Outstanding / Overdue */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("plans.outstanding", "Outstanding / Overdue")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold tracking-tight text-amber-700 dark:text-amber-400">
              ${metrics.outstandingAmount.toFixed(2)}
            </span>
            {metrics.overdueCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                {metrics.overdueCount} Pending
              </span>
            ) : (
              <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium">All cleared</span>
            )}
          </div>
          <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">Requires merchant payment follow-up</p>
        </div>
      </div>

      {/* ── Pricing Tiers Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">Subscription Tiers</h2>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
              Configured AI message volumes, seats, channels and features per pricing plan
            </p>
          </div>
          <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
            {plans.length} active tier{plans.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isFeatured = plan.code.toLowerCase() === "pro" || plan.name.toLowerCase() === "pro";
            const isEnterprise = plan.code.toLowerCase() === "enterprise";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 p-6 transition hover:shadow-md ${
                  isFeatured
                    ? "border-2 border-indigo-600 shadow-sm shadow-indigo-600/10 ring-4 ring-indigo-50 dark:ring-indigo-950/30"
                    : "border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Top Badge */}
                {isFeatured && (
                  <div className="absolute -top-3 left-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-white shadow-xs">
                      <Sparkles size={11} />
                      {t("plans.mostPopular", "Most popular")}
                    </span>
                  </div>
                )}
                {isEnterprise && (
                  <div className="absolute -top-3 left-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 dark:bg-slate-800 border dark:border-slate-700 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-white shadow-xs">
                      <ShieldCheck size={11} />
                      Enterprise Scale
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {plan.code}
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                        {plan.code === "free"
                          ? "For testing AI automation & single store onboarding"
                          : plan.code === "pro"
                          ? "For high-volume Facebook & Telegram sales"
                          : "For multi-brand retailers & omnichannel enterprises"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsPlanModalOpen(true);
                        }}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition cursor-pointer"
                        title={t("plans.edit", "Edit plan")}
                      >
                        <Edit2 size={13} />
                      </button>

                      {plan.shops_count === 0 && (
                        <button
                          onClick={() => setDeleteConfirmPlan(plan)}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer"
                          title={t("plans.deleteTier", "Delete plan")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-[36px] font-black tracking-tight text-slate-900 dark:text-slate-100">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
                      {t("plans.month", "/ month")}
                    </span>
                  </div>

                  {/* Quotas Quick Strip */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">AI Replies</span>
                      <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                        {plan.ai_replies_limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-x border-slate-200/60 dark:border-slate-700">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Seats</span>
                      <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                        {plan.staff_seats >= 999 ? "Unlimited" : plan.staff_seats}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Channels</span>
                      <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                        {plan.channels_limit >= 99 ? "All" : plan.channels_limit}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-5 space-y-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span className="text-[12.5px] leading-tight text-slate-700 dark:text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: active stores */}
                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Store size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{plan.shops_count ?? 0}</span>
                    <span>{t("plans.shopsCount", "shops on this plan")}</span>
                  </div>

                  <span
                    className={`inline-block size-2 rounded-full ${
                      (plan.shops_count ?? 0) > 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Subscription Coupons & Discounts Section ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900/50">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                <Tag size={16} />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">
                {t("plans.couponsTitle", "Subscription Coupons & Discounts")}
              </h2>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {coupons.filter((c) => c.is_active).length} Active
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
              {t("plans.couponsSub", "Promotional codes, seasonal vouchers, and merchant discount campaigns")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 text-[12px] font-medium text-slate-600 dark:text-slate-400">
              {(["all", "active", "inactive"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setCouponFilter(st)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition cursor-pointer ${
                    couponFilter === st
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-2xs"
                      : "hover:text-slate-900 dark:hover:text-slate-200 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st === "all" ? `All (${coupons.length})` : st === "active" ? `Active (${coupons.filter(c => c.is_active).length})` : `Inactive (${coupons.filter(c => !c.is_active).length})`}
                </button>
              ))}
            </div>

            {/* Create Coupon Button */}
            <button
              onClick={() => {
                setEditingCoupon(null);
                setIsCouponModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>{t("plans.newCoupon", "New Coupon")}</span>
            </button>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="p-6">
          {coupons.filter((c) => {
            if (couponFilter === "active") return c.is_active;
            if (couponFilter === "inactive") return !c.is_active;
            return true;
          }).length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Ticket size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-300">No discount coupons found</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                {couponFilter !== "all"
                  ? "Try switching to the 'All' tab or create a new coupon"
                  : "Create promotional codes to offer subscription discounts to store owners"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons
                .filter((c) => {
                  if (couponFilter === "active") return c.is_active;
                  if (couponFilter === "inactive") return !c.is_active;
                  return true;
                })
                .map((coupon) => {
                  const isPercent = coupon.discount_type === "percent";
                  const usesRatio = coupon.max_uses ? Math.min(100, Math.round(((coupon.used_count || 0) / coupon.max_uses) * 100)) : null;

                  return (
                    <div
                      key={coupon.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 transition hover:shadow-md ${
                        coupon.is_active
                          ? "border-emerald-200/90 dark:border-emerald-800/60 bg-white dark:bg-slate-900 ring-1 ring-emerald-50 dark:ring-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 opacity-80"
                      }`}
                    >
                      <div>
                        {/* Top Row: Code + Copy + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                            <span className="font-mono text-[13px] font-extrabold tracking-wider text-slate-900 dark:text-slate-100">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                setCopiedCouponCode(coupon.code);
                                setTimeout(() => setCopiedCouponCode(null), 2000);
                              }}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="Copy coupon code"
                            >
                              {copiedCouponCode === coupon.code ? (
                                <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                                coupon.is_active
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {coupon.is_active && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              {coupon.is_active ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        {/* Discount Banner */}
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-[28px] font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                            {isPercent ? `${coupon.discount_value}%` : `$${coupon.discount_value.toFixed(2)}`}
                          </span>
                          <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            OFF
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {coupon.name}
                        </p>

                        {/* Applicable Tier & Validity Details */}
                        <div className="mt-3.5 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11.5px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 dark:text-slate-500">Valid For:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10.5px]">
                              {coupon.applicable_plan === "all"
                                ? "All Subscription Tiers"
                                : `${coupon.applicable_plan.toUpperCase()} Tier Only`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 dark:text-slate-500">Expiration:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {coupon.valid_until ? `Until ${coupon.valid_until}` : "Never expires"}
                            </span>
                          </div>

                          {/* Usage Progress */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-400 dark:text-slate-500">Redemptions:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {coupon.used_count || 0}
                                {coupon.max_uses ? ` / ${coupon.max_uses}` : " (Unlimited)"}
                              </span>
                            </div>
                            {coupon.max_uses && (
                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${usesRatio}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => toggleCouponStatusMutation.mutate(coupon)}
                          className={`text-[11.5px] font-semibold transition cursor-pointer ${
                            coupon.is_active ? "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                          }`}
                        >
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsCouponModalOpen(true);
                            }}
                            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer"
                            title="Edit coupon"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCoupon(coupon)}
                            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment History & Invoices Ledger ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {/* Ledger Header & Toolbar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">
                {t("plans.history", "Payment history")}
              </h2>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {filteredPayments.length} records
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("plans.invoicesSub", "Recent merchant subscription billing transactions")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("plans.searchPlaceholder", "Search by shop, invoice #, or method...")}
                className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 pl-8 pr-3 text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 text-[12px] font-medium text-slate-600 dark:text-slate-400">
              {["all", "paid", "overdue", "failed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition cursor-pointer ${
                    filterStatus === st
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-2xs"
                      : "hover:text-slate-900 dark:hover:text-slate-200 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st === "all" ? t("plans.allStatuses", "All") : st}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer active:scale-95"
              title="Download CSV report"
            >
              <Download size={13} className="text-slate-500 dark:text-slate-400" />
              <span>{t("plans.export", "Export CSV")}</span>
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50/75 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Invoice</th>
                <th className="py-3.5 px-6">Shop & Merchant</th>
                <th className="py-3.5 px-6">Plan</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Billing Date</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">No invoices found</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Try adjusting your filters or search keywords</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPaid = p.status.toLowerCase() === "paid";
                  const isOverdue = p.status.toLowerCase() === "overdue";
                  const isFailed = p.status.toLowerCase() === "failed";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition group">
                      {/* Invoice ID */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="font-mono text-[12px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{p.id}</span>
                          <Receipt size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Shop */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.shop}</div>
                        {p.shop_id && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">Shop ID #{p.shop_id}</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold ${
                            p.plan.toLowerCase() === "enterprise"
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                              : p.plan.toLowerCase() === "pro"
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {p.plan}
                        </span>
                      </td>

                      {/* Method & Ref */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-[12.5px]">
                          <CreditCard size={13} className="text-slate-400 dark:text-slate-500" />
                          <span>{p.method}</span>
                        </div>
                        {p.reference && (
                          <span className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            Ref: {p.reference}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                          <span>{p.date}</span>
                        </div>
                      </td>

                      {/* Amount & Coupon Badge */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-[13.5px] text-slate-900 dark:text-slate-100">
                          {p.amount}
                        </div>
                        {p.coupon_code && (
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                              title={`Original: ${p.original_amount || p.amount}, Discount: ${p.discount_amount || ''}`}
                            >
                              <Tag size={9} />
                              {p.coupon_code}
                            </span>
                            {p.discount_amount && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                (-{p.discount_amount})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {t("plans.statusPaid", "Paid")}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t("plans.statusOverdue", "Overdue")}
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            {t("plans.statusFailed", "Failed")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                            title="View official receipt"
                          >
                            Receipt
                          </button>

                          <button
                            onClick={() => toggleInvoiceStatus(p.id, p.status)}
                            className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition cursor-pointer ${
                              isPaid
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-800/60"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/60"
                            }`}
                          >
                            {isPaid ? "Mark Overdue" : "Mark Paid"}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmInvoice(p)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition cursor-pointer"
                            title="Delete invoice record"
                          >
                            <Trash2 size={13} />
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: Pricing Tier Form (Create / Edit) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isPlanModalOpen && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => {
            setIsPlanModalOpen(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setIsPlanModalOpen(false);
            setEditingPlan(null);
            qc.invalidateQueries({ queryKey: ["admin-plans"] });
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: Record Payment / Create Invoice Form ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isInvoiceModalOpen && (
        <InvoiceFormModal
          shops={shops}
          plans={plans}
          coupons={coupons}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            qc.invalidateQueries({ queryKey: ["admin-payments"] });
            qc.invalidateQueries({ queryKey: ["admin-coupons"] });
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: Subscription Coupon Form (Create / Edit) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isCouponModalOpen && (
        <CouponFormModal
          coupon={editingCoupon}
          plans={plans}
          onClose={() => {
            setIsCouponModalOpen(false);
            setEditingCoupon(null);
          }}
          onSuccess={() => {
            setIsCouponModalOpen(false);
            setEditingCoupon(null);
            qc.invalidateQueries({ queryKey: ["admin-coupons"] });
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 4: Official Printable Receipt Preview ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <ReceiptModal
          item={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 4: Delete Confirmation Dialog ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {deleteConfirmInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Delete Invoice Record</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Invoice: {deleteConfirmInvoice.id}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-slate-600 dark:text-slate-300">
              Are you sure you want to delete this invoice record for{" "}
              <strong className="text-slate-900 dark:text-white">{deleteConfirmInvoice.shop}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmInvoice(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePaymentMutation.mutate(deleteConfirmInvoice.id)}
                disabled={deletePaymentMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletePaymentMutation.isPending ? "Deleting..." : "Delete Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Delete Pricing Tier</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Plan: {deleteConfirmPlan.name}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the plan <strong className="text-slate-900 dark:text-white">{deleteConfirmPlan.name}</strong>?
              Ensure no active merchants are subscribed to this tier.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmPlan(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePlanMutation.mutate(deleteConfirmPlan.id)}
                disabled={deletePlanMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletePlanMutation.isPending ? "Deleting..." : "Delete Tier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Delete Discount Coupon</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Coupon: {deleteConfirmCoupon.code}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete coupon{" "}
              <strong className="text-slate-900 dark:text-white">{deleteConfirmCoupon.code}</strong> ({deleteConfirmCoupon.name})?
              Merchants will no longer be able to apply this discount.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmCoupon(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCouponMutation.mutate(deleteConfirmCoupon.id)}
                disabled={deleteCouponMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteCouponMutation.isPending ? "Deleting..." : "Delete Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent 1: PlanFormModal (Create / Edit Pricing Tier)
// ─────────────────────────────────────────────────────────────────────────────
interface PlanFormModalProps {
  plan: Plan | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PlanFormModal({ plan, onClose, onSuccess }: PlanFormModalProps) {
  const isEdit = !!plan;
  const [name, setName] = useState(plan?.name ?? "");
  const [code, setCode] = useState(plan?.code ?? "");
  const [priceMonthly, setPriceMonthly] = useState<number>(plan?.price_monthly ?? 29);
  const [aiRepliesLimit, setAiRepliesLimit] = useState<number>(plan?.ai_replies_limit ?? 10000);
  const [staffSeats, setStaffSeats] = useState<number>(plan?.staff_seats ?? 5);
  const [channelsLimit, setChannelsLimit] = useState<number>(plan?.channels_limit ?? 4);
  const [features, setFeatures] = useState<string[]>(
    plan?.features ?? [
      "All 4 channels (FB, Telegram, IG, TikTok)",
      "10,000 AI replies / month",
      "5 staff seats",
      "Bakong & ABA KHQR",
    ]
  );
  const [newFeatureText, setNewFeatureText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit && plan) {
        return api.put(`/admin/plans/${plan.id}`, data);
      }
      return api.post("/admin/plans", data);
    },
    onSuccess,
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to save pricing tier");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please specify a plan name");
      return;
    }
    if (!code.trim()) {
      setError("Please specify a code identifier (e.g. starter, pro)");
      return;
    }
    if (priceMonthly < 0) {
      setError("Price cannot be negative");
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      price_monthly: priceMonthly,
      ai_replies_limit: aiRepliesLimit,
      staff_seats: staffSeats,
      channels_limit: channelsLimit,
      features,
    });
  };

  const handleAddFeature = () => {
    if (newFeatureText.trim() && !features.includes(newFeatureText.trim())) {
      setFeatures([...features, newFeatureText.trim()]);
      setNewFeatureText("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">
                {isEdit ? `Edit Pricing Tier: ${plan.name}` : "Create New Pricing Tier"}
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Configure quotas, features, and billing pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-[12.5px] font-medium text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Plan Name */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEdit && !code) {
                    setCode(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                  }
                }}
                placeholder="e.g. Pro Plus"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Code identifier */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code / Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. pro_plus"
                required
                className="w-full font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Monthly Price */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price / Month ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-3 py-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Staff seats */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Staff Seats
              </label>
              <input
                type="number"
                min="1"
                value={staffSeats}
                onChange={(e) => setStaffSeats(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Channels limit */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Channels Limit
              </label>
              <input
                type="number"
                min="1"
                value={channelsLimit}
                onChange={(e) => setChannelsLimit(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* AI Reply Quota with Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                Monthly AI Replies Limit
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 dark:text-slate-500">Presets:</span>
                {[500, 10000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAiRepliesLimit(preset)}
                    className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="500"
              value={aiRepliesLimit}
              onChange={(e) => setAiRepliesLimit(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] font-mono text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Features Highlights List */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Plan Features Checklist
            </label>
            <div className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 text-[12.5px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Feature input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Type a feature and press Enter or Add..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[12.5px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : isEdit ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent 2: InvoiceFormModal (Record Payment / Create Invoice)
// ─────────────────────────────────────────────────────────────────────────────
interface InvoiceFormModalProps {
  shops: AdminShop[];
  plans: Plan[];
  coupons?: SubscriptionCoupon[];
  onClose: () => void;
  onSuccess: () => void;
}

function InvoiceFormModal({ shops, plans, coupons, onClose, onSuccess }: InvoiceFormModalProps) {
  const [shopName, setShopName] = useState(shops[0]?.name ?? "Glow Skin Cambodia");
  const [shopId, setShopId] = useState<number | undefined>(shops[0]?.id ?? 1);
  const [planName, setPlanName] = useState("Pro");
  const [method, setMethod] = useState("ABA KHQR");
  const [amount, setAmount] = useState("$49.00");
  const [status, setStatus] = useState("Paid");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  });
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponAppliedSuccess, setCouponAppliedSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/payments", data),
    onSuccess,
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to create invoice record");
    },
  });

  const applyCoupon = (codeToApply: string, planToUse = planName, basePriceToUse?: number) => {
    setCouponError(null);
    setCouponAppliedSuccess(null);
    const matched = plans.find((p) => p.name.toLowerCase() === planToUse.toLowerCase());
    const basePrice = basePriceToUse !== undefined ? basePriceToUse : (matched ? matched.price_monthly : 49);

    if (!codeToApply.trim()) {
      setSelectedCouponCode("");
      setCouponDiscountAmount(0);
      setAmount(`$${basePrice.toFixed(2)}`);
      return;
    }
    const clean = codeToApply.trim().toUpperCase();
    const cpn = (coupons || []).find((c) => c.code.toUpperCase() === clean);
    if (!cpn) {
      setCouponError(`Coupon code "${clean}" not found`);
      setSelectedCouponCode("");
      setCouponDiscountAmount(0);
      setAmount(`$${basePrice.toFixed(2)}`);
      return;
    }
    if (!cpn.is_active) {
      setCouponError(`Coupon "${clean}" is currently inactive`);
      setSelectedCouponCode("");
      setCouponDiscountAmount(0);
      setAmount(`$${basePrice.toFixed(2)}`);
      return;
    }
    if (cpn.applicable_plan !== "all" && matched) {
      if (cpn.applicable_plan.toLowerCase() !== matched.code.toLowerCase()) {
        setCouponError(`Coupon "${clean}" is only valid for ${cpn.applicable_plan.toUpperCase()} tier`);
        setSelectedCouponCode("");
        setCouponDiscountAmount(0);
        setAmount(`$${basePrice.toFixed(2)}`);
        return;
      }
    }
    let disc = 0;
    if (cpn.discount_type === "percent") {
      disc = basePrice * (cpn.discount_value / 100);
    } else {
      disc = Math.min(basePrice, cpn.discount_value);
    }
    const finalAmt = Math.max(0, basePrice - disc);
    setSelectedCouponCode(clean);
    setCouponDiscountAmount(disc);
    setAmount(`$${finalAmt.toFixed(2)}`);
    setCouponAppliedSuccess(`Applied coupon ${clean}: -$${disc.toFixed(2)} discount`);
  };

  const handlePlanChange = (selectedPlan: string) => {
    setPlanName(selectedPlan);
    const matched = plans.find((p) => p.name.toLowerCase() === selectedPlan.toLowerCase());
    const basePrice = matched ? matched.price_monthly : 49;
    if (selectedCouponCode && (coupons || []).length > 0) {
      applyCoupon(selectedCouponCode, selectedPlan, basePrice);
    } else {
      setAmount(`$${basePrice.toFixed(2)}`);
      setCouponDiscountAmount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!shopName.trim()) {
      setError("Please specify a shop name");
      return;
    }
    if (!amount.trim()) {
      setError("Please specify an invoice amount");
      return;
    }

    const matchedPlan = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
    const originalPrice = matchedPlan ? `$${matchedPlan.price_monthly.toFixed(2)}` : undefined;

    createInvoiceMutation.mutate({
      shop: shopName.trim(),
      shop_id: shopId,
      plan: planName,
      method,
      amount,
      status,
      date,
      reference: reference.trim() || undefined,
      coupon_code: selectedCouponCode || undefined,
      discount_amount: couponDiscountAmount > 0 ? `$${couponDiscountAmount.toFixed(2)}` : undefined,
      original_amount: couponDiscountAmount > 0 ? originalPrice : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Record Subscription Payment</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Log merchant invoice transaction and issue receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-[12.5px] font-medium text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shop Selection */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Merchant Shop <span className="text-rose-500">*</span>
            </label>
            {shops.length > 0 ? (
              <select
                value={shopName}
                onChange={(e) => {
                  const selName = e.target.value;
                  setShopName(selName);
                  const matched = shops.find((s) => s.name === selName);
                  if (matched) {
                    setShopId(matched.id);
                    if (matched.plan?.name) {
                      handlePlanChange(matched.plan.name);
                    }
                  }
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} (Plan: {s.plan?.name ?? "Free"})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sokha Fashion Cambodia"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Plan Tier */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subscription Plan
              </label>
              <select
                value={planName}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (${p.price_monthly}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ABA KHQR">ABA KHQR</option>
                <option value="Bakong KHQR">Bakong KHQR</option>
                <option value="ABA Transfer">ABA Transfer</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="ACLEDA Pay">ACLEDA Pay</option>
                <option value="Cash / Bank Wire">Cash / Bank Wire</option>
              </select>
            </div>
          </div>

          {/* Coupon Discount Section */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-600 dark:text-emerald-400" />
                Apply Promotional Coupon Discount
              </label>
              {selectedCouponCode && (
                <button
                  type="button"
                  onClick={() => applyCoupon("")}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Remove Coupon
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCouponCode}
                onChange={(e) => applyCoupon(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12.5px] text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- No Coupon Applied --</option>
                {(coupons || [])
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} ({c.discount_type === "percent" ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`} - {c.name})
                    </option>
                  ))}
              </select>
            </div>

            {couponAppliedSuccess && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-[11.5px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  {couponAppliedSuccess}
                </span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">Net: {amount}</span>
              </div>
            )}
            {couponError && (
              <p className="text-[11.5px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {couponError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Final Billable Amount (USD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="$49.00"
                required
                className="w-full font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Paid">Paid (Completed)</option>
                <option value="Overdue">Overdue (Unpaid)</option>
                <option value="Failed">Failed (Declined)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Reference */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. ABA-9821405"
                className="w-full font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Billing Date */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[12.5px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInvoiceMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
            >
              {createInvoiceMutation.isPending ? "Recording..." : "Record Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent 3: ReceiptModal (Official Printable Receipt)
// ─────────────────────────────────────────────────────────────────────────────
interface ReceiptModalProps {
  item: PaymentHistoryItem;
  onClose: () => void;
}

function ReceiptModal({ item, onClose }: ReceiptModalProps) {
  const isPaid = item.status.toLowerCase() === "paid";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${item.id}_receipt.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8 print:shadow-none print:border-none print:bg-white">
        {/* Receipt Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-slate-600 dark:text-slate-400" />
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Official Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt Content Body */}
        <div className="p-8 space-y-6 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 print:bg-white print:text-slate-900 font-sans">
          {/* Top Brand Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  Chhlat<span className="text-slate-900 dark:text-white print:text-slate-900">AI</span>
                </span>
                <span className="rounded bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase">
                  CRM Cloud
                </span>
              </div>
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1">
                AI Social Commerce Platform · Phnom Penh, Cambodia
              </p>
            </div>

            <div className="text-right">
              <span className="block font-mono text-[14px] font-black text-slate-900 dark:text-white print:text-slate-900">
                {item.id}
              </span>
              <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{item.date}</span>
            </div>
          </div>

          {/* Billed To / Payment Specs */}
          <div className="grid grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Billed To
              </span>
              <span className="block font-bold text-slate-900 dark:text-white print:text-slate-900 text-[14px]">{item.shop}</span>
              {item.shop_id && <span className="text-slate-500 dark:text-slate-400 text-[11.5px]">Merchant ID #{item.shop_id}</span>}
              <span className="block text-slate-500 dark:text-slate-400 mt-0.5">Phnom Penh, Cambodia</span>
            </div>

            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Payment Status
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  PAID IN FULL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-[11.5px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {item.status.toUpperCase()}
                </span>
              )}
              <span className="block text-slate-500 dark:text-slate-400 text-[11.5px] mt-1.5">
                Method: <strong className="text-slate-800 dark:text-slate-200">{item.method}</strong>
              </span>
              {item.reference && (
                <span className="block font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  Ref: {item.reference}
                </span>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Cycle</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Chhlat AI Platform — {item.plan} Subscription
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      Social commerce unified inbox, Bakong payments & automated AI agent
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">1 Month</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white print:text-slate-900">
                    {item.amount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[12.5px]">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{item.original_amount || item.amount}</span>
            </div>
            {item.coupon_code && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold text-[12.5px]">
                <span className="flex items-center gap-1.5">
                  <Tag size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Promo Coupon Discount ({item.coupon_code})
                </span>
                <span className="font-mono">-{item.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>VAT / Tax (0%)</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">$0.00</span>
            </div>
            <div className="flex justify-between text-[15px] font-bold text-slate-900 dark:text-white border-t border-slate-200/80 dark:border-slate-700 pt-2">
              <span>Total Paid</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{item.amount}</span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
            <p>Thank you for choosing Chhlat AI to empower your social commerce business.</p>
            <p className="mt-0.5">For billing inquiries or enterprise support: support@chhlat.ai</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent 4: CouponFormModal (Create / Edit Subscription Discount Coupon)
// ─────────────────────────────────────────────────────────────────────────────
interface CouponFormModalProps {
  coupon: SubscriptionCoupon | null;
  plans: Plan[];
  onClose: () => void;
  onSuccess: () => void;
}

function CouponFormModal({ coupon, plans, onClose, onSuccess }: CouponFormModalProps) {
  const isEdit = Boolean(coupon);
  const [code, setCode] = useState(coupon?.code ?? "");
  const [name, setName] = useState(coupon?.name ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(coupon?.discount_type ?? "percent");
  const [discountValue, setDiscountValue] = useState<number>(coupon?.discount_value ?? 20);
  const [applicablePlan, setApplicablePlan] = useState<string>(coupon?.applicable_plan ?? "all");
  const [maxUses, setMaxUses] = useState<string>(
    coupon?.max_uses !== null && coupon?.max_uses !== undefined ? String(coupon.max_uses) : "100"
  );
  const [validUntil, setValidUntil] = useState<string>(
    coupon?.valid_until ? coupon.valid_until.slice(0, 10) : "2026-12-31"
  );
  const [isActive, setIsActive] = useState<boolean>(coupon?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit && coupon) {
        return api.put(`/admin/coupons/${coupon.id}`, data);
      }
      return api.post("/admin/coupons", data);
    },
    onSuccess,
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to save discount coupon");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please provide a coupon code");
      return;
    }
    if (!name.trim()) {
      setError("Please provide a coupon campaign title");
      return;
    }
    if (discountValue <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }
    if (discountType === "percent" && discountValue > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    mutation.mutate({
      code: cleanCode,
      name: name.trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      applicable_plan: applicablePlan,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      valid_until: validUntil || null,
      is_active: isActive,
    });
  };

  // Preview calculations
  const sampleProPrice = 49;
  const sampleCalcDiscount =
    discountType === "percent"
      ? sampleProPrice * (discountValue / 100)
      : Math.min(sampleProPrice, discountValue);
  const sampleFinal = Math.max(0, sampleProPrice - sampleCalcDiscount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">
                {isEdit ? "Edit Discount Coupon" : "Create Subscription Coupon"}
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Configure promotional code, discount rates, and merchant quota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-[12.5px] font-medium text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Coupon Code */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME50"
                className="w-full font-mono uppercase font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 block">Alphanumeric, dashes allowed</span>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Launch 50% Off Special"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Discount Type Toggle */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Discount Structure
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-[12.5px] font-bold transition cursor-pointer ${
                  discountType === "percent"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750"
                }`}
              >
                <Percent size={15} />
                <span>Percentage Discount (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-[12.5px] font-bold transition cursor-pointer ${
                  discountType === "fixed"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750"
                }`}
              >
                <DollarSign size={15} />
                <span>Fixed Amount ($)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Discount Value */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {discountType === "percent" ? "Percentage Off (%)" : "Fixed Discount ($)"} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max={discountType === "percent" ? "100" : "9999"}
                  step="any"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-[12px]">
                  {discountType === "percent" ? "%" : "USD"}
                </span>
              </div>
            </div>

            {/* Applicable Tier */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Applicable Subscription Tier
              </label>
              <select
                value={applicablePlan}
                onChange={(e) => setApplicablePlan(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Subscription Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} Tier Only (${p.price_monthly}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Max Redemptions */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Redemptions Limit
              </label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 block">Blank = Unlimited redemptions</span>
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="couponActiveCheckbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="couponActiveCheckbox" className="text-[12.5px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Activate coupon immediately for merchant billing
            </label>
          </div>

          {/* Live Discount Calculator Preview */}
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-[12px] text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                Live Calculation Preview (Pro Plan $49/mo):
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300 text-[13px]">
                ${sampleFinal.toFixed(2)} / mo
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
              <span>Original: $49.00</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                Discount: -${sampleCalcDiscount.toFixed(2)} ({discountType === "percent" ? `${discountValue}%` : `$${discountValue}`})
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
