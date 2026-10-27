import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Lock,
  LogOut,
  MessageSquare,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import clsx from "clsx";
import { LiveChatContainer } from "../../components/inbox/LiveChatContainer";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, ORDER_STATUS, shortDate } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type { Announcement, Order, OrderStatus, Product, QuickReply } from "../../lib/types";

export function StaffChat() {
  const { setUnread } = useOutletContext<{ setUnread: (n: number) => void }>();
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 overflow-hidden">
      <LiveChatContainer onUnreadChange={setUnread} />
    </div>
  );
}

function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {children}
    </div>
  );
}

/** Quick products & prices — staff can search stock & instantly copy quotes for chats. */
export function StaffProducts() {
  const { language } = useLanguage();
  const [q, setQ] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedReplyId, setCopiedReplyId] = useState<number | null>(null);

  const products = useQuery({
    queryKey: ["products", q],
    queryFn: () => api.get<Product[]>(`/products?q=${encodeURIComponent(q)}`),
  });
  const replies = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => api.get<QuickReply[]>("/quick-replies"),
  });

  const activeProducts = useMemo(
    () => products.data?.filter((p) => p.is_active) ?? [],
    [products.data]
  );

  const handleCopyQuote = (p: Product) => {
    const text = `${p.name} — ${money(p.price)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyReply = (r: QuickReply) => {
    navigator.clipboard.writeText(r.text);
    setCopiedReplyId(r.id);
    setTimeout(() => setCopiedReplyId(null), 1800);
  };

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === "km" ? "ផលិតផល & តម្លៃរហ័ស" : "Quick Products & Prices"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "ស្វែងរកផលិតផលក្នុងស្តុក ចម្លងតម្លៃ ឬសម្រង់តម្លៃរហ័សដើម្បីផ្ញើជូនអតិថិជនក្នុងការជជែក"
              : "Search current stock, tap to copy prices or quotation snippets for fast customer replies."}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === "km" ? "ស្វែងរកឈ្មោះ ឬកូដផលិតផល..." : "Search products…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-8 text-xs placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package size={16} className="text-blue-600" />
            <span>{language === "km" ? "ទំនិញមានក្នុងស្តុក" : "Available In Stock"}</span>
            <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-semibold border border-slate-200/60">
              {activeProducts.length}
            </span>
          </h2>
        </div>

        {activeProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
            <Package size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching with another keyword or name.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.map((p) => {
              const isCopied = copiedId === p.id;
              const stockTone =
                p.stock === 0
                  ? "bg-rose-50 text-rose-700 border-rose-200/60"
                  : p.stock < 5
                  ? "bg-amber-50 text-amber-700 border-amber-200/60"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/60";

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-3.5">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="size-14 rounded-xl object-cover border border-slate-100 flex-shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="size-14 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <Package size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition">
                          {p.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold border", stockTone)}>
                          {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                        </span>
                      </div>
                      {p.description && (
                        <p className="line-clamp-2 text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Price</span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        {money(p.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyQuote(p)}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs",
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      )}
                      title="Copy product name & price"
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? "Copied!" : "Copy Quote"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Replies Section ── */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-purple-600" />
            <span>{language === "km" ? "ឃ្លាឆ្លើយតបរហ័ស (Quick Replies)" : "Quick Reply Snippets"}</span>
          </h2>
          <span className="text-xs text-slate-400">
            Type <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">/</code> in live chat to insert
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {replies.data?.map((r) => {
            const isCopied = copiedReplyId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 transition flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="shrink-0 font-mono text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-1 rounded-lg shadow-2xs">
                    {r.command}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed min-w-0">
                    {r.text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyReply(r)}
                  className={clsx(
                    "shrink-0 rounded-lg p-1.5 transition cursor-pointer border",
                    isCopied
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "text-slate-400 border-transparent hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                  )}
                  title="Copy text snippet"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}

/** Staff Orders and Commission page */
export function StaffOrders() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const stats = useQuery({
    queryKey: ["me-stats"],
    queryFn: () => api.get<Record<string, number>>("/auth/me/stats"),
    refetchInterval: 30_000,
  });

  const orders = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => api.get<Order[]>("/orders?mine=true"),
    refetchInterval: 15_000,
  });

  const s = stats.data;
  const allMineOrders = orders.data ?? [];

  const filteredOrders = useMemo(() => {
    return allMineOrders.filter((o) => {
      const matchesFilter = filter === "all" || o.status === filter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.invoice_no.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [allMineOrders, filter, search]);

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === "km" ? "ការបញ្ជាទិញ & កម្រៃជើងសាររបស់ខ្ញុំ" : "My Orders & Commission"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "តាមដានរាល់ការបញ្ជាទិញដែលអ្នកបានជួយសម្របសម្រួលក្នុងខែនេះ និងកម្រៃជើងសារប៉ាន់ស្មាន"
              : "Orders you handled or closed this month and your estimated commission earnings."}
          </p>
        </div>

        <button
          onClick={() => {
            void stats.refetch();
            void orders.refetch();
          }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          title="Refresh orders"
        >
          <RefreshCw size={14} className={clsx(orders.isFetching && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Orders handled */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Handled</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Receipt size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {s?.orders_this_month ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total orders handled this month</p>
        </div>

        {/* Sales Generated */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Generated</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 font-mono">
            {money(s?.revenue_this_month)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total revenue generated</p>
        </div>

        {/* Commission */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Commission ({s?.commission_rate ?? 0}%)
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60">
              <Award size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-purple-700 font-mono">
            {money(s?.commission_this_month)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Estimated payout for this cycle</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { key: "all", label: "All" },
            { key: "paid", label: "Paid" },
            { key: "confirmed", label: "To Ship" },
            { key: "shipped", label: "Shipped" },
            { key: "delivered", label: "Delivered" },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={clsx(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex-shrink-0",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 shadow-2xs"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="h-9 w-full rounded-xl border border-slate-200/80 bg-white pl-8 pr-8 text-xs placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* ── Modern Orders Table ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No orders match this filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Orders you take over or create in live chat will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const statusInfo = ORDER_STATUS[o.status] || { label: o.status, tone: "neutral" };
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {o.invoice_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.customer?.name || "Customer"}</div>
                        <div className="text-[11px] text-slate-400">{o.customer?.phone || "No phone"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="line-clamp-1 max-w-[220px] font-medium text-slate-700">
                          {o.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {money(o.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                            statusInfo.tone === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                            statusInfo.tone === "warning" && "bg-amber-50 text-amber-700 border-amber-200/60",
                            statusInfo.tone === "danger" && "bg-rose-50 text-rose-700 border-rose-200/60",
                            statusInfo.tone === "brand" && "bg-blue-50 text-blue-700 border-blue-200/60",
                            statusInfo.tone === "neutral" && "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {shortDate(o.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => window.open(`/print/${o.id}`, "_blank")}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Print receipt"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="View order details"
                          >
                            <Eye size={14} />
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

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {selectedOrder.invoice_no}
                </h3>
                <p className="text-xs text-slate-400">
                  Created {shortDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedOrder.customer?.name || "Customer"}</p>
                  <p className="text-slate-500">{selectedOrder.customer?.phone || "No phone"}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-800">
                    {ORDER_STATUS[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Order Items</span>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/60 overflow-hidden">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white">
                      <span className="font-semibold text-slate-800">
                        {it.name} <span className="text-slate-400 font-normal">×{it.quantity}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{money(it.unit_price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 font-bold text-slate-900">
                    <span>Total</span>
                    <span className="font-mono text-sm text-blue-600">{money(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.delivery_address && (
                <div className="rounded-xl border border-slate-200/60 p-3 bg-slate-50/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Address</span>
                  <p className="text-slate-700 mt-0.5">{selectedOrder.delivery_address}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.open(`/print/${selectedOrder.id}`, "_blank")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

/** Staff Profile & Settings */
export function StaffProfile() {
  const { user, refresh, logout } = useAuth();
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [name, setName] = useState(user?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch("/auth/me", body),
    onSuccess: () => {
      void refresh();
      qc.invalidateQueries();
      setPassword("");
      setCurrentPassword("");
      setSavedSuccess(true);
      setSaveError(null);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setSaveError(err.message || "Failed to update profile. Please verify your current password.");
    },
  });

  const handleSave = () => {
    setSaveError(null);
    if (password) {
      if (!currentPassword) {
        setSaveError("Please enter your current password to verify your identity.");
        return;
      }
      if (password.length < 8) {
        setSaveError("New password must be at least 8 characters long.");
        return;
      }
    }
    save.mutate({
      full_name: name,
      ...(password ? { password, current_password: currentPassword } : {}),
    });
  };

  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<Announcement[]>("/announcements"),
  });

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {language === "km" ? "គណនីបុគ្គលិក" : "Staff Profile & Settings"}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {language === "km"
            ? "គ្រប់គ្រងព័ត៌មានគណនី ស្ថានភាពត្រៀមឆ្លើយតប និងមើលសេចក្តីជូនដំណឹងពីហាង"
            : "Manage your staff details, toggle live chat availability, and read shop updates."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Account Details & Online Toggle */}
        <div className="space-y-6">
          {/* Availability Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === "km" ? "ស្ថានភាពត្រៀមឆ្លើយតប (Availability)" : "Chat Availability"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  When enabled, AI will hand off waiting chats to you immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => save.mutate({ is_online: !user?.is_online })}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  user?.is_online ? "bg-emerald-600" : "bg-slate-200"
                )}
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                    user?.is_online ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <div
              className={clsx(
                "rounded-xl p-3 border flex items-center gap-2.5 text-xs font-semibold",
                user?.is_online
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              )}
            >
              <span className={clsx("size-2 rounded-full", user?.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
              <span>
                {user?.is_online
                  ? "You are Online and receiving customer chat handoffs"
                  : "You are Away — AI Auto-Pilot will answer or ask customers to leave contact info"}
              </span>
            </div>
          </div>

          {/* Profile Form Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserIcon size={16} className="text-blue-600" />
              <span>Personal Information</span>
            </h3>

            {savedSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 p-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/60 p-2.5 text-xs text-rose-800 font-medium">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Login ID)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="h-9 w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 pr-8 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                  <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Current Password <span className="text-slate-400 font-normal">(Required to change password)</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-9 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  New Password <span className="text-slate-400 font-normal">(Min 8 characters, leave empty to keep existing)</span>
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                disabled={save.isPending}
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
              >
                {save.isPending && <RefreshCw size={13} className="animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Shop Announcements & Tips */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell size={16} className="text-purple-600" />
              <span>Shop Announcements</span>
            </h3>

            {announcements.data?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <Bell size={24} className="mx-auto mb-1.5 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No new announcements</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Notices from the shop owner will show here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.data?.map((a) => (
                  <div key={a.id} className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/60 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Handoff Guidelines */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Zap size={16} />
              <span>Best Practices for Chat Staff</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Take over urgent chats:</strong> When a customer is marked with <span className="text-rose-600 font-bold">🔴 Wait Staff</span> or <span className="text-rose-600 font-bold">🚨 Urgent</span>, reply right away with polite greetings.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Check Bakong KHQR slips:</strong> Inspect payment slips in the chat drawer and verify the reference code before confirming the order.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Resume AI when done:</strong> Click <em>Resume AI Auto-Pilot</em> so the bot can continue servicing follow-up queries.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/** Staff Help & Response Guides */
export function StaffHelp() {
  const { language } = useLanguage();

  const statuses = [
    {
      badge: "🟢 Normal",
      tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      description: "AI Auto-Pilot handles customer questions about products, delivery fees, and general inquiries automatically.",
    },
    {
      badge: "🟡 Interested",
      tone: "bg-amber-50 text-amber-800 border-amber-200",
      description: "Customer expresses strong purchase intent (e.g., asking for bank account or discount). AI assists in closing the deal.",
    },
    {
      badge: "🔴 Angry / Urgent",
      tone: "bg-rose-50 text-rose-800 border-rose-200",
      description: "Customer has an issue or delay. The chat is flagged with [High Priority 🚨] and placed at the top for immediate takeover.",
    },
    {
      badge: "🔴 Wait Staff",
      tone: "bg-rose-50 text-rose-800 border-rose-200",
      description: "AI stepped aside politely (e.g. out of scope question or customer asked for human agent). Click 'Take Over' to reply.",
    },
    {
      badge: "⚪ Manual Mode",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      description: "AI Auto-Pilot is temporarily paused for this customer. Staff can reply by text, voice, or media. Click 'Resume AI' when finished.",
    },
  ];

  const shortcuts = [
    { command: "/price", label: "Send Product Price List", desc: "Instantly sends pricing details for active store items." },
    { command: "/delivery", label: "Delivery Information", desc: "Shares Phnom Penh ($1.50) & Province delivery policies." },
    { command: "/bank", label: "ABA & Bakong KHQR Details", desc: "Sends official ABA / Bakong bank account & payment instructions." },
    { command: "/discount", label: "Special Offers", desc: "Offers active promotion or bundle discounts." },
  ];

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {language === "km" ? "ជំនួយ & គន្លឹះឆ្លើយតប" : "Staff Help & Response Control Guides"}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {language === "km"
            ? "ការណែនាំអំពីពណ៌ចំណាត់ថ្នាក់អតិថិជន និងរបៀបគ្រប់គ្រងការឆ្លើយតបរបស់ AI"
            : "Reference guide for customer sentiment flags, AI takeover flow, and quick slash commands."}
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer Sentiment Tags */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Customer Sentiment Tags & AI States
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              How Chhlat AI automatically tags and prioritizes chats in your inbox.
            </p>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/60 overflow-hidden">
            {statuses.map((s, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white hover:bg-slate-50/50 transition">
                <span className={clsx("w-36 shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold border text-center sm:text-left", s.tone)}>
                  {s.badge}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Slash Commands */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Chat Composer Slash Shortcuts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type <code className="bg-slate-100 text-purple-700 font-mono px-1 py-0.5 rounded text-[11px]">/</code> directly in the chat composer to insert pre-made answers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map((sc, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200/60 p-4 bg-slate-50/60 flex items-start gap-3">
                <span className="font-mono text-xs font-bold bg-white text-purple-700 border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                  {sc.command}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">{sc.label}</p>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{sc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
