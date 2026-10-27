import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { BrandLogo } from "../../components/ui/BrandLogo";
import type { Platform } from "../../lib/types";

const PLATFORM_META: Record<string, { name: string; brand: Platform; desc: string }> = {
  facebook: {
    name: "Facebook Messenger",
    brand: "facebook",
    desc: "Your official Facebook Page inbox is now linked with live webhooks.",
  },
  instagram: {
    name: "Instagram Direct",
    brand: "instagram",
    desc: "Direct messages and story replies are now synced with your unified Live Inbox.",
  },
  tiktok: {
    name: "TikTok Shop",
    brand: "tiktok",
    desc: "TikTok Shop customer inquiries are now synchronized with Chhlat AI Auto-Pilot.",
  },
  telegram: {
    name: "Telegram Messenger",
    brand: "telegram",
    desc: "Your Telegram channel is verified and live customer chats are synced with Chhlat AI.",
  },
};

export function OwnerOAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform") || "facebook";
  const accountName = searchParams.get("account_name");
  const errorMessage = searchParams.get("message");

  const [countdown, setCountdown] = useState(3);

  const info = PLATFORM_META[platform] || {
    name: platform.toUpperCase(),
    brand: (platform as Platform) || "facebook",
    desc: "Messaging channel authorization complete.",
  };

  useEffect(() => {
    // Invalidate React Query caches so channels immediately update in real-time
    void qc.invalidateQueries({ queryKey: ["channels"] });
    void qc.invalidateQueries({ queryKey: ["shop"] });
    void qc.invalidateQueries({ queryKey: ["conversations"] });

    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/owner/settings?tab=channels&just_connected=${platform}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, platform, navigate, qc]);

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Icon Header */}
        <div className="flex justify-center">
          <div className="relative">
            <BrandLogo brand={info.brand} size={72} rounded="2xl" />
            {isSuccess && (
              <div className="absolute -bottom-2 -right-2 size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-50 duration-300">
                <CheckCircle2 size={16} />
              </div>
            )}
            {isError && (
              <div className="absolute -bottom-2 -right-2 size-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md border-2 border-white">
                <AlertCircle size={16} />
              </div>
            )}
          </div>
        </div>

        {/* Status Titles */}
        {isSuccess && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
              <ShieldCheck size={14} />
              <span>OAuth 2.0 Verified</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Connected to {info.name}!
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              {accountName ? `Account: ${accountName}` : "Your channel has been successfully authenticated"}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {info.desc}
            </p>

            {/* Realtime Status Badge Transition */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className="text-xs text-slate-400 font-medium line-through">Disconnected</span>
              <ArrowRight size={14} className="text-slate-300" />
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs animate-pulse">
                <span className="size-2 rounded-full bg-emerald-500" />
                Connected &amp; Live
              </span>
            </div>

            {/* Features pill list */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-left bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500 shrink-0" />
                <span>Real-time Webhook Active</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Tokens Encrypted at Rest</span>
              </div>
            </div>

            {/* Action & Redirect Countdown */}
            <div className="pt-4 space-y-2">
              <p className="text-xs text-slate-400">
                Redirecting to Settings in <span className="font-bold text-slate-700">{countdown}s</span>...
              </p>
              <button
                type="button"
                onClick={() => navigate(`/owner/settings?tab=channels&just_connected=${platform}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white px-5 py-3 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Return to Channels Settings Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {isError && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200/60">
              <AlertCircle size={14} />
              <span>OAuth Authorization Failed</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Could Not Connect {info.name}
            </h1>
            <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/60 text-xs text-rose-700 text-left font-mono break-words">
              {errorMessage || "The authorization request was declined or timed out."}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please make sure you approved all requested messaging permissions on the consent dialog, or check your provider app configuration.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/owner/settings?tab=channels")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 text-xs font-bold transition cursor-pointer"
              >
                <span>Return to Channels Settings</span>
              </button>
            </div>
          </div>
        )}

        {!isSuccess && !isError && (
          <div className="space-y-4 py-8">
            <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-800">Finalizing OAuth 2.0 handshake...</h2>
            <p className="text-xs text-slate-400">Verifying secure token exchange and subscribing webhooks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
