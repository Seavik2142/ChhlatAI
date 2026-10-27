import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpDown,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Layers,
  Play,
  Plus,
  Power,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../lib/i18n";
import type { AIStats, GlobalPromptConfig, ShopAIControl } from "../../lib/types";

const PROMPT_TEMPLATES = [
  {
    name: "Standard Social Commerce (Khmer & English)",
    desc: "Default conversational sales bot for retail & social commerce",
    prompt:
      "You are a friendly sales assistant for {shop_name} in Cambodia. Reply in the customer's language (Khmer or English). Only recommend products from {product_catalog} and use {knowledge_base} for advice. Never give medical diagnoses — skin or crop analysis is an estimate. When the customer sends an ABA slip, extract amount, reference and time, then hand off to staff if anything does not match. If the customer is angry, asks for a big discount, or the question is complex, set status = WAIT_STAFF.",
  },
  {
    name: "Fast Direct Order & Checkout",
    desc: "Optimized for fast item confirmation and immediate invoice generation",
    prompt:
      "You are an efficient checkout assistant for {shop_name}. Greet customers warmly and answer product inquiries promptly based on {product_catalog}. Encourage quick order confirmation with recipient name, phone number, and delivery address. Provide delivery fee calculation ({delivery_fees}). Once the customer confirms, output the order summary and ABA payment instructions.",
  },
  {
    name: "Customer Support & Escalation Strict",
    desc: "Focuses on accurate answers and safety guardrails, escalating on uncertainty",
    prompt:
      "You are a dedicated support representative for {shop_name}. Answer customer questions strictly based on {knowledge_base}. Do not speculate or make unverified promises. If the inquiry requires order refunds, cancellation, delivery tracking issues, or unresolved complaints, politely reassure the customer and immediately set status = WAIT_STAFF for human intervention.",
  },
];

const AVAILABLE_VARIABLES = [
  { token: "{shop_name}", label: "Shop Name", desc: "Store display name" },
  { token: "{product_catalog}", label: "Catalog", desc: "Active products with prices" },
  { token: "{knowledge_base}", label: "Knowledge", desc: "Custom FAQs and store policies" },
  { token: "{customer_name}", label: "Customer", desc: "Customer's social profile name" },
  { token: "{customer_orders_count}", label: "Order Count", desc: "Lifetime order count" },
  { token: "{delivery_fees}", label: "Delivery Fees", desc: "PP & Provincial delivery rates" },
];

