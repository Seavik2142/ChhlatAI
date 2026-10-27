import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error") || params.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      if (window.opener) {
        window.opener.postMessage(
          { type: "CHHLAT_OAUTH_CALLBACK", error },
          window.location.origin
        );
      }
      return;
    }

    if (code) {
      setStatus("success");
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "CHHLAT_OAUTH_CALLBACK",
            code,
            state,
          },
          window.location.origin
        );
        setTimeout(() => {
          window.close();
        }, 800);
      } else {
        // Fallback for non-popup full redirect
        setTimeout(() => {
          navigate(`/owner/settings?tab=channels&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`, { replace: true });
        }, 1200);
      }
    } else {
      setStatus("error");
      setErrorMessage("No authorization code received from provider.");
    }
  }, [params, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          {status === "processing" && <RefreshCw size={28} className="animate-spin text-emerald-400" />}
          {status === "success" && <CheckCircle2 size={32} className="text-emerald-400 animate-in zoom-in-75 duration-200" />}
          {status === "error" && <AlertCircle size={32} className="text-rose-400 animate-in zoom-in-75 duration-200" />}
        </div>

        <div>
          <h1 className="text-lg font-bold text-white">
            {status === "processing" && "Verifying OAuth 2.0 Authorization..."}
            {status === "success" && "Authorization Successful!"}
            {status === "error" && "Authorization Failed"}
          </h1>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            {status === "processing" && "Securely exchanging handshake tokens with social platform..."}
            {status === "success" && "Connected! Returning back to Chhlat AI Live Inbox..."}
            {status === "error" && (errorMessage || "The authorization process was cancelled or encountered an error.")}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Encrypted OAuth 2.0 PKCE Handshake</span>
        </div>

        {status === "error" && (
          <button
            onClick={() => {
              if (window.opener) window.close();
              else navigate("/owner/settings?tab=channels");
            }}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
          >
            Close Window & Return
          </button>
        )}
      </div>
    </div>
  );
}
