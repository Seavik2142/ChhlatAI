import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  ExternalLink,
  Eye,
  MessageSquare,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { SendToDelivery } from "../../components/commerce/SendToDelivery";
import { api } from "../../lib/api";
import { money, ORDER_STATUS, shortDate, timeAgo } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type { Order, OrderStatus, Shop } from "../../lib/types";

type Filter = "all" | OrderStatus;

export function OwnerOrders() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const [zoomSlipUrl, setZoomSlipUrl] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders", filter],
    queryFn: () => api.get<Order[]>(`/orders${filter === "all" ? "" : `?status=${filter}`}`),
    refetchInterval: 15_000,
  });
  const orders = ordersQuery.data ?? [];

  const allOrdersQuery = useQuery({
    queryKey: ["orders", "all-counts"],
    queryFn: () => api.get<Order[]>("/orders"),
    refetchInterval: 30_000,
  });
  const allOrders = allOrdersQuery.data ?? [];

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const shop = shopQuery.data;

  const actMutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api.post<Order>(path, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      if (open) {
        const updated = await api.get<Order>(`/orders/${open.id}`);
        setOpen(updated);
      }
    },
  });

  // Calculate tab counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: allOrders.length,
      needs_review: 0,
      checking_slip: 0,
      paid: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
    };
    allOrders.forEach((o) => {
      if (c[o.status] !== undefined) c[o.status]++;
    });
    return c;
  }, [allOrders]);

  // Filtered by search
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.invoice_no.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const tabs: { key: Filter; label: string; badge?: number; tone?: "danger" | "warning" }[] = [
    { key: "all", label: "All Orders", badge: counts.all },
    {
      key: "needs_review",
      label: "Needs Review",
      badge: counts.needs_review,
      tone: counts.needs_review > 0 ? "danger" : undefined,
    },
    { key: "checking_slip", label: "Checking Slip", badge: counts.checking_slip },
    { key: "paid", label: "Paid", badge: counts.paid },
    { key: "confirmed", label: "To Ship", badge: counts.confirmed },
    { key: "shipped", label: "Shipped", badge: counts.shipped },
    { key: "delivered", label: "Delivered", badge: counts.delivered },
  ];

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === "km" ? "ការបញ្ជាទិញ វិក្កយបត្រ & ស្លីប ABA" : "Orders, Invoices & ABA Slips"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "ផ្ទៀងផ្ទាត់ស្លីបបង់ប្រាក់ ត្រួតពិនិត្យវិក្កយបត្រដែល AI បានបង្កើត និងប្រគល់ទំនិញជូនក្រុមហ៊ុនដឹកជញ្ជូន"
              : "Review automated AI invoices, verify customer payment slips, and dispatch to couriers."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void ordersQuery.refetch();
              void allOrdersQuery.refetch();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw size={14} className={clsx(ordersQuery.isFetching && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Filter Tabs & Search Toolbar ── */}
      <div className="flex flex-col gap-3">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={clsx(
                  "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer flex-shrink-0",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                )}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.tone === "danger"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer name, phone, item..."
            className="h-9 w-full rounded-xl border border-slate-200/80 bg-white pl-8 pr-8 text-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Orders Data Table ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total (USD)</th>
                <th className="py-3 px-4">Payment & Slips</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No orders match this filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New orders created automatically in chat will appear here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const statusInfo = ORDER_STATUS[o.status] || { label: o.status, tone: "neutral" };
                  const hasSlips = o.slips && o.slips.length > 0;
                  const verifiedSlip = o.slips?.find((s) => s.status === "verified");

                  return (
                    <tr
                      key={o.id}
                      onClick={() => setOpen(o)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {o.invoice_no}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          {o.created_by_ai ? (
                            <span className="inline-flex items-center gap-0.5 text-purple-600 font-semibold">
                              <Bot size={11} /> AI Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-slate-500">
                              <User size={11} /> Staff
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.customer?.name || "Customer"}</div>
                        <div className="text-[11px] text-slate-400">{o.customer?.phone || "No phone"}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="line-clamp-1 max-w-[220px] font-medium text-slate-700">
                          {o.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {o.items?.length || 0} item(s) · Delivery: {money(o.delivery_fee)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {money(o.total)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasSlips ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={clsx(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                verifiedSlip
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : o.status === "needs_review"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                              )}
                            >
                              {verifiedSlip
                                ? "Verified Slip"
                                : o.status === "needs_review"
                                ? "Review Slip"
                                : "Slip Attached"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Awaiting payment</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            statusInfo.tone === "success"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : statusInfo.tone === "danger"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                              : statusInfo.tone === "warning"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {shortDate(o.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(o);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer shadow-2xs"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail & ABA Slip Verification Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 scrollbar-thin">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{open.invoice_no}</h2>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                      ORDER_STATUS[open.status]?.tone === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : ORDER_STATUS[open.status]?.tone === "danger"
                        ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                        : "bg-amber-50 text-amber-700 border border-amber-200/60"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {ORDER_STATUS[open.status]?.label || open.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <strong className="text-slate-800">{open.customer?.name}</strong>
                  {open.customer?.phone && ` (${open.customer.phone})`} · Created {timeAgo(open.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {open.conversation_id && (
                  <Link
                    to={`/owner/inbox?c=${open.conversation_id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <MessageSquare size={13} />
                    <span>Open Chat</span>
                  </Link>
                )}
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Order Items & Invoicing
              </span>
              {open.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium text-slate-900">
                    {item.name} <span className="text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold">{money(item.unit_price * item.quantity)}</span>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                <span>Standard Delivery Fee</span>
                <span>{money(open.delivery_fee)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-emerald-700">{money(open.total)}</span>
              </div>
            </div>

            {/* ABA & Bakong Slip AI Verification Panel */}
            {open.slips && open.slips.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Payment Slip Verification ({open.slips.length})
                </h3>

                {open.slips.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                  >
                    {s.image_url && !s.image_url.startsWith("telegram:") && (
                      <div
                        onClick={() => setZoomSlipUrl(s.image_url)}
                        className="relative h-44 w-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group"
                        title="Click to zoom slip image"
                      >
                        <img src={s.image_url} alt="Slip receipt" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition">
                          Zoom
                        </div>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {s.bank || "ABA Bank / KHQR"}
                          </span>
                          <span
                            className={clsx(
                              "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase",
                              s.status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : s.status === "mismatch"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {s.status}
                          </span>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                          AI Confidence: {Math.round(s.confidence * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Extracted Amount</span>
                          <span className="font-bold text-slate-900">
                            {s.amount !== null ? money(s.amount) : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Reference / Transaction ID</span>
                          <span className="font-mono text-slate-800">{s.reference || "—"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block">Receiver Account Name</span>
                          <span className="font-semibold text-slate-800">{s.receiver || "—"}</span>
                        </div>
                      </div>

                      {/* Slip Verification Checks */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(s.checks || {}).map(([key, ok]) => (
                          <span
                            key={key}
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                              ok
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                : "bg-rose-50 text-rose-700 border-rose-200/60"
                            )}
                          >
                            {ok ? <Check size={11} /> : <X size={11} />}
                            <span>{key.replace(/_/g, " ")}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Courier Delivery Section (if dispatched) */}
            {open.delivery && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Truck size={16} className="text-indigo-600" />
                  <span>Courier Delivery: {open.delivery.courier.toUpperCase()}</span>
                </div>
                <p className="text-slate-600">
                  Tracking number: <strong className="font-mono">{open.delivery.tracking_no}</strong>
                </p>
                {open.delivery.tracking_url && (
                  <a
                    href={open.delivery.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline mt-1"
                  >
                    <span>Track package live</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100">
              {open.status === "needs_review" && (
                <>
                  <button
                    disabled={actMutation.isPending}
                    onClick={() => actMutation.mutate({ path: `/orders/${open.id}/review?approve=false` })}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  >
                    Reject Slip
                  </button>
                  <button
                    disabled={actMutation.isPending}
                    onClick={() => actMutation.mutate({ path: `/orders/${open.id}/review?approve=true` })}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Approve Payment Slip
                  </button>
                </>
              )}

              {open.status === "checking_slip" && (
                <button
                  disabled={actMutation.isPending}
                  onClick={() => actMutation.mutate({ path: `/orders/${open.id}/simulate-bank-confirmation` })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Sandbox: Simulate Bank Confirmation
                </button>
              )}

              {open.status === "paid" && (
                <button
                  disabled={actMutation.isPending}
                  onClick={() => {
                    actMutation.mutate({ path: `/orders/${open.id}/confirm` });
                    window.open(`/print/${open.id}`, "_blank");
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>Confirm Order & Print Invoice</span>
                </button>
              )}

              {["paid", "confirmed", "shipped", "delivered"].includes(open.status) && (
                <>
                  <a
                    href={open.invoice_url || `/api/v1/orders/${open.id}/invoice-image`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <Receipt size={14} />
                    <span>View Invoice Image</span>
                  </a>
                  <button
                    onClick={() => window.open(`/print/${open.id}`, "_blank")}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print Receipt / QR Slip</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setOpen(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Hand-off to Delivery Courier component */}
            {open.status === "confirmed" && (
              <div className="pt-2 border-t border-slate-100">
                <SendToDelivery
                  order={open}
                  fees={shop?.delivery_fees ?? {}}
                  sending={actMutation.isPending}
                  onPrint={() => window.open(`/print/${open.id}`, "_blank")}
                  onSend={(courier, cod) =>
                    actMutation.mutate({
                      path: `/orders/${open.id}/delivery`,
                      body: { courier, cash_on_delivery: cod },
                    })
                  }
                />
              </div>
            )}

            {actMutation.error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {actMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Slip Image Fullscreen Lightbox Modal */}
      {zoomSlipUrl && (
        <div
          onClick={() => setZoomSlipUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
            <img src={zoomSlipUrl} alt="Zoomed payment slip" className="h-full w-full object-contain rounded-xl" />
            <button
              onClick={() => setZoomSlipUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-slate-900/70 text-white p-1.5 hover:bg-slate-900 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
