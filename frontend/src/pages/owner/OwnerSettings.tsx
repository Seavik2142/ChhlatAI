import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Building,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Music2,
  Phone,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Sun,
  Tag,
  User as UserIcon,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { api, tokenStore } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { PLATFORM_NAME } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import { ThemeSegmentedControl } from "../../lib/theme";
import { BrandLogo } from "../../components/ui/BrandLogo";
import type {
  Channel as ChannelT,
  ChannelTestResult,
  PaymentHistoryItem,
  PaymentProvider,
  Platform,
  Plan,
  Shop,
  TelegramUserConfig,
  TelegramUserSendCodeResponse,
  TelegramUserVerifyResponse,
  TelegramVerifyResult,
  User,
} from "../../lib/types";

type Tab = "channels" | "staff" | "payments" | "shop" | "security" | "subscription";


export function OwnerSettings() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const activeTab: Tab =
    tabParam && ["channels", "staff", "payments", "shop", "security", "subscription"].includes(tabParam)
      ? tabParam
      : "channels";

  const setTab = (t: Tab) => {
    setSearchParams({ tab: t });
  };

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const channelsQuery = useQuery({ queryKey: ["channels"], queryFn: () => api.get<ChannelT[]>("/shop/channels") });
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: () => api.get<User[]>("/shop/staff") });

  const currentPlan = shopQuery.data?.plan;
  const connectedChannels = channelsQuery.data?.filter((c) => c.is_connected).length ?? 0;
  const staffCount = staffQuery.data?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === "km" ? "ការកំណត់ហាង & ប្រព័ន្ធ" : "Shop Settings & Integrations"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {language === "km"
              ? "គ្រប់គ្រងបណ្តាញផ្ញើសារ បុគ្គលិកឆាត វិធីសាស្ត្រទូទាត់ និងច្បាប់ឆ្លើយតបរបស់ AI Auto-Pilot"
              : "Channels, chat team staff, payment gateways, delivery rates, and AI Auto-Pilot instructions."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 self-start sm:self-auto overflow-x-auto">
          <button
            id="tab-channels"
            data-testid="tab-channels"
            onClick={() => setTab("channels")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "channels"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Radio size={14} className={activeTab === "channels" ? "text-emerald-600" : "text-slate-400"} />
            <span>Channels ({connectedChannels})</span>
          </button>

          <button
            id="tab-staff"
            data-testid="tab-staff"
            onClick={() => setTab("staff")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "staff"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Users size={14} className={activeTab === "staff" ? "text-indigo-600" : "text-slate-400"} />
            <span>Staff ({staffCount})</span>
          </button>

          <button
            id="tab-payments"
            data-testid="tab-payments"
            onClick={() => setTab("payments")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "payments"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <CreditCard size={14} className={activeTab === "payments" ? "text-purple-600" : "text-slate-400"} />
            <span>Payments</span>
          </button>

          <button
            id="tab-shop"
            data-testid="tab-shop"
            onClick={() => setTab("shop")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "shop"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Store size={14} className={activeTab === "shop" ? "text-teal-600" : "text-slate-400"} />
            <span>Shop & AI Policies</span>
          </button>

          <button
            id="tab-security"
            data-testid="tab-security"
            onClick={() => setTab("security")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "security"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <ShieldCheck size={14} className={activeTab === "security" ? "text-blue-600" : "text-slate-400"} />
            <span>{language === "km" ? "គណនី & សុវត្ថិភាព" : "Profile & Security"}</span>
          </button>

          <button
            id="tab-subscription"
            data-testid="tab-subscription"
            onClick={() => setTab("subscription")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === "subscription"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Layers size={14} className={activeTab === "subscription" ? "text-indigo-600" : "text-slate-400"} />
            <span>{language === "km" ? "កញ្ចប់សេវា & ការជាវ" : "Subscription & Plans"}</span>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 uppercase">
              {currentPlan?.name || "Free"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Active Tab View ── */}
      {activeTab === "channels" && <ChannelsSection />}
      {activeTab === "staff" && <StaffSection />}
      {activeTab === "payments" && <PaymentsSection />}
      {activeTab === "shop" && <ShopFormSection />}
      {activeTab === "security" && <ProfileSecuritySection />}
      {activeTab === "subscription" && <SubscriptionSection />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 1. Messaging Channels Section
// ──────────────────────────────────────────────────────────────────

const CHANNEL_HELP: Record<Platform, { desc: string; guide: string; oauthTitle: string }> = {
  telegram: {
    desc: "Connect your Telegram channel via 1-click Telegram OAuth 2.0, personal/shop phone number (MTProto), or @BotFather bot.",
    guide: "Authorize with 1-click Telegram OAuth 2.0 to link instantly, or connect your personal/shop phone account with your Telegram App credentials.",
    oauthTitle: "Connect Telegram (OAuth 2.0)",
  },
  facebook: {
    desc: "Connect your official Facebook Page inbox with 1-click Meta OAuth 2.0 to automate chat inquiries and orders.",
    guide: "Log in with Meta OAuth 2.0 to grant Page messaging permissions. Select your shop page from the discovered list.",
    oauthTitle: "Connect Facebook Page (OAuth 2.0)",
  },
  instagram: {
    desc: "Direct messages from Instagram Business or Creator profiles linked through Meta Graph API.",
    guide: "Log in with Meta OAuth 2.0 and select your connected Instagram Business account with direct messaging enabled.",
    oauthTitle: "Connect Instagram (OAuth 2.0)",
  },
  tiktok: {
    desc: "TikTok Shop messaging synchronization for merchant customer inquiries and order notifications.",
    guide: "Authorize via TikTok Shop Open Platform OAuth 2.0 to sync customer messages into your unified Live Inbox.",
    oauthTitle: "Connect TikTok Shop (OAuth 2.0)",
  },
};

function ChannelsSection() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const list = useQuery({ queryKey: ["channels"], queryFn: () => api.get<ChannelT[]>("/shop/channels") });
  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop/me") });

  const [activeTelegramModalTab, setActiveTelegramModalTab] = useState<"user" | "oauth" | "bot" | null>(null);
  const [testingChannelId, setTestingChannelId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, ChannelTestResult>>({});
  const [channelToast, setChannelToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const justConnected = searchParams.get("just_connected");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setChannelToast({ message, type });
    setTimeout(() => setChannelToast(null), 3500);
  };

  useEffect(() => {
    if (justConnected) {
      showToast(
        `🎉 Successfully connected to ${PLATFORM_NAME[justConnected as Platform] || justConnected}! Messages are now streaming live.`,
        "success"
      );
      const next = new URLSearchParams(searchParams);
      next.delete("just_connected");
      setSearchParams(next, { replace: true });
    }
  }, [justConnected]);

  const done = () => {
    void qc.invalidateQueries({ queryKey: ["channels"] });
    void qc.invalidateQueries({ queryKey: ["shop"] });
  };

  const handleDirectOAuthConnect = (platform: "facebook" | "instagram" | "tiktok" | "telegram") => {
    const token = tokenStore.get();
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    window.location.href = `/api/auth/${platform}${query}`;
  };

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.del(`/shop/channels/${id}`),
    onSuccess: () => {
      done();
      showToast("Channel disconnected successfully.");
    },
    onError: (err: any) => showToast(err?.message || "Failed to disconnect channel", "error"),
  });

  const testConnection = async (channelId: number) => {
    setTestingChannelId(channelId);
    try {
      const res = await api.post<ChannelTestResult>(`/shop/channels/${channelId}/test-connection`, {});
      setTestResults((prev) => ({ ...prev, [channelId]: res }));
      if (res.ok) {
        showToast(`Connection healthy! Response latency: ${res.latency_ms}ms`);
      } else {
        showToast(`Connection warning: ${res.status}`, "error");
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to test channel connection", "error");
    } finally {
      setTestingChannelId(null);
    }
  };

  const channels = list.data ?? [];
  const connectedCount = channels.filter((c) => c.is_connected).length;
  const channelLimit = shopQuery.data?.plan?.channels_limit ?? 4;
  const isLimitReached = connectedCount >= channelLimit;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {channelToast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3 duration-200",
            channelToast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-950/20"
              : "bg-rose-600 text-white shadow-rose-950/20"
          )}
        >
          {channelToast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{channelToast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Connected Messaging Inboxes</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              <ShieldCheck size={12} />
              OAuth 2.0 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Connect Facebook Messenger, Instagram DM, TikTok Shop, and Telegram Bot with 1-click OAuth 2.0.
            No technical developer tokens required. All messages flow directly into your real-time Live Inbox with AI Auto-Pilot replies and NBC KHQR billing.
          </p>
        </div>

        {/* Plan Channel Limit Indicator */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">Plan Capacity</span>
            <span className="text-xs font-bold text-slate-800">
              {connectedCount} of {channelLimit >= 99 ? "Unlimited" : channelLimit} Channels
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="size-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {Math.round((connectedCount / (channelLimit >= 99 ? 10 : channelLimit)) * 100)}%
          </div>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {(["facebook", "telegram", "instagram", "tiktok"] as Platform[]).map((p) => {
          const connected = channels.filter((c) => c.platform === p && c.is_connected);
          const isConnected = connected.length > 0;

          return (
            <div
              key={p}
              className={clsx(
                "rounded-2xl border bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 transition",
                isConnected ? "border-slate-200 hover:border-slate-300" : "border-slate-200/60"
              )}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <BrandLogo brand={p} size={42} rounded="xl" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{PLATFORM_NAME[p]}</h3>
                        {p === "facebook" && (
                          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60">
                            Meta
                          </span>
                        )}
                        {p === "instagram" && (
                          <span className="text-[10px] font-semibold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-200/60">
                            Graph API
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p === "telegram"
                          ? "Telegram Bot & Customer Chats"
                          : p === "facebook"
                          ? "Facebook Messenger & Page Inbox"
                          : p === "instagram"
                          ? "Instagram Direct Messaging"
                          : "TikTok Shop Merchant Chats"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-slate-100 text-slate-500 border border-slate-200/60"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {isConnected ? `Connected (${connected.length})` : "Disconnected"}
                  </span>
                </div>

                {/* Connected Accounts List */}
                {connected.length > 0 && (
                  <div className="mt-3.5 space-y-2.5">
                    {connected.map((c) => {
                      const avatar = c.meta_info?.avatar_url;
                      const testRes = testResults[c.id];
                      const isTesting = testingChannelId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={c.name}
                                  className="size-8 rounded-lg object-cover border border-slate-200 shadow-2xs"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 block truncate">{c.name}</span>
                                  {c.platform === "telegram" && (
                                    c.meta_info?.type === "user" ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                        <UserIcon size={9} /> Normal Account
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        <Bot size={9} /> Bot
                                      </span>
                                    )
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  {c.meta_info?.phone ? `${c.meta_info.phone} · ` : ""}ID: {c.external_id || "configured"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => testConnection(c.id)}
                                disabled={isTesting}
                                title="Ping connection & webhook status"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 px-2 py-1 rounded-lg transition cursor-pointer"
                              >
                                <Activity size={12} className={isTesting ? "animate-spin text-emerald-600" : "text-slate-400"} />
                                <span>{isTesting ? "Testing..." : "Test Ping"}</span>
                              </button>

                              <button
                                onClick={() => removeMutation.mutate(c.id)}
                                disabled={removeMutation.isPending}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>

                          {/* Account metadata & health tags */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100/60 text-emerald-800">
                              <ShieldCheck size={10} />
                              OAuth 2.0 Verified
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700">
                              <Zap size={10} className="text-amber-500" />
                              Webhook Active
                            </span>
                            {testRes && (
                              <span
                                className={clsx(
                                  "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md",
                                  testRes.ok
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                )}
                              >
                                <span className="size-1.5 rounded-full bg-current" />
                                {testRes.ok ? `Healthy (${testRes.latency_ms}ms)` : testRes.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-500 leading-relaxed">{CHANNEL_HELP[p].desc}</p>
                <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">💡</span>
                  <span className="leading-relaxed">{CHANNEL_HELP[p].guide}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
                {p === "facebook" && (
                  <button
                    type="button"
                    onClick={() => handleDirectOAuthConnect("facebook")}
                    disabled={isLimitReached}
                    className="group relative flex-1 sm:flex-initial inline-flex items-center justify-between gap-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-black text-xs shadow-2xs">
                        f
                      </div>
                      <span>{connected.length > 0 ? "+ Connect Another Page" : "+ Connect Messenger"}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs tracking-wide">
                      OAuth 2.0
                    </span>
                  </button>
                )}

                {p === "instagram" && (
                  <button
                    type="button"
                    onClick={() => handleDirectOAuthConnect("instagram")}
                    disabled={isLimitReached}
                    className="group relative flex-1 sm:flex-initial inline-flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:brightness-105 active:scale-[0.98] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Camera size={15} className="text-white" />
                      <span>{connected.length > 0 ? "+ Connect Another Account" : "+ Connect Instagram"}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs tracking-wide">
                      OAuth 2.0
                    </span>
                  </button>
                )}

                {p === "tiktok" && (
                  <button
                    type="button"
                    onClick={() => handleDirectOAuthConnect("tiktok")}
                    disabled={isLimitReached}
                    className="group relative flex-1 sm:flex-initial inline-flex items-center justify-between gap-3 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-[0.98] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Music2 size={15} className="text-white" />
                      <span>{connected.length > 0 ? "+ Connect Another Shop" : "+ Connect TikTok"}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white tracking-wide">
                      OAuth 2.0
                    </span>
                  </button>
                )}

                {p === "telegram" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTelegramModalTab("user")}
                      disabled={isLimitReached}
                      className="group relative flex-1 sm:flex-initial inline-flex items-center justify-between gap-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] active:scale-[0.98] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone size={15} className="text-white" />
                        <span>{connected.length > 0 ? "+ Connect Personal Account" : "+ Connect Normal Account"}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs tracking-wide">
                        Phone MTProto
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTelegramModalTab("oauth")}
                      disabled={isLimitReached}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/80 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      title="Connect Telegram Bot (OAuth 2.0 or Bot Token)"
                    >
                      <Bot size={13} className="text-sky-600 dark:text-sky-400" />
                      <span>Bot / OAuth</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Telegram Setup Modal */}
      {activeTelegramModalTab && (
        <TelegramConnectionModal
          initialTab={activeTelegramModalTab}
          onClose={() => setActiveTelegramModalTab(null)}
          onSuccess={(accountName) => {
            done();
            setActiveTelegramModalTab(null);
            showToast(accountName ? `Connected: ${accountName}` : "Telegram connected successfully!");
          }}
          onDirectOAuth={() => handleDirectOAuthConnect("telegram")}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Telegram Connection Modal (OAuth 2.0, Normal User Account & Bot)
// ──────────────────────────────────────────────────────────────────

function TelegramConnectionModal({
  initialTab = "user",
  onClose,
  onSuccess,
  onDirectOAuth,
}: {
  initialTab?: "user" | "oauth" | "bot";
  onClose: () => void;
  onSuccess: (accountName?: string) => void;
  onDirectOAuth?: () => void;
}) {
  const [tab, setTab] = useState<"user" | "bot" | "oauth">(initialTab);

  // User MTProto state
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [showCustomCreds, setShowCustomCreds] = useState(false);
  const [userStep, setUserStep] = useState<"phone" | "code">("phone");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [userSuccess, setUserSuccess] = useState<TelegramUserVerifyResponse | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userNotice, setUserNotice] = useState<string | null>(null);

  // Server credentials config
  const [serverConfig, setServerConfig] = useState<TelegramUserConfig | null>(null);

  // Bot Token state
  const [botToken, setBotToken] = useState("");
  const [showBotToken, setShowBotToken] = useState(false);
  const [isVerifyingBot, setIsVerifyingBot] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [botSuccess, setBotSuccess] = useState<TelegramVerifyResult | null>(null);
  const [copiedBotFather, setCopiedBotFather] = useState(false);

  useEffect(() => {
    api
      .get<TelegramUserConfig>("/shop/oauth/telegram-user/config")
      .then((cfg) => {
        setServerConfig(cfg);
        if (!cfg.has_app_credentials) {
          setShowCustomCreds(true);
        }
      })
      .catch(() => {
        setShowCustomCreds(true);
      });
  }, []);

  const handleSendCode = async () => {
    if (!phone.trim()) return;
    setIsSendingCode(true);
    setUserError(null);
    setUserNotice(null);

    try {
      const res = await api.post<TelegramUserSendCodeResponse>(
        "/shop/oauth/telegram-user/send-code",
        {
          phone: phone.trim(),
          api_id: showCustomCreds && apiId.trim() ? apiId.trim() : undefined,
          api_hash: showCustomCreds && apiHash.trim() ? apiHash.trim() : undefined,
        }
      );

      if (res.ok) {
        setUserStep("code");
        setUserNotice(res.message || `Login code sent to ${res.phone}. Check your Telegram app.`);
      } else {
        setUserError(res.error || "Failed to send Telegram login code. Check your phone number & API credentials.");
      }
    } catch (e: any) {
      setUserError(e?.message || "Failed to request code. Check phone number and try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return;
    setIsVerifyingCode(true);
    setUserError(null);

    try {
      const res = await api.post<TelegramUserVerifyResponse>(
        "/shop/oauth/telegram-user/verify-code",
        {
          phone: phone.trim(),
          code: code.trim(),
          password: password.trim() || undefined,
          api_id: showCustomCreds && apiId.trim() ? apiId.trim() : undefined,
          api_hash: showCustomCreds && apiHash.trim() ? apiHash.trim() : undefined,
        }
      );

      if (res.ok) {
        setUserSuccess(res);
        const name = res.user?.name || res.user?.username || res.user?.phone;
        setTimeout(() => onSuccess(name), 1200);
      } else if (res.requires_password) {
        setRequiresPassword(true);
        setUserError(res.error || "2FA Cloud Password required for this account. Enter your password below.");
      } else {
        setUserError(res.error || "Verification failed. Check your login code.");
      }
    } catch (e: any) {
      setUserError(e?.message || "Verification failed.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleVerifyBot = async () => {
    if (!botToken.trim()) return;
    setIsVerifyingBot(true);
    setBotError(null);
    try {
      const res = await api.post<TelegramVerifyResult>("/shop/oauth/telegram-verify", {
        bot_token: botToken.trim(),
      });
      if (res.ok) {
        setBotSuccess(res);
        const name = res.bot_username || res.bot_name || "Telegram Bot";
        setTimeout(() => onSuccess(name), 1000);
      } else {
        setBotError(res.error || "Telegram bot verification failed.");
      }
    } catch (e: any) {
      setBotError(e?.message || "Verification failed. Check your bot token.");
    } finally {
      setIsVerifyingBot(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBotFather(true);
    setTimeout(() => setCopiedBotFather(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Accent Top Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#2AABEE] via-[#229ED9] to-[#0088cc]" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center border border-[#229ED9]/25 shadow-xs shrink-0">
              <Send size={20} className="-rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Connect Telegram</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                  <Sparkles size={11} />
                  AI Auto-Pilot
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Connect your personal phone number or bot for automated customer chat &amp; NBC KHQR billing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Segmented Mode Selector */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {/* Tab 1: Personal Phone MTProto */}
            <button
              type="button"
              onClick={() => {
                setTab("user");
                setUserError(null);
              }}
              className={clsx(
                "flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                tab === "user"
                  ? "bg-white dark:bg-slate-700 text-[#0088cc] dark:text-sky-300 shadow-xs border border-slate-200/80 dark:border-slate-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Smartphone size={14} className={tab === "user" ? "text-[#0088cc]" : "text-slate-400"} />
              <div className="text-center sm:text-left min-w-0">
                <span className="block leading-tight truncate">Personal Phone</span>
                <span className="text-[9.5px] font-medium opacity-75 block">Direct MTProto</span>
              </div>
            </button>

            {/* Tab 2: Telegram Bot (@BotFather) */}
            <button
              type="button"
              onClick={() => {
                setTab("bot");
                setBotError(null);
              }}
              className={clsx(
                "flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                tab === "bot"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Bot size={14} className={tab === "bot" ? "text-indigo-600" : "text-slate-400"} />
              <div className="text-center sm:text-left min-w-0">
                <span className="block leading-tight truncate">Telegram Bot</span>
                <span className="text-[9.5px] font-medium opacity-75 block">@BotFather</span>
              </div>
            </button>

            {/* Tab 3: 1-Click OAuth */}
            <button
              type="button"
              onClick={() => setTab("oauth")}
              className={clsx(
                "flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                tab === "oauth"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs border border-slate-200/80 dark:border-slate-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Zap size={14} className={tab === "oauth" ? "text-amber-500" : "text-slate-400"} />
              <div className="text-center sm:text-left min-w-0">
                <span className="block leading-tight truncate">1-Click OAuth</span>
                <span className="text-[9.5px] font-medium opacity-75 block">Web Login</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-5 pt-3 overflow-y-auto space-y-4">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: PERSONAL PHONE (MTPROTO)                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === "user" && (
            <div className="space-y-4">
              {/* MTProto Server Status Banner */}
              {serverConfig?.has_app_credentials ? (
                <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950 dark:text-emerald-200">
                        <span>MTProto Core Connected</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                          App ID: {serverConfig.api_id_hint || "Configured"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomCreds(!showCustomCreds)}
                        className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                      >
                        {showCustomCreds ? "Hide Custom" : "Override"}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed mt-0.5">
                      Server API credentials are active in <code>.env</code>. Just authenticate your phone number to start receiving customer direct messages.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Optional Custom API Credentials Drawer */}
              {showCustomCreds && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <KeyRound size={16} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-200">Custom Telegram App API Keys (MTProto)</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5">
                        Get free <strong>api_id</strong> and <strong>api_hash</strong> from{" "}
                        <a
                          href="https://my.telegram.org"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100 inline-flex items-center gap-0.5"
                        >
                          my.telegram.org <ExternalLink size={10} />
                        </a>{" "}
                        (Log in &gt; API development tools).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">App api_id</label>
                      <input
                        type="text"
                        value={apiId}
                        onChange={(e) => setApiId(e.target.value)}
                        placeholder="e.g. 35142169"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">App api_hash secret</label>
                      <input
                        type="password"
                        value={apiHash}
                        onChange={(e) => setApiHash(e.target.value)}
                        placeholder="e.g. 99e3221217e6..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: Enter Phone Number */}
              {userStep === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-[#0088cc]" />
                        Telegram Phone Number
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        Cambodia (+855) or International
                      </span>
                    </label>

                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-[#0088cc] focus-within:ring-2 focus-within:ring-sky-500/20 transition overflow-hidden shadow-2xs">
                      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        <span>🇰🇭</span>
                        <span>+855 / Tel</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                        placeholder="012 345 678 or +855 12 345 678"
                        autoFocus
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-medium bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-center gap-1.5 pt-0.5">
                      <Info size={12} className="shrink-0 text-slate-400" />
                      <span>Telegram will send an official 5-digit verification code directly to your Telegram app.</span>
                    </p>
                  </div>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <UserIcon size={13} className="text-sky-600" />
                        <span>Direct Customer Chat</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Customers message your personal @username or phone number without needing to find a bot.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <Bot size={13} className="text-purple-600" />
                        <span>Auto-Pilot &amp; KHQR</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        AI autonomously handles inquiries, product advice, and generates Bakong KHQR invoices 24/7.
                      </p>
                    </div>
                  </div>

                  {/* End-to-End MTProto Security Card */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Bank-Grade MTProto Session Encryption:</strong> Your authenticated Telegram session string is securely stored in isolated tenant memory. We only handle customer queries and never touch your private personal chats.
                    </p>
                  </div>

                  {userError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{userError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSendingCode || !phone.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-[0.98] text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSendingCode ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Sending Telegram Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Login Code</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Verification Code & 2FA */}
              {userStep === "code" && (
                <div className="space-y-4">
                  {userNotice && (
                    <div className="flex items-center justify-between rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-3 text-xs text-sky-900 dark:text-sky-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0 text-sky-600 dark:text-sky-400" />
                        <span>{userNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserStep("phone");
                          setCode("");
                          setPassword("");
                          setUserError(null);
                        }}
                        className="text-[11px] text-[#0088cc] hover:underline font-bold cursor-pointer shrink-0 ml-2"
                      >
                        Change Phone
                      </button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-5 text-center space-y-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Enter 5-Digit Telegram Verification Code
                    </label>

                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                      placeholder="• • • • •"
                      maxLength={8}
                      autoFocus
                      className="w-48 mx-auto text-center text-2xl font-mono font-black tracking-[0.4em] px-4 py-2.5 rounded-xl border-2 border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-sky-500/20 shadow-xs"
                    />

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Check your <strong>Telegram app</strong> notifications. The official Telegram service sends this code instantly.
                    </p>
                  </div>

                  {requiresPassword && (
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                      <label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <Lock size={13} className="text-amber-600" />
                        <span>Two-Step Verification (2FA Cloud Password)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                          placeholder="Your 2FA cloud password"
                          className="w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono outline-none focus:border-amber-500 pr-10 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <p className="text-[10.5px] text-amber-700 dark:text-amber-300">
                        This account has Two-Step Verification enabled on Telegram.
                      </p>
                    </div>
                  )}

                  {userError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{userError}</span>
                    </div>
                  )}

                  {userSuccess?.ok && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Connected successfully as {userSuccess.user?.name} ({userSuccess.user?.phone})!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setUserStep("phone")}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifyingCode || !code.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-[0.98] text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingCode ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Verifying &amp; Linking...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Verify &amp; Link Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: TELEGRAM BOT (@BOTFATHER)                             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === "bot" && (
            <div className="space-y-4">
              {/* Bot Setup Guide */}
              <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <Bot size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>How to connect your custom Telegram Bot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950 space-y-1">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block">1. Open @BotFather</span>
                    <p className="text-slate-500 dark:text-slate-400">Search on Telegram and press Start</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard("@BotFather")}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Copy size={10} />
                        <span>{copiedBotFather ? "Copied!" : "Copy Handle"}</span>
                      </button>
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Open</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950 space-y-1">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block">2. Run /newbot</span>
                    <p className="text-slate-500 dark:text-slate-400">Name your bot and choose a username ending in _bot</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950 space-y-1">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 block">3. Copy API Token</span>
                    <p className="text-slate-500 dark:text-slate-400">Paste the token provided by @BotFather below</p>
                  </div>
                </div>
              </div>

              {/* Bot Token Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Bot HTTP API Token</span>
                  <span className="text-[11px] font-normal text-slate-400">e.g. 123456789:AAFdj...</span>
                </label>
                <div className="relative">
                  <input
                    type={showBotToken ? "text" : "password"}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyBot()}
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-mono pr-10 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showBotToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Feature highlights for Bot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Official Bot API 7.0+</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Direct HTTPS webhook integration with zero polling overhead and instant message reception.
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Bot size={13} className="text-purple-600" />
                    <span>Brand Automation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Perfect for custom brand bots, interactive menu buttons, and automated payment receipts.
                  </p>
                </div>
              </div>

              {botError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{botError}</span>
                </div>
              )}

              {botSuccess?.ok && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified @{botSuccess.bot_username || botSuccess.bot_name || "Bot"}! Webhook registered and active.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyBot}
                  disabled={isVerifyingBot || !botToken.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingBot ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying &amp; Registering...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={14} />
                      <span>Register Bot Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: 1-CLICK OAUTH 2.0                                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === "oauth" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 border border-sky-200/80 dark:border-sky-800/60 p-5 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                    <Send size={18} className="-rotate-12" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>1-Click Telegram OAuth 2.0</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                        Official Flow
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Secure Web Authorization with Automated Webhook Linking</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Authorize your Telegram channel in one click without manually generating or configuring API keys. You will be redirected to confirm permissions securely via Telegram.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/90 p-2.5 rounded-xl border border-sky-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Instant Live Sync</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/90 p-2.5 rounded-xl border border-sky-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>AI Auto-Pilot Replies</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/90 p-2.5 rounded-xl border border-sky-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Bakong KHQR Billing</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/90 p-2.5 rounded-xl border border-sky-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Automated Webhook</span>
                  </div>
                </div>
              </div>

              {/* OAuth 2.0 Security Card */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck size={16} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Standard Web OAuth 2.0 Protocol:</strong> Authenticate directly through Telegram's official web login dialog. No passwords or app credentials are exposed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onDirectOAuth) onDirectOAuth();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-[0.98] text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Send size={13} className="-rotate-12" />
                  <span>Authorize with Telegram (OAuth 2.0)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




// ──────────────────────────────────────────────────────────────────
// 2. Staff & Team Members Section
// ──────────────────────────────────────────────────────────────────


function StaffSection() {
  const qc = useQueryClient();
  const listQuery = useQuery({ queryKey: ["staff"], queryFn: () => api.get<User[]>("/shop/staff") });
  const staff = listQuery.data ?? [];

  const [form, setForm] = useState({ full_name: "", email: "", password: "", commission_rate: 3 });
  const [notice, setNotice] = useState<string | null>(null);

  const done = () => void qc.invalidateQueries({ queryKey: ["staff"] });

  const addMutation = useMutation({
    mutationFn: () => api.post("/shop/staff", form),
    onSuccess: () => {
      done();
      setForm({ full_name: "", email: "", password: "", commission_rate: 3 });
      setNotice("Staff account created successfully.");
      setTimeout(() => setNotice(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...b }: { id: number; is_active?: boolean; commission_rate?: number }) =>
      api.patch(`/shop/staff/${id}`, b),
    onSuccess: done,
  });

  return (
    <div className="space-y-4">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Staff Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chat Agents & Team Members</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff can take over chats, create manual orders, and receive sales commission.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {staff.length} member(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {staff.map((u) => {
              const isOwner = u.role === "owner";
              return (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs">
                      {u.full_name?.slice(0, 2).toUpperCase() || "ST"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{u.full_name}</span>
                        {isOwner ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200/60 uppercase">
                            Owner
                          </span>
                        ) : (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 border border-indigo-200/60 uppercase">
                            Staff Agent
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{u.email}</span>
                    </div>
                  </div>

                  {!isOwner && (
                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">Commission:</span>
                        <input
                          type="number"
                          defaultValue={u.commission_rate ?? 0}
                          onBlur={(e) =>
                            updateMutation.mutate({ id: u.id, commission_rate: Number(e.target.value) })
                          }
                          className="h-7 w-14 rounded-lg border border-slate-200 px-2 text-center text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>

                      <button
                        onClick={() => updateMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        className={clsx(
                          "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border",
                          u.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Staff Card (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Add Chat Agent</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Sreynoch Mean"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="agent@store.kh"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {addMutation.error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {addMutation.error.message}
            </p>
          )}

          <button
            disabled={!form.full_name || !form.email || !form.password || addMutation.isPending}
            onClick={() => addMutation.mutate()}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            {addMutation.isPending ? "Adding Staff Member..." : "Create Staff Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 3. Payment Methods & KHQR Gateways Section
// ──────────────────────────────────────────────────────────────────

interface KHQRPreviewResponse {
  provider: string;
  merchant_name: string;
  account_id: string;
  amount: number;
  currency: string;
  bill_number: string;
  khqr: string;
  md5: string;
  crc16: string;
  deep_links: {
    primary?: string;
    bakong_app?: string;
    bakong_web?: string;
    aba_mobile?: string;
    acleda_mobile?: string;
    acleda_web?: string;
    md5?: string;
  };
  image_data_uri: string;
  tags: Array<{
    tag: string;
    name: string;
    length: number;
    value: string;
    subtags?: Array<{ tag: string; name: string; length: number; value: string }>;
  }>;
}

function PaymentsSection() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["providers"], queryFn: () => api.get<PaymentProvider[]>("/shop/payment-providers") });
  const callback = useQuery({ queryKey: ["callback-url"], queryFn: () => api.get<{ url: string }>("/shop/payment-callback-url") });
  const [editing, setEditing] = useState<(PaymentProvider & { secret?: string }) | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Live KHQR Simulator state
  const [simProvider, setSimProvider] = useState<"bakong" | "aba_payway" | "acleda">("bakong");
  const [simAmount, setSimAmount] = useState<number>(15.5);
  const [simCurrency, setSimCurrency] = useState<"USD" | "KHR">("USD");
  const [simBillNo, setSimBillNo] = useState<string>("INV-1001");
  const [copiedKhqr, setCopiedKhqr] = useState(false);
  const [showTagInspector, setShowTagInspector] = useState(false);

  const done = () => {
    void qc.invalidateQueries({ queryKey: ["providers"] });
    setEditing(null);
  };

  const saveMutation = useMutation({
    mutationFn: (p: PaymentProvider & { secret?: string }) =>
      api.put(`/shop/payment-providers/${p.provider}`, {
        environment: p.environment,
        merchant_name: p.merchant_name,
        account_id: p.account_id,
        secret: p.secret,
        use_for_invoices: p.use_for_invoices,
      }),
    onSuccess: done,
  });

  const previewMutation = useMutation({
    mutationFn: (body: {
      provider: string;
      merchant_name?: string;
      account_id?: string;
      amount: number;
      currency: string;
      bill_number: string;
    }) => api.post<KHQRPreviewResponse>("/shop/generate-khqr-preview", body),
  });

  const providers = list.data ?? [];
  const activeInvoiceProvider = providers.find((p) => p.is_connected && p.use_for_invoices) || providers.find((p) => p.is_connected);

  const handleCopyCallback = () => {
    if (callback.data?.url) {
      navigator.clipboard.writeText(callback.data.url);
      setCopiedCallback(true);
      setTimeout(() => setCopiedCallback(false), 2500);
    }
  };

  const handleCopyKhqr = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedKhqr(true);
      setTimeout(() => setCopiedKhqr(false), 2000);
    }
  };

  const runTestPreview = (overrideProvider?: "bakong" | "aba_payway" | "acleda") => {
    const provKey = overrideProvider || simProvider;
    const targetProv = providers.find((p) => p.provider === provKey);
    previewMutation.mutate({
      provider: provKey,
      merchant_name: targetProv?.merchant_name || undefined,
      account_id: targetProv?.account_id || undefined,
      amount: simAmount,
      currency: simCurrency,
      bill_number: simBillNo,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner & Documentation Links ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-rose-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wider text-white">
                KHQR
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                National KHQR & Auto-Sent Payment Gateways
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Configure your Cambodian merchant accounts. When orders are created via chat or bot, Chhlat AI automatically builds dynamic EMVCo KHQR codes and dispatches them with instant banking app deep links directly to your customers.
            </p>
          </div>

          {/* Official Documentation Links Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://github.com/bsthen/bakong-khqr"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:text-rose-600 transition shadow-2xs"
            >
              <BrandLogo brand="bakong" size={16} rounded="sm" />
              <span>Bakong API</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <a
              href="https://developer.payway.com.kh/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition shadow-2xs"
            >
              <BrandLogo brand="aba_payway" size={16} rounded="sm" />
              <span>ABA PayWay</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <a
              href="https://toanchetpay.acledabank.com.kh/toanchetpay/api-integration"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 transition shadow-2xs"
            >
              <BrandLogo brand="acleda" size={16} rounded="sm" />
              <span>ACLEDA Pay</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
          </div>
        </div>

        {/* Active Auto-Send Indicator */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-950/20 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Auto-Send KHQR Status:
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {activeInvoiceProvider
                ? `Active · Using ${
                    activeInvoiceProvider.provider === "aba_payway"
                      ? "ABA PayWay"
                      : activeInvoiceProvider.provider === "acleda"
                      ? "ACLEDA Bank"
                      : "Bakong KHQR"
                  }`
                : "No Gateway Active (Configure keys below)"}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Dynamic invoices support all Cambodian banking apps (Bakong, ABA, ACLEDA, Wing, Canadia)
          </span>
        </div>
      </div>

      {/* ── 3 Gateway Configuration Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((p) => {
          const providerName =
            p.provider === "bakong"
              ? "Bakong KHQR"
              : p.provider === "aba_payway"
              ? "ABA PayWay"
              : p.provider === "acleda"
              ? "ACLEDA Bank"
              : String(p.provider).replace(/_/g, " ");

          const providerSubtitle =
            p.provider === "bakong"
              ? "National Bank of Cambodia"
              : p.provider === "aba_payway"
              ? "ABA Mobile / Dynamic Checkout"
              : p.provider === "acleda"
              ? "ToanChet Pay / XPAY Gateway"
              : "Payment Gateway";

          const docsUrl =
            p.provider === "bakong"
              ? "https://github.com/bsthen/bakong-khqr"
              : p.provider === "aba_payway"
              ? "https://developer.payway.com.kh/"
              : "https://toanchetpay.acledabank.com.kh/toanchetpay/api-integration";

          return (
            <div
              key={p.id}
              className={clsx(
                "rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between space-y-4 transition",
                p.use_for_invoices && p.is_connected
                  ? "border-rose-400/80 dark:border-rose-700/60 ring-1 ring-rose-400/20"
                  : "border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
              )}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <BrandLogo brand={p.provider} size={42} rounded="xl" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{providerName}</h3>
                      <p className="text-[11px] text-slate-400">{providerSubtitle}</p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                      p.is_connected
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5"
                    )}
                  >
                    {p.is_connected ? "Configured" : "Unlinked"}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Merchant Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.merchant_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{p.provider === "bakong" ? "Bakong ID:" : "Merchant ID:"}</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{p.account_id || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                      {p.environment}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.methods.map((m) => (
                      <span
                        key={m}
                        className="rounded-md border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Auto-Send on Invoices</span>
                  <input
                    type="checkbox"
                    checked={p.use_for_invoices}
                    onChange={(e) => saveMutation.mutate({ ...p, use_for_invoices: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing({ ...p, secret: "" })}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Configure Keys</span>
                  </button>

                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition shadow-2xs"
                    title="View official API integration docs"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Live Test Dynamic KHQR Playground ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
              ⚡
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Dynamic KHQR Simulator & Tester
              </h3>
              <p className="text-xs text-slate-400">
                Test generate dynamic KHQR, test banking deep links, and inspect EMVCo tags in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={() => runTestPreview()}
            disabled={previewMutation.isPending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {previewMutation.isPending ? "Generating..." : "⚡ Generate Test KHQR"}
          </button>
        </div>

        {/* Input Parameters Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Gateway Target
            </label>
            <select
              value={simProvider}
              onChange={(e) => setSimProvider(e.target.value as any)}
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="bakong">Bakong KHQR</option>
              <option value="aba_payway">ABA PayWay</option>
              <option value="acleda">ACLEDA ToanChet</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Currency
            </label>
            <select
              value={simCurrency}
              onChange={(e) => setSimCurrency(e.target.value as any)}
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="KHR">KHR (៛)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Test Amount
            </label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              step={simCurrency === "USD" ? "0.5" : "1000"}
              min="0.1"
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Invoice Reference
            </label>
            <input
              type="text"
              value={simBillNo}
              onChange={(e) => setSimBillNo(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Generated KHQR Preview Results */}
        {previewMutation.data && (
          <div className="grid md:grid-cols-12 gap-5 pt-2 animate-in fade-in duration-200">
            {/* Left Column: Rendered Official Card Image */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40">
              <img
                src={previewMutation.data.image_data_uri}
                alt="Generated Test KHQR"
                className="max-h-[460px] w-auto rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
              />
              <div className="flex items-center gap-2 mt-3 w-full max-w-[280px]">
                <a
                  href={previewMutation.data.image_data_uri}
                  download={`${simBillNo}_test_khqr.png`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold py-2 transition shadow-xs"
                >
                  Download Image
                </a>
              </div>
            </div>

            {/* Right Column: Deep Links, Checksum, and Tag Inspector */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Validation Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    ✓ CRC16: {previewMutation.data.crc16} (Valid)
                  </span>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 px-2.5 py-1 text-[11px] font-mono text-indigo-700 dark:text-indigo-400">
                    MD5: {previewMutation.data.md5.slice(0, 12)}…
                  </span>
                  <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    Format: EMVCo Dynamic
                  </span>
                </div>

                {/* Deep Link Testing Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Test One-Tap Banking Deeplinks:
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <a
                      href={previewMutation.data.deep_links.aba_mobile}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-2 text-xs font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100 transition"
                    >
                      <BrandLogo brand="aba" size={24} rounded="sm" />
                      <div className="truncate">
                        <span className="block truncate">Open ABA Mobile</span>
                        <span className="block text-[10px] text-blue-500 font-mono truncate">abamobilebank://...</span>
                      </div>
                    </a>

                    <a
                      href={previewMutation.data.deep_links.bakong_app}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-2 text-xs font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 transition"
                    >
                      <BrandLogo brand="bakong" size={24} rounded="sm" />
                      <div className="truncate">
                        <span className="block truncate">Open Bakong App</span>
                        <span className="block text-[10px] text-red-500 font-mono truncate">bakong://qr?...</span>
                      </div>
                    </a>

                    <a
                      href={previewMutation.data.deep_links.acleda_mobile}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
                    >
                      <BrandLogo brand="acleda" size={24} rounded="sm" />
                      <div className="truncate">
                        <span className="block truncate">Open ACLEDA Mobile</span>
                        <span className="block text-[10px] text-amber-500 font-mono truncate">acledamobile://...</span>
                      </div>
                    </a>

                    <a
                      href={previewMutation.data.deep_links.bakong_web}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 p-2 text-xs font-semibold text-slate-800 dark:text-slate-300 hover:bg-slate-100 transition"
                    >
                      <QrCode size={20} className="text-slate-500" />
                      <div className="truncate">
                        <span className="block truncate">NBC Web Checkout</span>
                        <span className="block text-[10px] text-slate-500 font-mono truncate">bakong.nbc.gov.kh/b/...</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Raw KHQR String */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Raw EMVCo Payload:
                    </span>
                    <button
                      onClick={() => handleCopyKhqr(previewMutation.data.khqr)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      {copiedKhqr ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedKhqr ? "Copied String" : "Copy String"}</span>
                    </button>
                  </div>
                  <code className="block max-h-20 overflow-y-auto break-all rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-[11px] font-mono text-slate-800 dark:text-slate-200">
                    {previewMutation.data.khqr}
                  </code>
                </div>

                {/* Tag Inspector Toggle */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowTagInspector(!showTagInspector)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  >
                    <span>{showTagInspector ? "Hide" : "Inspect"} EMVCo TLV Tag Breakdown</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-mono">
                      {previewMutation.data.tags.length} Tags
                    </span>
                  </button>

                  {showTagInspector && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-white/10">
                          <tr>
                            <th className="py-2 px-3">Tag</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Len</th>
                            <th className="py-2 px-3">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                          {previewMutation.data.tags.map((t) => (
                            <tr key={t.tag} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-1.5 px-3 font-bold text-rose-600">{t.tag}</td>
                              <td className="py-1.5 px-3 font-sans text-slate-700 dark:text-slate-300">{t.name}</td>
                              <td className="py-1.5 px-3 text-slate-400">{t.length}</td>
                              <td className="py-1.5 px-3 text-slate-900 dark:text-white break-all">
                                {t.subtags && t.subtags.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {t.subtags.map((st) => (
                                      <div key={st.tag} className="text-[10.5px]">
                                        <span className="text-blue-600">[{st.tag}]</span> {st.name}:{" "}
                                        <span className="font-semibold">{st.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  t.value
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bank Pushback Callback URL card ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Bank Instant Pushback Webhook URL
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active Endpoint
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Provide this callback URL to ABA PayWay or ACLEDA merchant support as your payment return/pushback webhook to receive instant 3-second auto-confirmations.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs font-mono text-slate-800 dark:text-slate-200">
            {callback.data?.url || "Generating webhook URL..."}
          </code>
          <button
            onClick={handleCopyCallback}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer flex-shrink-0"
          >
            {copiedCallback ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedCallback ? "Copied" : "Copy URL"}</span>
          </button>
        </div>
      </div>

      {/* ── Edit Payment Provider Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <BrandLogo brand={editing.provider} size={34} rounded="lg" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                    Configure{" "}
                    {editing.provider === "bakong"
                      ? "Bakong KHQR"
                      : editing.provider === "aba_payway"
                      ? "ABA PayWay"
                      : editing.provider === "acleda"
                      ? "ACLEDA Bank"
                      : String(editing.provider).replace(/_/g, " ")}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {editing.provider === "bakong"
                      ? "Complies with bsthen/bakong-khqr"
                      : editing.provider === "aba_payway"
                      ? "Complies with developer.payway.com.kh"
                      : "Complies with toanchetpay.acledabank.com.kh"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Environment</label>
                <select
                  value={editing.environment}
                  onChange={(e) => setEditing({ ...editing, environment: e.target.value as any })}
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                >
                  <option value="sandbox">Sandbox (Test Mode)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Merchant Name (Displayed on QR card)
                </label>
                <input
                  type="text"
                  value={editing.merchant_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, merchant_name: e.target.value })}
                  placeholder="e.g. GLOW SKIN CAMBODIA"
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editing.provider === "bakong" ? "Bakong Account ID (user@bank)" : "Merchant ID"}
                </label>
                <input
                  type="text"
                  value={editing.account_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, account_id: e.target.value })}
                  placeholder={
                    editing.provider === "bakong"
                      ? "e.g. sreypov@aclb or glowskin@aba"
                      : editing.provider === "aba_payway"
                      ? "e.g. ec001234 or 00123456"
                      : "e.g. 99887766"
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editing.provider === "bakong" ? "Bakong API Bearer Token" : "API Key / Secret Token"}
                </label>
                <input
                  type="password"
                  value={editing.secret ?? ""}
                  onChange={(e) => setEditing({ ...editing, secret: e.target.value })}
                  placeholder="Leave empty to keep existing key"
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Current key: {editing.secret_masked || "None"}.
                </p>
              </div>

              {saveMutation.error && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {saveMutation.error.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
              <a
                href={
                  editing.provider === "bakong"
                    ? "https://github.com/bsthen/bakong-khqr"
                    : editing.provider === "aba_payway"
                    ? "https://developer.payway.com.kh/"
                    : "https://toanchetpay.acledabank.com.kh/toanchetpay/api-integration"
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11.5px] font-semibold text-rose-600 hover:text-rose-700"
              >
                <span>Integration Docs</span>
                <ExternalLink size={12} />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(editing)}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 4. Shop Profile & AI Policies Section
// ──────────────────────────────────────────────────────────────────

function ShopFormSection() {
  const qc = useQueryClient();
  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const [f, setF] = useState<Shop | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (shopQuery.data) setF(shopQuery.data);
  }, [shopQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (s: Partial<Shop>) => api.patch<Shop>("/shop", s),
    onSuccess: (s) => {
      qc.setQueryData(["shop"], s);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  if (!f) return null;

  const handleDeliveryFeeChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({
      ...f,
      delivery_fees: { ...f.delivery_fees, [k]: Number(e.target.value) },
    });
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>Shop settings and AI rules updated successfully!</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Store Profile & Delivery Pricing */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building size={16} className="text-slate-700" />
            <span>Store Profile & Delivery Rates</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Shop Name *</label>
            <input
              type="text"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Category</label>
            <input
              type="text"
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="text"
              value={f.phone ?? ""}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
              placeholder="+855 12 345 678"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup / Warehouse Address</label>
            <input
              type="text"
              value={f.address ?? ""}
              onChange={(e) => setF({ ...f, address: e.target.value })}
              placeholder="e.g. St 271, Sangkat Boeng Tumpun, Phnom Penh"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Delivery Pricing */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Default Delivery Fees (USD)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Phnom Penh</label>
                <input
                  type="number"
                  step="0.1"
                  value={f.delivery_fees?.phnom_penh ?? 1.5}
                  onChange={handleDeliveryFeeChange("phnom_penh")}
                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Provinces</label>
                <input
                  type="number"
                  step="0.1"
                  value={f.delivery_fees?.province ?? 2.5}
                  onChange={handleDeliveryFeeChange("province")}
                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                  <img src="/brands/grab.svg" alt="Grab" className="size-3.5 rounded-xs inline-block" />
                  <span>Grab Instant</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={f.delivery_fees?.grab ?? 2.0}
                  onChange={handleDeliveryFeeChange("grab")}
                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Auto-Pilot Behavioral Policies */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">AI Auto-Pilot Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {f.ai_enabled ? "Auto-Pilot Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={f.ai_enabled}
                onChange={(e) => setF({ ...f, ai_enabled: e.target.checked })}
                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom AI Persona & Prompt Guidelines
            </label>
            <textarea
              rows={4}
              value={f.ai_instructions ?? ""}
              onChange={(e) => setF({ ...f, ai_instructions: e.target.value })}
              placeholder="e.g. Speak politely in Khmer. Always recommend combining face serum with moisturizer for free delivery. Never offer discounts above 15%."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Injected into the system prompt for every incoming conversation in this shop.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low-Stock Threshold
              </label>
              <input
                type="number"
                min={0}
                value={f.low_stock_threshold}
                onChange={(e) => setF({ ...f, low_stock_threshold: Number(e.target.value) })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VIP Spend Level ($)
              </label>
              <input
                type="number"
                min={0}
                value={f.vip_spend_threshold}
                onChange={(e) => setF({ ...f, vip_spend_threshold: Number(e.target.value) })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <BrandLogo brand="telegram" size={16} rounded="sm" />
              <span>Telegram Chat ID for Owner Emergency Alerts</span>
            </label>
            <input
              type="text"
              value={f.telegram_alert_chat_id ?? ""}
              onChange={(e) => setF({ ...f, telegram_alert_chat_id: e.target.value })}
              placeholder="e.g. 123456789"
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Low-stock warnings and payment slip mismatch alerts will be forwarded directly to this Telegram chat.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="lg:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              Subscription Plan: <strong className="text-slate-800 dark:text-slate-200">{f.plan?.name || "PRO"}</strong> ·{" "}
              {f.ai_replies_used.toLocaleString()} / {f.plan?.ai_replies_limit.toLocaleString()} AI replies used
            </span>
            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "subscription");
                window.history.pushState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition cursor-pointer"
            >
              <Sparkles size={11} />
              <span>Change / Upgrade Plan &rarr;</span>
            </button>
          </div>

          <button
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                name: f.name,
                category: f.category,
                phone: f.phone,
                address: f.address,
                ai_enabled: f.ai_enabled,
                ai_instructions: f.ai_instructions,
                low_stock_threshold: f.low_stock_threshold,
                vip_spend_threshold: f.vip_spend_threshold,
                telegram_alert_chat_id: f.telegram_alert_chat_id || null,
                delivery_fees: f.delivery_fees,
              })
            }
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
          >
            <Save size={14} />
            <span>{saveMutation.isPending ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 5. Shop Owner Profile & Security Section
// ──────────────────────────────────────────────────────────────────

function ProfileSecuritySection() {
  const { user, refresh, logout } = useAuth();
  const { language } = useLanguage();
  const qc = useQueryClient();

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const shop = shopQuery.data;

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const ownerInitials = (function (name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "SO";
  })(user?.full_name || "Shop Owner");

  const profileMutation = useMutation({
    mutationFn: (body: { full_name?: string; email?: string }) => api.patch<User>("/auth/me", body),
    onSuccess: () => {
      void refresh();
      qc.invalidateQueries({ queryKey: ["shop"] });
      setProfileSuccess(true);
      setProfileError(null);
      setTimeout(() => setProfileSuccess(false), 3500);
    },
    onError: (err: Error) => {
      setProfileError(err.message || "Failed to update profile information");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (body: { current_password: string; password: string }) => api.patch<User>("/auth/me", body),
    onSuccess: () => {
      void refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setPasswordError(null);
      setTimeout(() => setPasswordSuccess(false), 4500);
    },
    onError: (err: Error) => {
      setPasswordError(err.message || "Failed to update password. Please check your current password.");
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!fullName.trim()) {
      setProfileError("Full name cannot be empty");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setProfileError("Please enter a valid email address");
      return;
    }
    profileMutation.mutate({ full_name: fullName.trim(), email: email.trim().toLowerCase() });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError("Please enter your current password to verify your identity");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }
    passwordMutation.mutate({ current_password: currentPassword, password: newPassword });
  };

  return (
    <div className="space-y-6">
      {/* ── Intro Header ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-xs ring-2 ring-slate-100">
            {ownerInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{user?.full_name || "Shop Owner"}</h2>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold uppercase">
                Owner & Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Primary Administrator of <strong>{shop?.name || "Merchant Shop"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Secured</span>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 1. Personal Profile Information ── */}
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-600" />
                <span>{language === "km" ? "ព័ត៌មានគណនីម្ចាស់ហាង" : "Owner Profile Details"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your contact name and login email address.
              </p>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 p-3 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/60 p-3 text-xs text-rose-800 font-medium">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Sreypov Chan"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Used for login & alerts)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs font-mono text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="owner@yourstore.kh"
                  />
                  <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shop Association</label>
                <div className="relative">
                  <input
                    type="text"
                    value={shop?.name || "Merchant Shop"}
                    disabled
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                  <Store size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Role</label>
                <div className="relative">
                  <input
                    type="text"
                    value="Owner (Full Administrative Access)"
                    disabled
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                  <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <Save size={13} />
              <span>{profileMutation.isPending ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>

        {/* ── 2. Password & Credential Security ── */}
        <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound size={16} className="text-purple-600" />
                <span>{language === "km" ? "ផ្លាស់ប្តូរពាក្យសម្ងាត់" : "Change Password"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify your current password and choose a strong password with at least 8 characters.
              </p>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 p-3 text-xs text-emerald-800 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Password changed successfully! Next login requires your new password.</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/60 p-3 text-xs text-rose-800 font-medium">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 pr-10 text-xs text-slate-800 shadow-2xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  New Password <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Min 8 characters)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 pr-10 text-xs text-slate-800 shadow-2xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className={clsx(
                      "h-9 w-full rounded-xl border px-3 pr-10 text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-1",
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                        : "border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition cursor-pointer disabled:opacity-50"
            >
              <KeyRound size={13} />
              <span>{passwordMutation.isPending ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. Appearance & Theme Mode ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sun size={16} className="text-amber-500" />
              <span>{language === "km" ? "រូបរាង & ស្បែកបង្ហាញ (Theme)" : "Appearance & Display Theme"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === "km"
                ? "ជ្រើសរើសស្បែកពណ៌ភ្លឺ (Light) ឬ ពណ៌ងងឹត (Dark) ឬ ធ្វើសមកាលកម្មតាមកុំព្យូទ័ររបស់អ្នក (System)"
                : "Choose between crisp Light mode, sleek Dark mode, or automatic System sync."}
            </p>
          </div>
          <ThemeSegmentedControl />
        </div>
        <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
          Tip: You can also quickly toggle between light and dark anytime using the sun/moon icon button in the top navigation header.
        </p>
      </div>

      {/* ── 4. Session Safeguards & Protection Overview ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Session & Account Safeguards</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active login session, encryption standards, and merchant security protocols.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/80 transition cursor-pointer self-start sm:self-auto"
          >
            <span>Sign Out of Current Session</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-200/70 p-3.5 bg-slate-50/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Smartphone size={14} className="text-blue-600" />
              <span>Active Device</span>
            </div>
            <p className="text-slate-900 font-semibold">Mac Desktop / Chrome</p>
            <p className="text-[11px] text-slate-400">Current authenticated workstation</p>
          </div>

          <div className="rounded-xl border border-slate-200/70 p-3.5 bg-slate-50/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Lock size={14} className="text-emerald-600" />
              <span>Token Protection</span>
            </div>
            <p className="text-slate-900 font-semibold">Bearer JWT with Auto-Expiry</p>
            <p className="text-[11px] text-slate-400">Cryptographically signed credentials</p>
          </div>

          <div className="rounded-xl border border-slate-200/70 p-3.5 bg-slate-50/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck size={14} className="text-purple-600" />
              <span>Payment Keys</span>
            </div>
            <p className="text-slate-900 font-semibold">AES-256 Masked</p>
            <p className="text-[11px] text-slate-400">ABA PayWay & Bakong credentials encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 6. Shop Subscription & Plan Tiers Section
// ──────────────────────────────────────────────────────────────────

function SubscriptionSection() {
  const { language } = useLanguage();
  const qc = useQueryClient();

  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });
  const plansQuery = useQuery({ queryKey: ["shop-plans"], queryFn: () => api.get<Plan[]>("/shop/plans") });
  const invoicesQuery = useQuery({
    queryKey: ["shop-invoices"],
    queryFn: () => api.get<PaymentHistoryItem[]>("/shop/subscription/invoices"),
  });
  const channelsQuery = useQuery({ queryKey: ["channels"], queryFn: () => api.get<ChannelT[]>("/shop/channels") });
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: () => api.get<User[]>("/shop/staff") });

  const shop = shopQuery.data;
  const currentPlan = shop?.plan;
  const plans = plansQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  // Modal states
  const [selectedPlanForSwitch, setSelectedPlanForSwitch] = useState<Plan | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistoryItem | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Quotas
  const aiUsed = shop?.ai_replies_used ?? 0;
  const aiLimit = currentPlan?.ai_replies_limit ?? 500;
  const aiPct = aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;
  const staffUsed = staffQuery.data?.length ?? 1;
  const staffLimit = currentPlan?.staff_seats ?? 1;
  const channelsUsed = channelsQuery.data?.filter((c) => c.is_connected).length ?? 0;
  const channelsLimit = currentPlan?.channels_limit ?? 1;

  const isCurrentYearly = invoices[0]?.billing_cycle === "yearly" || invoices[0]?.plan?.includes("Annual");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Active Plan Status Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {language === "km" ? "ការជាវសកម្ម" : "Active Subscription"}
              </span>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Tier: {currentPlan?.code || "free"}
              </span>
              {isCurrentYearly && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                  Annual (1 Year Access)
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {currentPlan?.name || "Free Plan"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {language === "km"
                ? "ហាងរបស់អ្នកកំពុងដំណើរការជាមួយមុខងារស្វ័យប្រវត្តិកម្រិតខ្ពស់។ អ្នកអាចផ្លាស់ប្តូរ ឬដំឡើងកញ្ចប់បានគ្រប់ពេលតាមតម្រូវការជាក់ស្តែង។"
                : "Your shop is operating with full AI Auto-Pilot capabilities. You can switch, upgrade, or downgrade to any available pricing tier instantly."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === "km"
                  ? isCurrentYearly ? "ថ្លៃជាវប្រចាំឆ្នាំ" : "ថ្លៃជាវប្រចាំខែ"
                  : isCurrentYearly ? "Annual Rate" : "Monthly Rate"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  ${isCurrentYearly ? (currentPlan?.price_monthly ?? 0) * 10 : (currentPlan?.price_monthly ?? 0)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {isCurrentYearly ? "/ year" : "/ month"}
                </span>
              </div>
            </div>

            <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === "km" ? "ស្ថានភាពទូទាត់" : "Billing Cycle"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                {isCurrentYearly ? "Billed Annually (12 Months)" : "Auto-Renewed Monthly"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quota Metrics Grid ── */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Meter 1: AI Replies */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bot size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>AI Replies Capacity</span>
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{aiPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-500",
                  aiPct > 85
                    ? "bg-gradient-to-r from-amber-500 to-rose-500"
                    : "bg-gradient-to-r from-teal-500 to-emerald-600"
                )}
                style={{ width: `${aiPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{aiUsed.toLocaleString()} used</span>
              <span>{aiLimit.toLocaleString()} monthly limit</span>
            </div>
          </div>

          {/* Meter 2: Staff Seats */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Team Staff Seats</span>
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {staffUsed} / {staffLimit}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((staffUsed / staffLimit) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{staffUsed} team member{staffUsed > 1 ? "s" : ""}</span>
              <span>{staffLimit} seats allowed</span>
            </div>
          </div>

          {/* Meter 3: Connected Channels */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Connected Channels</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {channelsUsed} / {channelsLimit}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((channelsUsed / channelsLimit) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{channelsUsed} active bot{channelsUsed > 1 ? "s" : ""}</span>
              <span>{channelsLimit} channel limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dynamic Pricing Tiers Grid ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>{language === "km" ? "កញ្ចប់តម្លៃជាវទាំងអស់" : "Available Subscription Tiers"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "km"
                ? "ជ្រើសរើសកញ្ចប់តម្លៃដែលស័ក្តិសមបំផុតសម្រាប់អាជីវកម្មរបស់អ្នក។ ការដំឡើង ឬផ្លាស់ប្តូរមានប្រសិទ្ធភាពភ្លាមៗ។"
                : "All pricing plans configured in the system. Switch or upgrade whenever your order and customer volume increases."}
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700 shadow-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={clsx(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                billingCycle === "monthly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {language === "km" ? "ប្រចាំខែ (Monthly)" : "Monthly"}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={clsx(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                billingCycle === "yearly"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <span>{language === "km" ? "ប្រចាំឆ្នាំ (Annual)" : "Annual"}</span>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
                  billingCycle === "yearly"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                )}
              >
                2 Mo Free
              </span>
            </button>
          </div>
        </div>

        {plansQuery.isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading available pricing tiers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;
              const isPopular = plan.code.toLowerCase() === "pro";
              const isEnterprise = plan.code.toLowerCase() === "enterprise";
              const isUnlimited = plan.code.toLowerCase() === "premium" || plan.name.toLowerCase().includes("unlimited");
              const monthlyRate = Number(plan.price_monthly) || 0;
              const isYearly = billingCycle === "yearly";
              const effectiveMonthlyPrice = isYearly && monthlyRate > 0
                ? Math.round((monthlyRate * 10) / 12)
                : monthlyRate;
              const annualTotal = monthlyRate * 10;

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    "relative rounded-2xl p-6 transition flex flex-col justify-between bg-white dark:bg-slate-900",
                    isCurrent
                      ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-950/30"
                      : "border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                  )}
                >
                  {/* Top Badges */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-white shadow-xs">
                        <Check size={11} />
                        {language === "km" ? "កញ្ចប់បច្ចុប្បន្ន" : "Current Plan"}
                      </span>
                    </div>
                  )}
                  {!isCurrent && isPopular && (
                    <div className="absolute -top-3 left-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-white shadow-xs">
                        <Sparkles size={11} />
                        Most Popular
                      </span>
                    </div>
                  )}
                  {!isCurrent && isEnterprise && (
                    <div className="absolute -top-3 left-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-white shadow-xs">
                        <ShieldCheck size={11} />
                        Enterprise Scale
                      </span>
                    </div>
                  )}
                  {!isCurrent && isUnlimited && (
                    <div className="absolute -top-3 left-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 px-3 py-0.5 text-[10.5px] font-extrabold tracking-wide text-white shadow-xs">
                        <Sparkles size={11} />
                        Unlimited Tier
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header: Name & Code */}
                    <div className="flex items-start justify-between mt-1">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                          {plan.code}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-5 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                          ${effectiveMonthlyPrice}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">/ month</span>
                      </div>
                      {isYearly && monthlyRate > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Billed annually at ${annualTotal}/yr (Save ${monthlyRate * 2})
                        </p>
                      )}
                    </div>

                    {/* Core Limits Highlights */}
                    <div className="mt-5 space-y-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">AI Volume:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {plan.ai_replies_limit >= 1000000 ? "Unlimited" : `${plan.ai_replies_limit.toLocaleString()} replies/mo`}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Staff Seats:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {plan.staff_seats >= 999 ? "Unlimited" : `${plan.staff_seats} account${plan.staff_seats > 1 ? "s" : ""}`}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Channels:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {plan.channels_limit >= 99 ? "Unlimited" : `${plan.channels_limit} connected`}
                        </strong>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="mt-5 space-y-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Included Features:
                      </span>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      >
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>{language === "km" ? "កញ្ចប់បច្ចុប្បន្ន" : "Current Plan"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPlanForSwitch(plan)}
                        className={clsx(
                          "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98",
                          plan.price_monthly === 0
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25"
                        )}
                      >
                        <Zap size={14} />
                        <span>
                          {plan.price_monthly === 0
                            ? language === "km"
                              ? "ប្តូរទៅកញ្ចប់ឥតគិតថ្លៃ (Free)"
                              : "Switch to Free Tier"
                            : isYearly
                            ? language === "km"
                              ? `ដំឡើងទៅកញ្ចប់ ${plan.name} (ប្រចាំឆ្នាំ)`
                              : `Upgrade to ${plan.name} (Annual)`
                            : plan.price_monthly > (currentPlan?.price_monthly ?? 0)
                            ? language === "km"
                              ? `ដំឡើងទៅកញ្ចប់ ${plan.name}`
                              : `Upgrade to ${plan.name}`
                            : language === "km"
                            ? `ប្តូរទៅកញ្ចប់ ${plan.name}`
                            : `Switch to ${plan.name}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Billing & Invoices History Table ── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt size={17} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === "km" ? "ប្រវត្តិវិក្កយបត្រ & ការទូទាត់" : "Billing History & Invoices"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official tax and subscription payment records for {shop?.name}
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {invoices.length} Record{invoices.length > 1 ? "s" : ""}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No payment invoices recorded yet for this shop.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{inv.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{inv.plan}</span>
                        {(inv.billing_cycle === "yearly" || inv.plan?.includes("Annual")) && (
                          <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[9.5px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                            Annual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{inv.method}</td>
                    <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">{inv.amount}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <Check size={11} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(inv)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Switch / Upgrade Plan Checkout Modal ── */}
      {selectedPlanForSwitch && (
        <PlanSwitchModal
          targetPlan={selectedPlanForSwitch}
          currentShop={shop ?? null}
          initialBillingCycle={billingCycle}
          onClose={() => setSelectedPlanForSwitch(null)}
          onSuccess={(newInv) => {
            setSelectedPlanForSwitch(null);
            qc.invalidateQueries({ queryKey: ["shop"] });
            qc.invalidateQueries({ queryKey: ["shop-plans"] });
            qc.invalidateQueries({ queryKey: ["shop-invoices"] });
            qc.invalidateQueries({ queryKey: ["overview"] });
            if (newInv) {
              setSelectedReceipt(newInv);
            }
          }}
        />
      )}

      {/* ── MODAL 2: Official Printable Receipt Preview ── */}
      {selectedReceipt && (
        <OwnerReceiptModal
          item={selectedReceipt}
          shopName={shop?.name || "Merchant Shop"}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Subcomponent: PlanSwitchModal (Checkout & Upgrade Flow)
// ──────────────────────────────────────────────────────────────────

interface PlanSwitchModalProps {
  targetPlan: Plan;
  currentShop: Shop | null;
  initialBillingCycle?: "monthly" | "yearly";
  onClose: () => void;
  onSuccess: (newInvoice?: PaymentHistoryItem) => void;
}

function PlanSwitchModal({ targetPlan, currentShop, initialBillingCycle = "monthly", onClose, onSuccess }: PlanSwitchModalProps) {
  const { language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(initialBillingCycle);
  const isYearly = billingCycle === "yearly";
  const monthlyRate = Number(targetPlan.price_monthly) || 0;
  const isFreePlan = monthlyRate === 0;
  // Yearly plan offers 2 Months Free (pay for 10 months, get 12 months)
  const basePrice = isFreePlan ? 0 : (isYearly ? monthlyRate * 10 : monthlyRate);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"ABA KHQR" | "Bakong" | "Bank Transfer">("ABA KHQR");
  const [reference] = useState<string>(
    `KHQR-${(currentShop?.id ?? 1) * 1024 + Math.floor(Math.random() * 899 + 100)}`
  );
  const [copiedRef, setCopiedRef] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = appliedCoupon ? appliedCoupon.finalPrice : basePrice;
  const khrAmount = Math.round(finalAmount * 4100);

  // Validate coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponError(null);
    try {
      const res = await api.post<any>("/coupons/validate", {
        code: couponCode.trim().toUpperCase(),
        plan_code: targetPlan.code,
        price: basePrice,
      });
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discountAmount: res.discount_amount,
        finalPrice: res.final_price,
        message: res.message,
      });
    } catch (err: any) {
      setCouponError(err?.response?.data?.detail || "Invalid or expired coupon code");
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const switchMutation = useMutation({
    mutationFn: (data: any) => api.post<Shop>("/shop/change-plan", data),
    onSuccess: () => {
      // Create representation of receipt
      const receipt: PaymentHistoryItem = {
        id: `INV-26-${Math.floor(Math.random() * 8999 + 1000)}`,
        shop: currentShop?.name || "Merchant Shop",
        shop_id: currentShop?.id,
        plan: isYearly && !isFreePlan ? `${targetPlan.name} (Annual)` : targetPlan.name,
        method: isFreePlan || finalAmount === 0 ? "Free / Instant" : paymentMethod,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        amount: `$${finalAmount.toFixed(2)}`,
        status: "Paid",
        reference,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: appliedCoupon ? `$${appliedCoupon.discountAmount.toFixed(2)}` : null,
        original_amount: appliedCoupon ? `$${basePrice.toFixed(2)}` : null,
        billing_cycle: billingCycle,
        period: isYearly && !isFreePlan ? "1 Year (12 Months - 2 Months Free)" : "1 Month",
      };
      onSuccess(receipt);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to switch plan. Please verify and retry.");
    },
  });

  const handleConfirm = () => {
    setError(null);
    switchMutation.mutate({
      plan_id: targetPlan.id,
      payment_method: isFreePlan || finalAmount === 0 ? "Free / Instant" : paymentMethod,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      reference: isFreePlan || finalAmount === 0 ? null : reference,
      billing_cycle: billingCycle,
    });
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === "km" ? "ដំឡើង / ផ្លាស់ប្តូរកញ្ចប់សេវា" : "Switch Subscription Tier"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Activating <strong className="text-indigo-600 dark:text-indigo-400">{targetPlan.name}</strong> for {currentShop?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Billing Cycle Selector in Modal (Only for paid plans) */}
          {!isFreePlan && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle("monthly");
                    setAppliedCoupon(null);
                  }}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition cursor-pointer",
                    billingCycle === "monthly"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <span>Monthly</span>
                  <span className="text-[11px] font-normal text-slate-400">(${monthlyRate}/mo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle("yearly");
                    setAppliedCoupon(null);
                  }}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition cursor-pointer",
                    billingCycle === "yearly"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <span>Yearly</span>
                  <span className="text-[11px] font-normal">(${monthlyRate * 10}/yr)</span>
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wide",
                      billingCycle === "yearly" ? "bg-amber-400 text-slate-950" : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    2 Mo Free
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Plan Summary Card */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Target Tier
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  {targetPlan.name} {isYearly && !isFreePlan ? "(Annual Plan)" : ""}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  ${basePrice.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 block">
                  {isFreePlan ? "Free Forever" : isYearly ? "/ year (Save $" + (monthlyRate * 2) + ")" : "/ month"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/70 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
              <div>
                <span className="text-slate-400 block">AI Messages</span>
                <strong>{targetPlan.ai_replies_limit >= 1000000 ? "Unlimited" : targetPlan.ai_replies_limit.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Staff Seats</span>
                <strong>{targetPlan.staff_seats >= 999 ? "Unlimited" : `${targetPlan.staff_seats} seats`}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Channels</span>
                <strong>{targetPlan.channels_limit >= 99 ? "Unlimited" : `${targetPlan.channels_limit} channels`}</strong>
              </div>
            </div>
          </div>

          {/* Discount Coupon Code Box */}
          {!isFreePlan && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Promotional Voucher / Coupon Code</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME50, CHHLAT20"
                  className="h-10 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-mono uppercase text-slate-900 dark:text-white tracking-wider focus:border-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={couponValidating || !couponCode.trim()}
                  onClick={handleApplyCoupon}
                  className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-4 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {couponValidating ? "Checking..." : "Apply"}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>
              )}

              {appliedCoupon && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>
                      Coupon <strong>{appliedCoupon.code}</strong> applied: -${appliedCoupon.discountAmount.toFixed(2)} discount!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Cambodia KHQR (Only if amount > 0) */}
          {!isFreePlan && finalAmount > 0 ? (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Select Payment Gateway</span>
              </label>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {(["ABA KHQR", "Bakong", "Bank Transfer"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={clsx(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      paymentMethod === method
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    <QrCode size={13} />
                    <span>{method}</span>
                  </button>
                ))}
              </div>

              {/* Authentic Cambodia KHQR Simulation Box */}
              <div className="rounded-2xl border-2 border-red-500/80 bg-gradient-to-b from-red-500/5 via-transparent to-transparent dark:from-red-950/20 p-5 space-y-4">
                {/* KHQR Header Banner */}
                <div className="flex items-center justify-between border-b border-red-200/60 dark:border-red-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-black tracking-widest text-white uppercase">
                      KHQR
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      National Payment Standard
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Bakong & ABA Ready</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-2">
                  {/* Visual QR Code Display */}
                  <div className="size-36 rounded-xl bg-white p-2.5 shadow-md border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <div className="size-28 bg-slate-900 rounded-lg p-1.5 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="size-7 bg-white rounded-xs p-1">
                          <div className="size-full bg-slate-900" />
                        </div>
                        <div className="size-7 bg-white rounded-xs p-1">
                          <div className="size-full bg-slate-900" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="size-5 rounded-full bg-red-600 text-[8px] font-bold text-white flex items-center justify-center">
                          ៛
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="size-7 bg-white rounded-xs p-1">
                          <div className="size-full bg-slate-900" />
                        </div>
                        <div className="size-4 bg-white/30 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* QR Details */}
                  <div className="space-y-1.5 text-center sm:text-left text-xs">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      CHHLAT AI TECHNOLOGIES (CAMBODIA)
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      Merchant ID: <strong className="text-slate-800 dark:text-slate-200">CHHLAT_AI_CORP</strong>
                    </p>

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 uppercase">Amount Due:</span>
                      <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          ${finalAmount.toFixed(2)} USD
                        </span>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          (≈ {khrAmount.toLocaleString()} KHR)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1">
                      Open ABA Mobile or Bakong app &rarr; Tap QR Pay &rarr; Scan
                    </p>
                  </div>
                </div>

                {/* Reference Code Copy */}
                <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Payment Ref:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reference}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
                  >
                    {copiedRef ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedRef ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 text-center space-y-1">
              <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
              <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                100% Free Activation
              </h5>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                No payment or credit card required. Your subscription will be updated immediately.
              </p>
            </div>
          )}

          {/* Pricing Calculation Summary */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{isYearly && !isFreePlan ? "Annual Rate (10 Months Billed)" : "Standard Monthly Rate"}</span>
              <span className="font-mono">${basePrice.toFixed(2)}</span>
            </div>
            {isYearly && !isFreePlan && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Annual Plan Savings (2 Months Free 🎁)</span>
                <span className="font-mono">-${(monthlyRate * 2).toFixed(2)}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Voucher Discount ({appliedCoupon.code})</span>
                <span className="font-mono">-${appliedCoupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total Payable</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
                ${finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={switchMutation.isPending}
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 disabled:opacity-50 transition cursor-pointer"
          >
            <Zap size={14} />
            <span>
              {switchMutation.isPending
                ? "Activating Plan..."
                : `Confirm & Activate ${targetPlan.name}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Subcomponent: OwnerReceiptModal (Official Printable Invoice)
// ──────────────────────────────────────────────────────────────────

interface OwnerReceiptModalProps {
  item: PaymentHistoryItem;
  shopName: string;
  onClose: () => void;
}

function OwnerReceiptModal({ item, shopName, onClose }: OwnerReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/60 print:hidden">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Subscription Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  C
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Chhlat AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Official Subscription Invoice</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white block">
                {item.id}
              </span>
              <span className="text-xs text-slate-400">{item.date}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Billed To:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{item.shop || shopName}</p>
              <p className="text-slate-500 dark:text-slate-400">Phnom Penh, Cambodia</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-medium block">Payment Method:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{item.method}</p>
              {item.reference && (
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Ref: {item.reference}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 text-left">Description</th>
                  <th className="py-2.5 px-4 text-center">Period</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 dark:text-white block">{item.plan} Subscription</strong>
                    <span className="text-[11px] text-slate-400">
                      {item.billing_cycle === "yearly" || item.plan?.includes("Annual")
                        ? "Annual 12-month license (includes 2 months free discount)"
                        : "Monthly social commerce AI suite"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">
                    {item.period || (item.billing_cycle === "yearly" || item.plan?.includes("Annual") ? "1 Year (12 Months)" : "1 Month")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {item.original_amount || item.amount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
            {item.discount_amount && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Voucher Discount ({item.coupon_code})</span>
                <span className="font-mono">-{item.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax / VAT (0%)</span>
              <span className="font-mono">$0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total Paid</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
                {item.amount}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 text-center text-[11px] text-slate-400">
            <p>Thank you for choosing Chhlat AI to empower your social commerce business.</p>
            <p className="mt-0.5">For billing inquiries: support@chhlat.ai</p>
          </div>
        </div>
      </div>
    </div>
  );
}

