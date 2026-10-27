import { useState, useEffect } from "react";
import clsx from "clsx";
import { clock, money } from "../../lib/format";
import type { Message } from "../../lib/types";
import { FigmaIcon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { BrandLogo } from "../ui/BrandLogo";

export interface MessageBubbleProps {
  m: Message;
  customerName?: string;
  customerAvatar?: string;
  onOrderProduct?: (productId: number) => void;
  isFirstUnread?: boolean;
}

/**
 * MedTrackr-inspired Message Bubble:
 * - Centered dark date pill
 * - Left incoming bubble with customer avatar, name & time above bubble, soft slate-100 bubble
 * - Right outgoing bubble with time & "You" above bubble, royal blue (#2563EB) bubble
 * - Red "New Message" divider for unread messages
 */
export function MessageBubble({
  m,
  customerName = "Customer",
  onOrderProduct,
  isFirstUnread,
}: MessageBubbleProps) {
  const time = clock(m.created_at);

  // System Event / Date Separator
  if (m.kind === "event") {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-slate-800/90 dark:bg-slate-800 text-white dark:text-slate-200 border border-transparent dark:border-white/10 text-[11px] font-medium px-4 py-1 rounded-full shadow-xs tracking-wide">
          {m.body}
        </span>
      </div>
    );
  }

  const isCustomer = m.sender === "customer";

  return (
    <div className="w-full flex flex-col">
      {/* "New Message" separator line (MedTrackr style) */}
      {isFirstUnread && (
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rose-300 dark:border-rose-900/60" />
          </div>
          <span className="relative bg-white dark:bg-[#090d16] px-3 text-[11px] font-semibold text-rose-500 uppercase tracking-wider">
            New Message
          </span>
        </div>
      )}

      {isCustomer ? (
        /* Incoming Customer Message */
        <div className="flex items-start gap-3 justify-start my-1.5 group">
          {/* Avatar on left */}
          <div className="flex-shrink-0 mt-0.5">
            <Avatar name={customerName} size={34} />
          </div>

          <div className="flex flex-col items-start max-w-[520px]">
            {/* Header: Name + Time */}
            <div className="flex items-center gap-2 mb-1 pl-1">
              <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                {customerName}
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                {time}
              </span>
            </div>

            {/* Bubble Content */}
            <CustomerContent m={m} />
          </div>
        </div>
      ) : (
        /* Outgoing Staff / AI Message */
        <div className="flex flex-col items-end my-1.5 self-end group max-w-[520px]">
          {/* Header: Time + Sender Name + Avatar */}
          <div className="flex items-center gap-2 mb-1 pr-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
              {time}
            </span>
            <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
              {m.sender === "staff" ? "You" : "AI Assistant"}
            </span>
            <div className="flex size-5 items-center justify-center rounded-full bg-slate-900 dark:bg-indigo-600 text-[9px] font-bold text-white shadow-2xs">
              {m.sender === "staff" ? "You" : "AI"}
            </div>
          </div>

          {/* Outgoing Bubble */}
          {m.sender === "staff" ? (
            <StaffContent m={m} />
          ) : (
            <AIContent m={m} onOrder={onOrderProduct} />
          )}
        </div>
      )}
    </div>
  );
}

function CustomerContent({ m }: { m: Message }) {
  if (m.kind === "slip") return <SlipThumb m={m} />;
  if (m.kind === "image") {
    return (
      <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#162038] p-1.5 shadow-2xs">
        {m.attachment_url && !m.attachment_url.startsWith("telegram:") ? (
          <img
            src={m.attachment_url}
            alt=""
            className="max-h-60 w-[240px] rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-[140px] w-[220px] flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <FigmaIcon name="icon-image-vip" size={28} />
            <span className="text-xs font-medium">{m.body || "Attached Photo"}</span>
          </div>
        )}
      </div>
    );
  }
  if (m.kind === "voice") return <Voice m={m} dark={false} />;

  return (
    <div className="rounded-2xl rounded-tl-sm border border-slate-200/50 dark:border-white/10 bg-[#F1F5F9] dark:bg-[#162038] px-4 py-3 text-[14px] leading-relaxed text-slate-900 dark:text-slate-100 shadow-2xs">
      <p className="whitespace-pre-wrap">{m.body}</p>
    </div>
  );
}