export function AdminAI() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  // Queries
  const promptQuery = useQuery({
    queryKey: ["admin-prompt-config"],
    queryFn: () => api.get<GlobalPromptConfig>("/admin/prompt-config"),
  });

  const aiStats = useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: () => api.get<AIStats>("/admin/ai-stats"),
  });

  const shopControlsQuery = useQuery({
    queryKey: ["admin-ai-shops-control"],
    queryFn: () => api.get<ShopAIControl[]>("/admin/ai-shops-control"),
  });

  // State
  const [prompt, setPrompt] = useState(
    "You are a friendly sales assistant for {shop_name} in Cambodia. Reply in the customer's language (Khmer or English). Only recommend products from {product_catalog} and use {knowledge_base} for advice. Never give medical diagnoses — skin or crop analysis is an estimate. When the customer sends an ABA slip, extract amount, reference and time, then hand off to staff if anything does not match. If the customer is angry, asks for a big discount, or the question is complex, set status = WAIT_STAFF."
  );
  const [model, setModel] = useState("gemini-3.8-flash");
  const [fallbackModel, setFallbackModel] = useState("gemini-3.8-flash");
  const [customModelMode, setCustomModelMode] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [allowCustom, setAllowCustom] = useState(true);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(true);
  const [geminiFallback, setGeminiFallback] = useState(true);

  // Priority Sequence Order (CodeCraft & Gemini)
  const [providerOrder, setProviderOrder] = useState<string[]>(["codecraft", "gemini"]);

  // Key Pool Modal & Management
  const [keyModal, setKeyModal] = useState<{ provider: "codecraft" | "gemini"; isOpen: boolean } | null>(null);
  const [newKeyForm, setNewKeyForm] = useState({
    name: "",
    key: "",
    is_active: true,
  });
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // CodeCraft API state
  const [codecraftKey, setCodecraftKey] = useState("");
  const [codecraftBaseUrl, setCodecraftBaseUrl] = useState("https://codecraftapi.com/v1");
  const [userControlEnabled, setUserControlEnabled] = useState(true);
  const [enforceTokenQuotas, setEnforceTokenQuotas] = useState(true);

  // Fallback keys
  const [geminiKey, setGeminiKey] = useState("");
  const [showNewKeySecret, setShowNewKeySecret] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Modals state
  const [showPlayground, setShowPlayground] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [rotatingProvider, setRotatingProvider] = useState<string | null>(null);
  const [rotationKeyInput, setRotationKeyInput] = useState("");

  // Testing status
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, { ok: boolean; latency: number; msg: string }>>({});

  // Playground state
  const [playgroundMessage, setPlaygroundMessage] = useState("សួស្តី តើមានក្រែមលាបមុខ Glow Skin លក់ទេ?");
  const [playgroundModel, setPlaygroundModel] = useState("claude-opus-4.8");
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Add Provider state
  const [newProviderForm, setNewProviderForm] = useState({
    name: "",
    type: "openai-compatible",
    baseUrl: "https://codecraftapi.com/v1",
    apiKey: "",
    defaultModel: "claude-opus-4.8",
  });

  useEffect(() => {
    if (promptQuery.data) {
      if (promptQuery.data.system_prompt) setPrompt(promptQuery.data.system_prompt);
      if (promptQuery.data.default_model) setModel(promptQuery.data.default_model);
      if (typeof promptQuery.data.temperature === "number") setTemperature(promptQuery.data.temperature);
      if (typeof promptQuery.data.allow_custom === "boolean") setAllowCustom(promptQuery.data.allow_custom);
      if (typeof promptQuery.data.sentiment_analysis === "boolean") setSentimentAnalysis(promptQuery.data.sentiment_analysis);
      if (promptQuery.data.codecraft_key_masked) setCodecraftKey(promptQuery.data.codecraft_key_masked);
      if (promptQuery.data.codecraft_base_url) setCodecraftBaseUrl(promptQuery.data.codecraft_base_url);
      if (typeof promptQuery.data.user_control_enabled === "boolean") setUserControlEnabled(promptQuery.data.user_control_enabled);
      if (typeof promptQuery.data.enforce_token_quotas === "boolean") setEnforceTokenQuotas(promptQuery.data.enforce_token_quotas);
      if (promptQuery.data.fallback_model) setFallbackModel(promptQuery.data.fallback_model);
      if (promptQuery.data.gemini_key_masked) setGeminiKey(promptQuery.data.gemini_key_masked);
      if (promptQuery.data.provider_order && Array.isArray(promptQuery.data.provider_order) && promptQuery.data.provider_order.length > 0) {
        setProviderOrder(promptQuery.data.provider_order);
      }
    }
  }, [promptQuery.data]);

  // Save Mutation
  const save = useMutation({
    mutationFn: () =>
      api.put("/admin/prompt-config", {
        system_prompt: prompt,
        default_model: model,
        temperature,
        allow_custom: allowCustom,
        sentiment_analysis: sentimentAnalysis,
        codecraft_key: codecraftKey.includes("••••") ? undefined : codecraftKey,
        codecraft_base_url: codecraftBaseUrl,
        codecraft_model: model,
        user_control_enabled: userControlEnabled,
        enforce_token_quotas: enforceTokenQuotas,
        fallback_model: fallbackModel,
        gemini_key: geminiKey.includes("••••") ? undefined : geminiKey,
        provider_order: providerOrder,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prompt-config"] });
      showToast("success", "AI Gateways and system rules saved successfully!");
    },
    onError: () => {
      showToast("error", "Failed to save AI configuration. Please check network.");
    },
  });

  // Add Gateway Key Mutation
  const addKeyMutation = useMutation({
    mutationFn: (data: { provider: string; name: string; key: string; is_active: boolean }) =>
      api.post("/admin/ai-gateways/keys", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prompt-config"] });
      setKeyModal(null);
      setNewKeyForm({ name: "", key: "", is_active: true });
      showToast("success", "API key successfully saved to database!");
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to add API key.");
    },
  });

  // Delete Gateway Key Mutation
  const deleteKeyMutation = useMutation({
    mutationFn: ({ provider, keyId }: { provider: string; keyId: string }) =>
      api.del(`/admin/ai-gateways/keys/${provider}/${keyId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prompt-config"] });
      showToast("success", "API key permanently removed from database.");
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to delete API key.");
    },
  });

  // Activate Gateway Key Mutation
  const activateKeyMutation = useMutation({
    mutationFn: ({ provider, keyId }: { provider: string; keyId: string }) =>
      api.post(`/admin/ai-gateways/keys/${provider}/${keyId}/activate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prompt-config"] });
      showToast("success", "Active API key updated for live AI traffic.");
    },
    onError: (err: any) => {
      showToast("error", err?.message || "Failed to activate API key.");
    },
  });

  // Update Gateway Order Mutation
  const updateOrderMutation = useMutation({
    mutationFn: (order: string[]) => api.put("/admin/ai-gateways/order", { order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prompt-config"] });
      showToast("success", "Gateway priority sequence updated and persisted in DB!");
    },
    onError: () => {
      showToast("error", "Failed to update gateway execution sequence.");
    },
  });

  const handleCopyKey = (keyId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
    showToast("info", "API key identifier copied to clipboard.");
  };

  const handleSwapOrder = () => {
    const newOrder = providerOrder[0] === "codecraft" ? ["gemini", "codecraft"] : ["codecraft", "gemini"];
    setProviderOrder(newOrder);
    updateOrderMutation.mutate(newOrder);
  };

  // Toggle individual shop AI access mutation
  const toggleShopMutation = useMutation({
    mutationFn: (shopId: number) => api.post(`/admin/ai-shops-control/${shopId}/toggle`, {}),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-ai-shops-control"] });
      showToast("success", res.message || "Shop AI permissions updated.");
    },
    onError: () => {
      showToast("error", "Failed to update shop AI access.");
    },
  });

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  };

  // Test Provider Connection
  const handleTestConnection = async (provider: string) => {
    setTestingConnection(provider);
    try {
      const res = await api.post<{ ok: boolean; latency_ms: number; message: string }>("/admin/ai-test-connection", {
        provider,
        api_key: provider === "codecraft" && !codecraftKey.includes("••••") ? codecraftKey : undefined,
      });
      setConnectionStatus((prev) => ({
        ...prev,
        [provider]: { ok: res.ok, latency: res.latency_ms, msg: res.message },
      }));
      showToast("success", `${res.message}`);
    } catch {
      setConnectionStatus((prev) => ({
        ...prev,
        [provider]: { ok: false, latency: 0, msg: "Connection failed" },
      }));
      showToast("error", `Failed to connect to ${provider} API gateway.`);
    } finally {
      setTestingConnection(null);
    }
  };

  // Run Playground Simulation
  const handleRunPlayground = async () => {
    if (!playgroundMessage.trim()) return;
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    try {
      const res = await api.post("/admin/ai-test-playground", {
        message: playgroundMessage,
        model: playgroundModel,
        system_prompt: prompt,
        temperature,
      });
      setPlaygroundResponse(res);
    } catch {
      showToast("error", "Playground simulation failed.");
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Insert Variable Token into Prompt
  const handleInsertToken = (token: string) => {
    setPrompt((prev) => prev + " " + token);
    showToast("info", `Inserted variable ${token} into prompt.`);
  };

  // Apply Prompt Preset
  const handleApplyTemplate = (tmpl: (typeof PROMPT_TEMPLATES)[0]) => {
    setPrompt(tmpl.prompt);
    showToast("info", `Applied preset: "${tmpl.name}".`);
  };

  // Spend bars & metrics
  const spendBars = aiStats.data?.spend_bars ?? [];
  const spend = aiStats.data?.monthly_spend ?? 0;
  const budget = aiStats.data?.monthly_budget ?? 2000.0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
  const shopControls = shopControlsQuery.data ?? [];
  const codecraftKeys = promptQuery.data?.codecraft_keys ?? [];
  const geminiKeys = promptQuery.data?.gemini_keys ?? [];
  const isFirstCodecraft = (providerOrder[0] || "codecraft") === "codecraft";
  const activeCodecraftKey = codecraftKeys.find((k) => k.is_active);
  const activeGeminiKey = geminiKeys.find((k) => k.is_active);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 sm:px-8 sm:py-8 space-y-7">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4.5 py-3 text-[13px] shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
              : toastMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300"
              : "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toastMessage.type === "error" ? (
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Bot size={20} />
            </div>
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
              {t("ai.title", "Global AI models & prompts")}
            </h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Configure CodeCraft API keys, default models, centralized user controls, and monitor API spend.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://codecraftapi.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 px-3.5 py-2 text-[13px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition"
          >
            <ExternalLink size={14} />
            <span>CodeCraft API Docs</span>
          </a>

          <button
            onClick={() => setShowPlayground(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
          >
            <Play size={14} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
            <span>{t("ai.playground", "Open playground")}</span>
          </button>

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
          >
            {save.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
            <span>{save.isPending ? t("ai.saving", "Saving…") : t("ai.saveChanges", "Save changes")}</span>
          </button>
        </div>
      </div>

      {/* ── Top Grid: Providers Hub (8 cols) & Spend Card (4 cols) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: AI Engines & API Providers (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">AI Provider Gateways</h2>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized OpenAI-compatible endpoints with encrypted key storage
              </p>
            </div>
            <button
              onClick={() => setShowAddProvider(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
            >
              <Plus size={13} className="text-slate-400 dark:text-slate-500" />
              <span>{t("ai.addProvider", "Add provider")}</span>
            </button>
          </div>

          {/* ── Gateway Priority Sequence Pipeline ── */}
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/70 via-slate-50/60 to-sky-50/70 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-sky-950/30 p-4.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">Gateway Priority & Execution Sequence</span>
                  <span className="rounded-full bg-indigo-100/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                    Live Real-Time Failover
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  AI customer messages execute Priority #1 first. If rate-limited or offline, the engine automatically cascades to Priority #2.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSwapOrder}
                disabled={updateOrderMutation.isPending}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 px-3.5 py-2 text-[12px] font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                title="Swap sequence order between CodeCraft API and Google Gemini"
              >
                <ArrowUpDown size={13} className={updateOrderMutation.isPending ? "animate-spin" : ""} />
                <span>Switch Priority (1 ⇄ 2)</span>
              </button>
            </div>

            {/* Sequence visual chain */}
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Step 1 */}
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-indigo-400 dark:border-indigo-600/80 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-mono text-[11px] font-bold text-white shadow-2xs">
                  #1
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12.5px] font-extrabold text-slate-900 dark:text-white truncate">
                      {isFirstCodecraft ? "CodeCraft API" : "Google Gemini"}
                    </p>
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 text-[9px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                      Primary
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                    {isFirstCodecraft ? model : fallbackModel} · {isFirstCodecraft ? (activeCodecraftKey?.name || "Active Key") : (activeGeminiKey?.name || "Active Key")}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-sky-400 dark:border-sky-600/80 bg-white dark:bg-slate-900 p-3 shadow-2xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 font-mono text-[11px] font-bold text-white shadow-2xs">
                  #2
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12.5px] font-extrabold text-slate-900 dark:text-white truncate">
                      {isFirstCodecraft ? "Google Gemini" : "CodeCraft API"}
                    </p>
                    <span className="rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-1.5 py-0.2 text-[9px] font-bold uppercase text-sky-700 dark:text-sky-300">
                      Failover
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                    {isFirstCodecraft ? fallbackModel : model} · {isFirstCodecraft ? (activeGeminiKey?.name || "Active Key") : (activeCodecraftKey?.name || "Active Key")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-400 dark:bg-slate-600 font-mono text-[11px] font-bold text-white">
                  #3
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 truncate">
                      Emergency Rules
                    </p>
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      Guardrail
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Smart Khmer Rules &amp; Staff Escalate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── DYNAMICALLY ORDERED GATEWAY CARDS ── */}
          {(() => {
            const codecraftCard = (
              <div
                key="codecraft-gateway"
                className={`rounded-2xl border-2 ${
                  isFirstCodecraft
                    ? "border-indigo-400 dark:border-indigo-500/70 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950/70 shadow-md"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                } p-5 space-y-4.5 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">CodeCraft API</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isFirstCodecraft
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isFirstCodecraft ? "Priority #1 · Primary Engine" : "Priority #2 · Failover Engine"}
                        </span>
                        <a
                          href="https://codecraftapi.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                        >
                          codecraftapi.com <ExternalLink size={11} />
                        </a>
                      </div>
                      <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Universal OpenAI-compatible API for Gemini 3.8/3.6 Flash, Claude Opus 4.8, GPT-4o &amp; DeepSeek V3/R1.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isFirstCodecraft && (
                      <button
                        type="button"
                        onClick={handleSwapOrder}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                      >
                        <ArrowUp size={12} />
                        <span>Set as Priority #1</span>
                      </button>
                    )}
                    {connectionStatus["codecraft"] ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          connectionStatus["codecraft"].ok
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${connectionStatus["codecraft"].ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {connectionStatus["codecraft"].ok ? `${connectionStatus["codecraft"].latency}ms` : "Offline"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Gateway Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Configuration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* CodeCraft Base URL */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Base URL (OpenAI Compatible)
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        value={codecraftBaseUrl}
                        onChange={(e) => setCodecraftBaseUrl(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 font-mono text-[12px] text-slate-800 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Default Model */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Active Model
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomModelMode(!customModelMode);
                          if (!customModelMode) setCustomModelInput(model);
                        }}
                        className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline transition cursor-pointer"
                      >
                        {customModelMode ? "Select from list" : "Enter custom ID"}
                      </button>
                    </div>

                    {customModelMode ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          value={customModelInput}
                          onChange={(e) => {
                            setCustomModelInput(e.target.value);
                            setModel(e.target.value);
                          }}
                          placeholder="e.g. gemini-3.8-flash, claude-opus-4.8"
                          className="h-10 flex-1 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 px-3.5 font-mono text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomModelMode(false)}
                          className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="relative mt-1.5">
                        <select
                          value={model}
                          onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              setCustomModelMode(true);
                              setCustomModelInput(model);
                            } else {
                              setModel(e.target.value);
                            }
                          }}
                          className="h-10 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-8 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                        >
                          <optgroup label="⚡ Google Gemini (via CodeCraft API)">
                            <option value="gemini-3.8-flash">gemini-3.8-flash (CodeCraft · Gemini 3.8 Flash Workhorse · Recommended)</option>
                            <option value="gemini-3.6-flash">gemini-3.6-flash (CodeCraft · Gemini 3.6 Flash Fast &amp; Efficient)</option>
                            <option value="gemini-2.5-flash">gemini-2.5-flash (CodeCraft · Gemini 2.5 Flash Vision OCR)</option>
                            <option value="gemini-2.5-pro">gemini-2.5-pro (CodeCraft · Gemini 2.5 Pro Deep Reasoning)</option>
                          </optgroup>
                          <optgroup label="🧠 Anthropic Claude (via CodeCraft API)">
                            <option value="claude-opus-4.8">claude-opus-4.8 (CodeCraft · Flagship Sales Assistant)</option>
                            <option value="claude-sonnet-4.6">claude-sonnet-4.6 (CodeCraft · Fast Sales Assistant)</option>
                          </optgroup>
                          <optgroup label="🌐 OpenAI &amp; DeepSeek (via CodeCraft API)">
                            <option value="gpt-4o">gpt-4o (CodeCraft · Multimodal Omni)</option>
                            <option value="gpt-4o-mini">gpt-4o-mini (CodeCraft · Cost-Efficient)</option>
                            <option value="deepseek-chat">deepseek-chat (CodeCraft · Low-Cost V3)</option>
                            <option value="deepseek-reasoner">deepseek-reasoner (CodeCraft · R1 Reasoning)</option>
                          </optgroup>
                          <option value="__custom__">✍️ + Enter custom model ID...</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Saved Real API Keys Pool (CodeCraft) ── */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Key size={13} />
                      </div>
                      <div>
                        <span className="text-[12.5px] font-bold text-slate-900 dark:text-white">
                          Saved CodeCraft API Keys ({codecraftKeys.length})
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 ml-1.5 hidden sm:inline">
                          · Real database keys with instant active switching &amp; deletion
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewKeyForm({ name: "", key: "", is_active: codecraftKeys.length === 0 });
                        setKeyModal({ provider: "codecraft", isOpen: true });
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Add More Key</span>
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
                    {codecraftKeys.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-[12px]">
                        No keys saved in pool. Click "+ Add More Key" to register a CodeCraft API key.
                      </div>
                    ) : (
                      codecraftKeys.map((k) => (
                        <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 hover:bg-white/80 dark:hover:bg-slate-800/80 transition">
                          <div className="min-w-0 flex-1 flex items-center gap-3">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] shrink-0">
                              <Key size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{k.name}</span>
                                {k.is_active ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" /> Active (In Use)
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    Standby Failover
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 font-mono text-[11.5px] text-slate-600 dark:text-slate-400">
                                <span>{k.key_masked}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(k.id, k.key_masked)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
                                  title="Copy key identifier"
                                >
                                  {copiedKeyId === k.id ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {!k.is_active ? (
                              <button
                                type="button"
                                onClick={() => activateKeyMutation.mutate({ provider: "codecraft", keyId: k.id })}
                                disabled={activateKeyMutation.isPending}
                                className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 px-2.5 py-1 text-[11.5px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                              >
                                Set as Active
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-1">● Routing Traffic</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete "${k.name}" from the database?`)) {
                                  deleteKeyMutation.mutate({ provider: "codecraft", keyId: k.id });
                                }
                              }}
                              disabled={deleteKeyMutation.isPending || codecraftKeys.length <= 1}
                              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title={codecraftKeys.length <= 1 ? "Cannot delete the only key" : "Delete key from database"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-950/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestConnection("codecraft")}
                      disabled={testingConnection === "codecraft"}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition disabled:opacity-50 cursor-pointer"
                    >
                      {testingConnection === "codecraft" ? (
                        <RefreshCw size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Zap size={13} className="text-indigo-600 dark:text-indigo-400" />
                      )}
                      <span>Test CodeCraft connection</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Real-time pool rotation prevents token limits</span>
                  </div>
                </div>
              </div>
            );

            const geminiCard = (
              <div
                key="gemini-gateway"
                className={`rounded-2xl border-2 ${
                  !isFirstCodecraft
                    ? "border-sky-400 dark:border-sky-500/70 bg-gradient-to-br from-sky-50/80 via-white to-slate-50/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-950/70 shadow-md"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                } p-5 space-y-4.5 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">Google Gemini</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            !isFirstCodecraft
                              ? "bg-sky-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {!isFirstCodecraft ? "Priority #1 · Primary Engine" : "Priority #2 · Failover & OCR"}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                        High-speed Vision OCR for ABA &amp; Bakong KHQR slips + direct Google Gemini failover route.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFirstCodecraft && (
                      <button
                        type="button"
                        onClick={handleSwapOrder}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/60 px-3 py-1.5 text-[11.5px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 active:scale-95 transition shadow-2xs cursor-pointer"
                      >
                        <ArrowUp size={12} strokeWidth={2.5} />
                        <span>Set as Priority #1</span>
                      </button>
                    )}
                    {connectionStatus["gemini"] ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          connectionStatus["gemini"].ok
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${connectionStatus["gemini"].ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {connectionStatus["gemini"].ok ? `${connectionStatus["gemini"].latency}ms` : "Offline"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* Gemini Model Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Fallback &amp; Vision Model
                    </label>
                    <div className="relative mt-1.5">
                      <select
                        value={fallbackModel}
                        onChange={(e) => setFallbackModel(e.target.value)}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-8 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus:border-sky-500 focus:outline-none cursor-pointer"
                      >
                        <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini 3.8 Flash High-Throughput · Vision OCR · Recommended)</option>
                        <option value="gemini-3.6-flash">gemini-3.6-flash (Gemini 3.6 Flash Fast Code &amp; Multitask)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Gemini 2.5 Flash Vision OCR)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Gemini 2.5 Pro Complex Reasoning)</option>
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleTestConnection("gemini")}
                      disabled={testingConnection === "gemini"}
                      className="h-10 flex items-center gap-2 rounded-xl border border-sky-300 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/50 px-4 text-[12px] font-bold text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/70 active:scale-95 transition disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      {testingConnection === "gemini" ? (
                        <RefreshCw size={13} className="animate-spin text-sky-600 dark:text-sky-400" />
                      ) : (
                        <Zap size={13} className="text-sky-600 dark:text-sky-400" />
                      )}
                      <span>Test Gemini Gateway Connection</span>
                    </button>
                  </div>
                </div>

                {/* ── Saved Real API Keys Pool (Google Gemini) ── */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                        <Key size={13} />
                      </div>
                      <div>
                        <span className="text-[12.5px] font-bold text-slate-900 dark:text-white">
                          Saved Google Gemini Keys ({geminiKeys.length})
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 ml-1.5 hidden sm:inline">
                          · Real database keys for slip verification &amp; failover
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewKeyForm({ name: "", key: "", is_active: geminiKeys.length === 0 });
                        setKeyModal({ provider: "gemini", isOpen: true });
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-sky-700 transition shadow-xs cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Add More Key</span>
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
                    {geminiKeys.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-[12px]">
                        No keys saved in pool. Click "+ Add More Key" to register a Google Gemini key.
                      </div>
                    ) : (
                      geminiKeys.map((k) => (
                        <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 hover:bg-white/80 dark:hover:bg-slate-800/80 transition">
                          <div className="min-w-0 flex-1 flex items-center gap-3">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] shrink-0">
                              <Key size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{k.name}</span>
                                {k.is_active ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" /> Active (In Use)
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    Standby Failover
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 font-mono text-[11.5px] text-slate-600 dark:text-slate-400">
                                <span>{k.key_masked}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(k.id, k.key_masked)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
                                  title="Copy key identifier"
                                >
                                  {copiedKeyId === k.id ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {!k.is_active ? (
                              <button
                                type="button"
                                onClick={() => activateKeyMutation.mutate({ provider: "gemini", keyId: k.id })}
                                disabled={activateKeyMutation.isPending}
                                className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/50 px-2.5 py-1 text-[11.5px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                              >
                                Set as Active
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-1">● Routing Traffic</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete "${k.name}" from the database?`)) {
                                  deleteKeyMutation.mutate({ provider: "gemini", keyId: k.id });
                                }
                              }}
                              disabled={deleteKeyMutation.isPending || geminiKeys.length <= 1}
                              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title={geminiKeys.length <= 1 ? "Cannot delete the only key" : "Delete key from database"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );

            return isFirstCodecraft ? (
              <>
                {codecraftCard}
                {geminiCard}
              </>
            ) : (
              <>
                {geminiCard}
                {codecraftCard}
              </>
            );
          })()}
        </div>

        {/* Right: API Spend Card (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">{t("ai.spend", "API spend · October")}</h2>
              </div>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                ● {budgetPct}% of budget
              </span>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
              {t("ai.totalSpendSub", "Total API consumption and billing overhead")}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white">
                ${spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                / ${budget.toLocaleString()} {t("ai.budget", "budget")}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${budgetPct}%` }}
              />
            </div>

            {/* Daily Bar Chart */}
            <div className="mt-6 flex h-24 items-end gap-1 px-1 border-b border-slate-100 dark:border-slate-800 pb-1">
              {spendBars.length === 0 ? (
                <div className="w-full flex items-center justify-center h-full text-[12px] text-slate-400 dark:text-slate-500">
                  No AI request activity recorded in this period
                </div>
              ) : (
                spendBars.map((b, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full rounded-t-sm bg-amber-500/80 transition-all duration-200 group-hover:bg-amber-600"
                      style={{ height: `${Math.round(b.h * 0.9)}px` }}
                    />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-slate-900 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-white font-mono z-10 whitespace-nowrap shadow-xs">
                      Day {b.day}: {b.h > 4 ? `Active (${b.h}%)` : "0 msgs"}
                    </div>
                  </div>
                ))
              )}
            </div>
            {spendBars.length > 0 && (
              <div className="flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1 font-medium">
                <span>Day {spendBars[0]?.day}</span>
                <span>Day {spendBars[spendBars.length - 1]?.day}</span>
              </div>
            )}
          </div>

          {/* Tokens Summary */}
          <div className="mt-6 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Primary Gateway</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {aiStats.data?.primary_gateway || (isFirstCodecraft ? "CodeCraft API" : "Google Gemini")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Total tokens</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                  Real Telemetry
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {aiStats.data?.total_tokens ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                CodeCraft API
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {aiStats.data?.codecraft_tokens ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-sky-500" />
                Google Gemini
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {aiStats.data?.gemini_tokens ?? "0"}
              </span>
            </div>
            {aiStats.data?.prompt_tokens && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                <span>Prompt / Output split</span>
                <span>{aiStats.data.prompt_tokens} in · {aiStats.data.completion_tokens} out</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <span className="text-slate-500 dark:text-slate-400">Avg cost / request</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {spend > 0 ? "$0.0012" : "$0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── User & Shop AI Access Control Center ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">User &amp; Shop AI Access Controls</h2>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Control which merchant shops can consume AI tokens, enforce plan monthly quotas, and shut off abusive users.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {shopControls.filter((s) => s.ai_enabled).length} of {shopControls.length} Shops Active
            </span>
          </div>
        </div>

        {/* Global Policy Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">Centralized API Key Enforcement</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Route all shop users through Super Admin CodeCraft API keys. Users do not manage separate keys.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={userControlEnabled}
                onChange={(e) => setUserControlEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">Enforce Plan Reply Quotas</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Free: 500 · Pro: 10,000 · Enterprise: 100,000 replies. Automatically locks AI when quota is exhausted.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={enforceTokenQuotas}
                onChange={(e) => setEnforceTokenQuotas(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Live Shop Access Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAFC]/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Shop Name</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Monthly Usage</th>
                <th className="py-3 px-4">Quota Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">AI Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shopControls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No shops found in system.
                  </td>
                </tr>
              ) : (
                shopControls.map((shop) => (
                  <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {shop.name}
                      <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">{shop.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          shop.plan_name === "Enterprise"
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                            : shop.plan_name === "Pro"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {shop.plan_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {shop.ai_replies_used.toLocaleString()} msgs
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{shop.quota_pct}%</span>
                          <span>{shop.ai_replies_limit.toLocaleString()} max</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              shop.quota_pct >= 90
                                ? "bg-rose-500"
                                : shop.quota_pct >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${shop.quota_pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {shop.ai_enabled ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-700 dark:text-rose-400">
                          <span className="size-1.5 rounded-full bg-rose-500" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleShopMutation.mutate(shop.id)}
                        disabled={toggleShopMutation.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold shadow-2xs transition ${
                          shop.ai_enabled
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        }`}
                      >
                        <Power size={12} />
                        <span>{shop.ai_enabled ? "Suspend AI" : "Enable AI"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Global System Prompt & Intelligence Rules ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">{t("ai.systemPrompt", "Global system prompt")}</h2>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("ai.promptSub", "This prompt is injected before shop-specific instructions")}
            </p>
          </div>

          {/* Preset Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Presets:</span>
            <div className="relative">
              <select
                onChange={(e) => {
                  const tmpl = PROMPT_TEMPLATES.find((p) => p.name === e.target.value);
                  if (tmpl) handleApplyTemplate(tmpl);
                }}
                defaultValue=""
                className="appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-8 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="" disabled className="dark:bg-slate-800 dark:text-slate-400">
                  Load prompt template…
                </option>
                {PROMPT_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.name} value={tmpl.name} className="dark:bg-slate-800 dark:text-slate-200">
                    {tmpl.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Prompt Textarea */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/95 dark:bg-slate-950/90 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-400">
            <span className="font-mono">system_instructions.md</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                showToast("info", "Prompt copied to clipboard!");
              }}
              className="flex items-center gap-1 hover:text-white transition"
            >
              <Copy size={12} />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-4 py-1.5 text-[11px] font-mono text-slate-400">
            <span>Encoding: UTF-8 (Bilingual Khmer/English)</span>
            <span>{prompt.length} chars • ~{Math.round(prompt.length / 4)} tokens</span>
          </div>
        </div>

        {/* Dynamic Context Variables */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Layers size={13} />
            <span>{t("ai.variables", "Dynamic variables (Click to insert)")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AVAILABLE_VARIABLES.map((v) => (
              <button
                key={v.token}
                onClick={() => handleInsertToken(v.token)}
                title={v.desc}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-300 active:scale-95 transition"
              >
                <Plus size={11} className="text-slate-400" />
                <span>{v.token}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature & Max Tokens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                <Sliders size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t("ai.temperature", "Temperature & Sampling")}</span>
              </label>
              <span className="font-mono text-[12px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span>0.0 (Precise / Factual)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Max Response Tokens
            </label>
            <select
              defaultValue="512"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[12.5px] font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="256" className="dark:bg-slate-800 dark:text-slate-200">256 tokens (~60 words - Snappy chat)</option>
              <option value="512" className="dark:bg-slate-800 dark:text-slate-200">512 tokens (~150 words - Recommended)</option>
              <option value="1024" className="dark:bg-slate-800 dark:text-slate-200">1024 tokens (~300 words - Detailed)</option>
            </select>
          </div>
        </div>

        {/* Behavior Toggles */}
        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
          {/* Toggle 1: Allow custom instructions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                Allow shop owners to customize AI instructions
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                If disabled, individual shops cannot overwrite prompt behavior in Shop Settings
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowCustom}
                onChange={(e) => setAllowCustom(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Toggle 2: Sentiment analysis */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                Real-time sentiment classification &amp; priority routing
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tags <span className="text-emerald-600 dark:text-emerald-400 font-bold">● High Intent</span> ·{" "}
                <span className="text-sky-600 dark:text-sky-400 font-bold">● Inquiry</span> ·{" "}
                <span className="text-rose-600 dark:text-rose-400 font-bold">● Urgent / Escalation</span> and auto-pins urgent chats to staff
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sentimentAnalysis}
                onChange={(e) => setSentimentAnalysis(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Toggle 3: Auto failover */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                Automated Gemini failover on CodeCraft rate limits
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Guarantees 99.9% uptime by instantly retrying customer queries through Google Gemini
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={geminiFallback}
                onChange={(e) => setGeminiFallback(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ── AI Interactive Playground Modal ── */}
      {showPlayground && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                  <Play size={18} className="fill-indigo-600 dark:fill-indigo-400" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    AI Interactive Playground (CodeCraft Engine)
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    Simulate customer chats through CodeCraft API models and verify Khmer/English replies
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPlayground(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Engine / Model:</span>
                  <select
                    value={playgroundModel}
                    onChange={(e) => setPlaygroundModel(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[12px] font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none"
                  >
                    <optgroup label="⚡ Google Gemini" className="dark:bg-slate-800 dark:text-slate-200">
                      <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Latest Workhorse)</option>
                      <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
                      <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                    </optgroup>
                    <optgroup label="🚀 CodeCraft API Gateway" className="dark:bg-slate-800 dark:text-slate-200">
                      <option value="gemini-3.8-flash">CodeCraft: gemini-3.8-flash</option>
                      <option value="gemini-3.6-flash">CodeCraft: gemini-3.6-flash</option>
                      <option value="claude-opus-4.8">CodeCraft: claude-opus-4.8</option>
                      <option value="claude-sonnet-4.6">CodeCraft: claude-sonnet-4.6</option>
                      <option value="gpt-4o">CodeCraft: gpt-4o</option>
                      <option value="deepseek-chat">CodeCraft: deepseek-chat</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                  <span>Temperature: <strong className="text-slate-800 dark:text-slate-200">{temperature}</strong></span>
                </div>
              </div>

              {/* Quick sample prompt chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick test scenarios:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "🇰🇭 Product Inquiry (Khmer)", text: "សួស្តី តើមានឡេការពារកម្តៅថ្ងៃលក់ទេ?" },
                    { label: "🇺🇸 Shipping & Cost (English)", text: "Hi, do you deliver to Siem Reap? How much does it cost?" },
                    { label: "⚠️ Urgent Escalation", text: "This order is late! I want my refund immediately!" },
                    { label: "💳 Slip Verification", text: "I just sent $15.50 via ABA PayWay, please check." },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setPlaygroundMessage(chip.text)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Test Input */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Inbound Message:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playgroundMessage}
                    onChange={(e) => setPlaygroundMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRunPlayground();
                    }}
                    placeholder="Enter customer message in Khmer or English…"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRunPlayground}
                    disabled={playgroundLoading || !playgroundMessage.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {playgroundLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Simulate</span>
                  </button>
                </div>
              </div>

              {/* AI Response Output */}
              {playgroundResponse && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-white text-[13px]">Simulated Assistant Response</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          playgroundResponse.sentiment_color === "rose"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : playgroundResponse.sentiment_color === "emerald"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                        }`}
                      >
                        ● {playgroundResponse.sentiment}
                      </span>
                      <span className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                        {playgroundResponse.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    {playgroundResponse.reply}
                  </p>

                  <div className="space-y-2 pt-1 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
                      <span>Engine: <strong className="text-slate-800 dark:text-slate-200">{playgroundResponse.model_used}</strong> ({playgroundResponse.provider === "gemini" ? "Google Gemini" : playgroundResponse.provider === "codecraft" ? "CodeCraft API" : "Local Rules"})</span>
                      <span className="flex items-center gap-1.5">
                        {playgroundResponse.is_real_tokens ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 font-sans text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                            Real API Telemetry
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 font-sans text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Estimated (Add active key for live API)
                          </span>
                        )}
                        <span>Latency: {playgroundResponse.latency_ms}ms</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span>Total tokens: <strong className="text-indigo-600 dark:text-indigo-400">{playgroundResponse.total_tokens}</strong></span>
                      <span>Prompt: <strong>{playgroundResponse.tokens_prompt}</strong></span>
                      <span>Completion: <strong>{playgroundResponse.tokens_completion}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
              <button
                type="button"
                onClick={() => setShowPlayground(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Close Playground
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rotate / Edit API Key Modal ── */}
      {rotatingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  Rotate {rotatingProvider} Key
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Provide a new secret API key for this provider</p>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New API Key
              </label>
              <input
                type="password"
                placeholder={rotatingProvider === "CodeCraft API" ? "cc_xxxxxxxxxxxxxxxxxxxxxxxx..." : "sk-..."}
                value={rotationKeyInput}
                onChange={(e) => setRotationKeyInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 font-mono text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              New key will be encrypted and replace the current credential upon confirmation.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRotatingProvider(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rotationKeyInput.trim()}
                onClick={() => {
                  if (rotatingProvider === "CodeCraft API") setCodecraftKey(rotationKeyInput);
                  if (rotatingProvider === "Google Gemini") setGeminiKey(rotationKeyInput);
                  setRotatingProvider(null);
                  showToast("success", `${rotatingProvider} API key updated! Click "Save changes" to persist.`);
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Apply Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Custom AI Provider Modal ── */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Add Custom AI Provider</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Connect CodeCraft endpoint, Anthropic, or custom model proxy</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. CodeCraft Custom Proxy"
                  value={newProviderForm.name}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Endpoint / Base URL
                </label>
                <input
                  type="text"
                  placeholder="https://codecraftapi.com/v1"
                  value={newProviderForm.baseUrl}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, baseUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Secret Key
                </label>
                <input
                  type="password"
                  placeholder="cc_..."
                  value={newProviderForm.apiKey}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, apiKey: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  placeholder="claude-opus-4.8"
                  value={newProviderForm.defaultModel}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, defaultModel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddProvider(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newProviderForm.name.trim()}
                onClick={() => {
                  showToast("success", `Custom provider "${newProviderForm.name}" registered successfully!`);
                  setShowAddProvider(false);
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Gateway Key Modal ── */}
      {keyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl text-white ${
                    keyModal.provider === "codecraft" ? "bg-indigo-600 shadow-sm shadow-indigo-600/30" : "bg-sky-600 shadow-sm shadow-sky-600/30"
                  }`}
                >
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Add Real API Key · {keyModal.provider === "codecraft" ? "CodeCraft API" : "Google Gemini"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Persist a new secret API key directly into the database pool
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setKeyModal(null);
                  setNewKeyForm({ name: "", key: "", is_active: true });
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Label / Purpose Name
                </label>
                <input
                  type="text"
                  placeholder={
                    keyModal.provider === "codecraft"
                      ? "e.g. CodeCraft Production Secondary"
                      : "e.g. Gemini 3.8 Flash Vision Key"
                  }
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Secret Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewKeySecret ? "text" : "password"}
                    placeholder={
                      keyModal.provider === "codecraft"
                        ? "cc_live_xxxxxxxxxxxxxxxx..."
                        : "AIzaSyxxxxxxxxxxxxxxxxx..."
                    }
                    value={newKeyForm.key}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, key: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-10 py-2 font-mono text-[12.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKeySecret(!showNewKeySecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={showNewKeySecret ? "Hide secret key" : "Show secret key"}
                  >
                    {showNewKeySecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Real secret key. Will be stored securely in the database and masked in responses.
                </p>
              </div>

              <label className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newKeyForm.is_active}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                />
                <span>Set as Active Key immediately for all live AI requests</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setKeyModal(null);
                  setNewKeyForm({ name: "", key: "", is_active: true });
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newKeyForm.key.trim() || addKeyMutation.isPending}
                onClick={() => {
                  addKeyMutation.mutate({
                    provider: keyModal.provider,
                    name:
                      newKeyForm.name.trim() ||
                      (keyModal.provider === "codecraft" ? "CodeCraft API Key" : "Google Gemini Key"),
                    key: newKeyForm.key.trim(),
                    is_active: newKeyForm.is_active,
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4.5 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {addKeyMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                <span>{addKeyMutation.isPending ? "Saving Key..." : "Save Key to Pool"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