function StaffContent({ m }: { m: Message }) {
  if (m.kind === "voice") return <Voice m={m} dark />;
  if (m.kind === "image" && m.attachment_url) {
    return (
      <div className="flex flex-col gap-1.5 rounded-2xl bg-blue-600 dark:bg-indigo-600 p-1.5 shadow-xs">
        <img
          src={m.attachment_url}
          alt=""
          className="max-h-60 w-[240px] rounded-xl object-cover"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl rounded-tr-sm bg-[#2563EB] dark:bg-indigo-600 px-4 py-3 text-[14px] leading-relaxed text-white shadow-xs">
      <p className="whitespace-pre-wrap">{m.body}</p>
    </div>
  );
}

function AIContent({
  m,
  onOrder,
}: {
  m: Message;
  onOrder?: (id: number) => void;
}) {
  if (m.kind === "product_card") {
    const products = (m.meta.products as { id: number; name: string; price: number; image_url?: string }[]) ?? [];
    return (
      <div className="flex flex-col gap-2 rounded-2xl rounded-tr-sm border border-blue-200/80 dark:border-indigo-500/30 bg-blue-50/70 dark:bg-indigo-950/40 p-3 shadow-2xs">
        <span className="text-[11px] font-bold text-blue-700 dark:text-indigo-300">
          🤖 AI Recommended Products
        </span>
        {products.map((p) => (
          <div
            key={p.id}
            className="flex w-[300px] items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111a2e] p-2 shadow-2xs"
          >
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                className="size-9 rounded-lg object-cover border border-slate-100 dark:border-white/10 flex-shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-indigo-900/50 text-blue-600 dark:text-indigo-300 flex-shrink-0">
                <FigmaIcon name="icon-image-muted" size={16} />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                {p.name}
              </span>
              <span className="text-[12px] font-bold text-blue-600 dark:text-indigo-400">
                {money(p.price)}
              </span>
            </div>
            {onOrder && (
              <button
                onClick={() => onOrder(p.id)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
              >
                Order
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Paid Invoice
  if (m.kind === "invoice" && (m.meta?.is_paid_invoice || (!m.meta?.khqr && (m.meta?.invoice_url || m.attachment_url?.includes("invoice_url"))))) {
    return <PaidInvoiceCard m={m} />;
  }

  // Dynamic Unpaid KHQR Invoice (Auto-sent KHQR: Bakong, ABA PayWay, ACLEDA)
  if ((m.kind === "invoice" || m.meta?.khqr || m.meta?.khqr_image_url || m.attachment_url?.includes("khqr-image")) && !m.meta?.is_paid_invoice) {
    return <DynamicKHQRCard m={m} />;
  }

  // AI-sent regular photo / image attachment
  if (m.kind === "image" && m.attachment_url) {
    return (
      <div className="flex flex-col gap-1.5 rounded-2xl rounded-tr-sm bg-blue-600 dark:bg-indigo-600 p-2 shadow-xs max-w-[320px]">
        <img
          src={m.attachment_url}
          alt={m.body || "Image"}
          className="max-h-72 w-full rounded-xl object-cover border border-white/10"
        />
        {m.body && (
          <p className="px-1 text-[13px] leading-relaxed text-white whitespace-pre-wrap">
            {m.body}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl rounded-tr-sm bg-[#2563EB] dark:bg-indigo-600 px-4 py-3 text-[14px] leading-relaxed text-white shadow-xs">
      <p className="whitespace-pre-wrap">{m.body}</p>
    </div>
  );
}

function parseKhqrExpMs(khqr: string, createdAt?: string): number {
  if (khqr) {
    const idx = khqr.indexOf("9934");
    if (idx !== -1) {
      const tag99 = khqr.slice(idx, idx + 38);
      if (tag99.slice(21, 25) === "0113") {
        const exp = parseInt(tag99.slice(25, 38), 10);
        if (!isNaN(exp) && exp > 0) return exp;
      }
    }
  }
  if (createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!isNaN(createdMs)) return createdMs + 180000;
  }
  return Date.now() + 180000;
}

function DynamicKHQRCard({ m }: { m: Message }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const invNo = (m.meta?.invoice_no as string) || "Invoice";
  const total = m.meta?.total ? Number(m.meta.total) : null;
  const orderId = m.meta?.order_id as number | undefined;
  const provider = (m.meta?.provider as string) || "bakong";
  const merchantName = (m.meta?.merchant_name as string) || "MERCHANT";

  const [khqr, setKhqr] = useState((m.meta?.khqr as string) || "");
  const [qrImgUrl, setQrImgUrl] = useState(
    m.attachment_url || (m.meta?.khqr_image_url as string) || (m.meta?.order_id ? `/api/v1/orders/${m.meta.order_id}/khqr-image` : "")
  );
  const [deepLinks, setDeepLinks] = useState((m.meta?.deep_links as Record<string, string>) || {});

  // Expiration calculation: strictly 3-minute KHQR payment validity
  const [expiresAtMs, setExpiresAtMs] = useState<number>(() =>
    parseKhqrExpMs((m.meta?.khqr as string) || "", m.created_at)
  );
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingSec = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = remainingSec <= 0;
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      if (orderId) {
        const res = await fetch(`/api/v1/orders/${orderId}/regenerate-khqr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.khqr) setKhqr(data.khqr);
          if (data.deep_links) setDeepLinks(data.deep_links);
          if (data.expires_at_ms) {
            setExpiresAtMs(data.expires_at_ms);
          } else {
            setExpiresAtMs(Date.now() + 180000);
          }
          setQrImgUrl(`/api/v1/orders/${orderId}/khqr-image?t=${Date.now()}`);
          setNow(Date.now());
          setIsRenewing(false);
          return;
        }
      }
      // Fallback renewal
      const newExp = Date.now() + 180000;
      setExpiresAtMs(newExp);
      setQrImgUrl((prev) => {
        const base = prev.split("?")[0];
        return `${base}?t=${Date.now()}`;
      });
      setNow(Date.now());
    } catch (err) {
      console.error("Failed to renew KHQR:", err);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCopy = () => {
    if (khqr) {
      navigator.clipboard.writeText(khqr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const providerLabel =
    provider === "aba_payway"
      ? "ABA PayWay · KHQR"
      : provider === "acleda"
      ? "ACLEDA ToanChet · KHQR"
      : "National Bakong KHQR";

  const deepLinkUrl =
    provider === "aba_payway"
      ? deepLinks.aba_mobile || `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(khqr)}`
      : provider === "acleda"
      ? deepLinks.acleda_mobile || `acledamobile://pay?data=${encodeURIComponent(khqr)}`
      : deepLinks.bakong_app || `bakong://qr?data=${encodeURIComponent(khqr)}`;

  const deepLinkAppLabel =
    provider === "aba_payway"
      ? "Open in ABA Mobile"
      : provider === "acleda"
      ? "Open in ACLEDA Mobile"
      : "Open in Bakong App";

  return (
    <>
      <div className="flex flex-col gap-2 rounded-2xl rounded-tr-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-sm max-w-[320px] text-left">
        {/* Optional text message from AI if present */}
        {m.body && (
          <p className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap px-1 pt-0.5 pb-0.5">
            {m.body}
          </p>
        )}

        {/* 3-Minute Payment Timer Status Bar */}
        <div
          className={clsx(
            "flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors",
            isExpired
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
              : remainingSec < 60
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  isExpired
                    ? "bg-rose-400"
                    : remainingSec < 60
                    ? "animate-ping bg-amber-400"
                    : "animate-ping bg-emerald-400"
                )}
              />
              <span
                className={clsx(
                  "relative inline-flex rounded-full h-2 w-2",
                  isExpired ? "bg-rose-500" : remainingSec < 60 ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </span>
            <span className="font-semibold">
              {isExpired ? "Payment Expired (3m)" : "Pay within 3 mins:"}
            </span>
          </div>

          <span
            className={clsx(
              "font-mono font-bold px-1.5 py-0.5 rounded text-[11.5px]",
              isExpired
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200"
                : remainingSec < 60
                ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-100"
            )}
          >
            {isExpired ? "00:00" : timeFormatted}
          </span>
        </div>

        {/* Clean Official KHQR Ticket with Zoom on Click */}
        {qrImgUrl ? (
          <div
            onClick={() => !isExpired && setShowModal(true)}
            className="group relative flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-2xs cursor-pointer transition hover:border-rose-400 dark:hover:border-rose-600/80"
          >
            <img
              src={qrImgUrl}
              alt="Dynamic KHQR"
              className={clsx(
                "w-full h-auto object-contain transition-transform duration-200",
                isExpired ? "opacity-30 blur-[1px]" : "group-hover:scale-[1.01]"
              )}
            />

            {/* Hover overlay when active */}
            {!isExpired && (
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  Tap to Zoom
                </span>
              </div>
            )}

            {/* Expired Overlay with Instant Renew Button */}
            {isExpired && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center gap-2 z-10 animate-in fade-in duration-200">
                <div className="size-9 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 text-lg">
                  ⏱️
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-wide">KHQR Code Expired</p>
                  <p className="text-[10.5px] text-slate-300 mt-0.5">3-minute payment time limit reached</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenew();
                  }}
                  disabled={isRenewing}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 shadow-md transition cursor-pointer"
                >
                  {isRenewing ? (
                    <>
                      <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Renewing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Renew 3-Min KHQR</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
            Generating Dynamic KHQR...
          </div>
        )}

        {/* Action Buttons: 1-Tap Deep Link + Copy String */}
        <div className="flex flex-col gap-1.5 pt-1">
          {isExpired ? (
            <button
              onClick={handleRenew}
              disabled={isRenewing}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-3 shadow-xs transition cursor-pointer"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Generate New 3-Min KHQR</span>
            </button>
          ) : (
            <a
              href={deepLinkUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold py-2.5 px-3 shadow-xs transition"
            >
              <BrandLogo brand={provider} size={16} rounded="sm" />
              <span>{deepLinkAppLabel}</span>
            </a>
          )}

          <div className="flex items-center gap-1.5">
            {khqr && (
              <button
                onClick={handleCopy}
                disabled={isExpired}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-[11px] font-semibold py-1.5 px-2 transition cursor-pointer"
              >
                {copied ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Copied Code</span>
                ) : (
                  <>
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy KHQR</span>
                  </>
                )}
              </button>
            )}

            {qrImgUrl && !isExpired && (
              <a
                href={qrImgUrl}
                download={`${invNo}_khqr.png`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-semibold py-1.5 px-2.5 transition cursor-pointer"
              >
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Save QR</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          Official 3-Minute KHQR · Bakong, ABA, ACLEDA, or any mobile bank
        </p>
      </div>

      {/* Fullscreen Zoom Modal */}
      {showModal && qrImgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[92vh] max-w-[580px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {merchantName} · {invNo}
                </span>
                {total !== null && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-0.5">
                    ${total.toFixed(2)}
                  </span>
                )}
                <span
                  className={clsx(
                    "rounded-full text-xs font-semibold px-2 py-0.5",
                    isExpired
                      ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400"
                      : "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {isExpired ? "Expired" : `Pay within ${timeFormatted}`}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh] bg-slate-100/50 dark:bg-slate-950/40">
              <img
                src={qrImgUrl}
                alt={`KHQR ${invNo}`}
                className="max-h-[68vh] w-auto object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-5 py-3 bg-slate-50 dark:bg-slate-800/80">
              <span className="text-xs text-slate-500">
                {providerLabel} · {deepLinkAppLabel} or scan from another phone
              </span>
              <div className="flex items-center gap-2">
                {isExpired && (
                  <button
                    onClick={handleRenew}
                    disabled={isRenewing}
                    className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    ↻ Renew QR
                  </button>
                )}
                <a
                  href={qrImgUrl}
                  download={`${invNo}_khqr.png`}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-xs transition"
                >
                  Download Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PaidInvoiceCard({ m }: { m: Message }) {
  const [showModal, setShowModal] = useState(false);
  const invNo = (m.meta.invoice_no as string) || "Invoice";
  const total = m.meta.total ? Number(m.meta.total) : null;
  const orderId = m.meta.order_id as number | undefined;
  const imgUrl = m.attachment_url || (m.meta.invoice_url as string);

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-2xl rounded-tr-sm border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 shadow-xs max-w-[360px] text-left">
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/50 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white font-bold">
              ✓
            </span>
            <span className="text-[12.5px] font-bold text-emerald-950 dark:text-emerald-200">
              Paid Invoice · {invNo}
            </span>
          </div>
          {total !== null && (
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
              ${total.toFixed(2)}
            </span>
          )}
        </div>

        {/* Invoice Image Preview */}
        {imgUrl && (
          <div
            className="relative group overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <img
              src={imgUrl}
              alt={`Paid Invoice ${invNo}`}
              className="w-full h-auto max-h-[280px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Click to Zoom
              </span>
            </div>
          </div>
        )}

        {/* AI Confirmation Message */}
        {m.body && (
          <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white/80 dark:bg-[#111a2e] p-2.5 rounded-xl border border-emerald-100 dark:border-white/5 shadow-2xs">
            {m.body}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          {imgUrl && (
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2.5 shadow-2xs transition cursor-pointer"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Receipt
            </button>
          )}
          {imgUrl && (
            <a
              href={imgUrl}
              download={`${invNo}_receipt.png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 text-xs font-semibold py-1.5 px-2.5 shadow-2xs transition cursor-pointer"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
          {orderId && (
            <button
              onClick={() => window.open(`/api/v1/orders/${orderId}/print`, "_blank")}
              className="flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium py-1.5 px-2 shadow-2xs transition cursor-pointer"
              title="Print Web Invoice"
            >
              <FigmaIcon name="icon-printer" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {showModal && imgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[92vh] max-w-[850px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Official Paid Invoice · {invNo}
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2 py-0.5">
                  Verified Paid
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={imgUrl}
                  download={`${invNo}_receipt.png`}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-xs transition"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Image
                </a>
                {orderId && (
                  <button
                    onClick={() => window.open(`/api/v1/orders/${orderId}/print`, "_blank")}
                    className="rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <FigmaIcon name="icon-printer" size={14} />
                    Print
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(92vh-65px)] flex justify-center bg-slate-100 dark:bg-[#070b14]">
              <img
                src={imgUrl}
                alt={`Invoice ${invNo}`}
                className="rounded-xl shadow-lg max-w-full h-auto object-contain border border-slate-200 dark:border-white/10"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SlipThumb({ m }: { m: Message }) {
  const amount = (m.meta.amount as number | undefined) ?? null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111a2e] p-2.5 shadow-2xs">
      {m.attachment_url && !m.attachment_url.startsWith("telegram:") ? (
        <img
          src={m.attachment_url}
          alt="Payment slip"
          className="max-h-64 w-[200px] rounded-xl object-cover border border-slate-100 dark:border-white/10"
        />
      ) : (
        <div className="flex w-[200px] flex-col items-center gap-2 rounded-xl bg-slate-50 dark:bg-[#0c1322] p-3.5 border border-slate-100 dark:border-white/10">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-center text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30">
            {(m.meta.bank as string) ?? "ABA / Bakong Slip"}
          </span>
          <FigmaIcon name="icon-check-success" size={24} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-[17px] font-bold text-slate-900 dark:text-white">
            {amount !== null ? `${amount.toFixed(2)} USD` : "Verified"}
          </span>
          {m.meta.receiver && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              to {m.meta.receiver as string}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const WAVE = [8, 14, 20, 12, 18, 24, 10, 16, 22, 12, 8, 14, 20, 10, 6, 12, 18, 8];

function Voice({ m, dark }: { m: Message; dark: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-2xs",
        dark
          ? "bg-blue-600 dark:bg-indigo-600 text-white"
          : "border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111a2e] text-slate-800 dark:text-slate-200"
      )}
    >
      {m.attachment_url ? (
        <audio src={m.attachment_url} controls className="h-8 w-48" />
      ) : (
        <>
          <span
            className={clsx(
              "rounded-full p-1.5",
              dark ? "bg-white text-blue-600 dark:bg-indigo-900 dark:text-indigo-200" : "bg-blue-50 dark:bg-indigo-900/50 text-blue-600 dark:text-indigo-300"
            )}
          >
            <FigmaIcon name="icon-play-brand" size={14} />
          </span>
          <span className="flex items-center gap-[3px]">
            {WAVE.map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-sm bg-current"
                style={{ height: h }}
              />
            ))}
          </span>
          <span className="text-xs font-semibold">Voice note</span>
        </>
      )}
    </div>
  );
}
