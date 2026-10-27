import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { clsx } from "clsx";

import { api } from "../../lib/api";
import { useLanguage } from "../../lib/i18n";
import {
  KnowledgeArticle,
  KnowledgeBaseRecord,
  KnowledgeStatusResponse,
  KnowledgeUploadResponse,
  Product,
  QuickReply,
} from "../../lib/types";

type Tab = "products" | "policies" | "history" | "replies";

export function OwnerProducts() {
  const { language } = useLanguage();
  const [tab, setTab] = useState<Tab>("products");

  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/products"),
  });
  const knowledge = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => api.get<KnowledgeArticle[]>("/knowledge"),
  });
  const records = useQuery({
    queryKey: ["knowledge-records"],
    queryFn: () => api.get<KnowledgeBaseRecord[]>("/knowledge/records"),
  });
  const quickReplies = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => api.get<QuickReply[]>("/quick-replies"),
  });

  const productsCount = products.data?.length ?? 0;
  const policiesCount = knowledge.data?.length ?? 0;
  const recordsCount = records.data?.length ?? 0;
  const repliesCount = quickReplies.data?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {language === "km" ? "ម៉ឺនុយ & ការបញ្ចូលទិន្នន័យ AI" : "AI Knowledge & Menu Ingestion"}
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {language === "km"
              ? "គ្មានការវាយបញ្ចូលដោយដៃដ៏ស្មុគស្មាញទៀតទេ! គ្រាន់តែអូសទម្លាក់រូបភាពម៉ឺនុយ បញ្ជីតម្លៃ ឬឯកសារ (PDF/CSV) ប្រព័ន្ធ AI នឹងស្រង់ទំនិញ និងគោលការណ៍ហាងដោយស្វ័យប្រវត្តិ។"
              : "Zero manual typing needed. Simply drop your menu, price list, flyer, or document (PDF/CSV). Our multimodal AI extracts products and store policies directly for your chatbot."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 p-1 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setTab("products")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              tab === "products"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Package size={14} className={tab === "products" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
            <span>{language === "km" ? "ទំនិញ" : "Products"}</span>
            <span className="rounded-full bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-slate-200">
              {productsCount}
            </span>
          </button>

          <button
            onClick={() => setTab("policies")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              tab === "policies"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <ShieldCheck size={14} className={tab === "policies" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
            <span>{language === "km" ? "គោលការណ៍ហាង" : "Policies & FAQs"}</span>
            <span className="rounded-full bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-slate-200">
              {policiesCount}
            </span>
          </button>

          <button
            onClick={() => setTab("history")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              tab === "history"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Clock size={14} className={tab === "history" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
            <span>{language === "km" ? "ប្រវត្តិបញ្ចូល" : "Upload History"}</span>
            <span className="rounded-full bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-slate-200">
              {recordsCount}
            </span>
          </button>

          <button
            onClick={() => setTab("replies")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              tab === "replies"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <MessageSquare size={14} className={tab === "replies" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"} />
            <span>{language === "km" ? "សាររហ័ស" : "Quick Replies"}</span>
            <span className="rounded-full bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-slate-200">
              {repliesCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── 1-Click Zero-Friction AI Ingestion Dropzone (Always Visible at Top) ── */}
      <ZeroFrictionDropzone />

      {/* ── Tab Views ── */}
      {tab === "products" && <ExtractedProductsView />}
      {tab === "policies" && <ExtractedPoliciesView />}
      {tab === "history" && <UploadHistoryView />}
      {tab === "replies" && <RepliesView />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Hero Component: Zero-Friction 1-Click AI Uploader
// ──────────────────────────────────────────────────────────────────

function ZeroFrictionDropzone() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<KnowledgeStatusResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadError(null);
      setStatusResult(null);
      const formData = new FormData();
      formData.append("file", file);
      return api.post<KnowledgeUploadResponse>("/knowledge/upload", formData);
    },
    onSuccess: (data) => {
      setActiveTaskId(data.task_id);
    },
    onError: (err: any) => {
      setUploadError(err.message || "Failed to upload file. Please try again.");
    },
  });

  // Polling for Extraction Status
  useEffect(() => {
    if (!activeTaskId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<KnowledgeStatusResponse>(`/knowledge/status/${activeTaskId}`);
        if (!isSubscribed) return;

        setStatusResult(res);

        if (res.status === "processed" || res.status === "failed") {
          clearInterval(interval);
          setActiveTaskId(null);
          // Invalidate relevant queries so UI refreshes automatically
          void qc.invalidateQueries({ queryKey: ["products"] });
          void qc.invalidateQueries({ queryKey: ["knowledge"] });
          void qc.invalidateQueries({ queryKey: ["knowledge-records"] });
        }
      } catch (e: any) {
        logClientError(e);
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeTaskId, qc]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit. Please upload a smaller document or image.");
      return;
    }
    uploadMutation.mutate(file);
  };

  const isExtracting = uploadMutation.isPending || activeTaskId !== null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 via-teal-50/20 to-indigo-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-indigo-950/20 p-6 sm:p-8 transition-all">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={clsx(
          "flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl transition",
          isDragging && "scale-[1.01] opacity-90"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 flex-shrink-0 animate-pulse-subtle">
            <UploadCloud size={28} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <Sparkles size={12} />
                {language === "km" ? "បច្ចេកវិទ្យា AI ស្វ័យប្រវត្តិ" : "Gemini Multimodal AI"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === "km" ? "រូបភាព, PDF ឬ CSV រហូតដល់ 10MB" : "Images, PDF, or CSV up to 10MB"}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {language === "km"
                ? "អូសទម្លាក់រូបភាពម៉ឺនុយ ឬឯកសារតម្លៃនៅទីនេះ"
                : "Drop your Restaurant Menu, Price Flyer, or Catalog"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              {language === "km"
                ? "AI នឹងអាន និងទាញយកឈ្មោះទំនិញ តម្លៃ ការពិពណ៌នា និងគោលការណ៍ដឹកជញ្ជូនចូលទៅក្នុង Chatbot ដោយមិនចាំបាច់វាយបញ្ចូលដោយដៃឡើយ។"
                : "Our AI scans the document, extracts items, prices, options, and store rules, and immediately trains your chatbot to reply to customers."}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {["Flyer (JPG/PNG)", "Menu Brochure", "PDF Catalog", "Excel/CSV Sheet"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-2xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{language === "km" ? "AI កំពុងដំណើរការ..." : "Extracting with AI..."}</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>{language === "km" ? "ជ្រើសរើសឯកសារ ឬរូបភាព" : "Upload File or Photo"}</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
            {language === "km" ? "ដំណើរការលឿនក្នុងរយៈពេល ២-៥ វិនាទី" : "Auto-processes in ~3 seconds"}
          </span>
        </div>
      </div>

      {/* Progress & Live Extraction Status Card */}
      {isExtracting && (
        <div className="mt-5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white/95 dark:bg-slate-900/90 p-4 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin text-emerald-600" />
              <span>
                {language === "km"
                  ? "AI កំពុងវិភាគឯកសារ និងស្រង់ទិន្នន័យផលិតផល..."
                  : "Scanning document & extracting structured knowledge with Gemini Flash..."}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">Task: {activeTaskId?.slice(0, 8)}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 h-full w-full animate-progress" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} />
              <span>File Uploaded</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} />
              <span>Vision & OCR</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} />
              <span>Item & Price Extraction</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={12} />
              <span>Chatbot Sync</span>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {statusResult && statusResult.status === "processed" && !isExtracting && (
        <div className="mt-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-white flex-shrink-0">
              <Check size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {language === "km"
                  ? "🎉 ស្រង់ទិន្នន័យជោគជ័យ និងភ្ជាប់ទៅ Chatbot រួចរាល់!"
                  : "🎉 Knowledge Extracted & Synchronized Successfully!"}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Extracted <b>{statusResult.preview?.products?.length ?? 0} products</b> and{" "}
                <b>{statusResult.preview?.policies?.length ?? 0} store policies</b> from{" "}
                <span className="font-mono">{statusResult.file_name}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusResult(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {(uploadError || (statusResult && statusResult.status === "failed")) && (
        <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Extraction Issue</p>
            <p className="text-[11px] leading-relaxed">
              {uploadError || statusResult?.error || "An error occurred during extraction. Please check your document and try again."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tab 1: Extracted Products & Catalog View
// ──────────────────────────────────────────────────────────────────

function ExtractedProductsView() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const list = useQuery({ queryKey: ["products"], queryFn: () => api.get<Product[]>("/products") });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (p: Product) =>
      api.put(`/products/${p.id}`, { ...p, is_active: !p.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const saveProductMutation = useMutation({
    mutationFn: async (data: { id?: number; payload: any }) => {
      if (data.id) {
        return api.put<Product>(`/products/${data.id}`, data.payload);
      }
      return api.post<Product>("/products", data.payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
      setIsCreating(false);
    },
  });

  const allProducts = list.data ?? [];
  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "km" ? "ស្វែងរកផលិតផល ឬមុខម្ហូប..." : "Search extracted items or menu..."}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <Plus size={14} />
            <span>{language === "km" ? "បន្ថែមទំនិញថ្មី" : "Add Product"}</span>
          </button>

          <button
            onClick={() => void qc.invalidateQueries({ queryKey: ["products"] })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products Grid / Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto">
            <Package size={24} />
          </div>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {language === "km" ? "មិនទាន់មានទំនិញត្រូវបានបញ្ចូលនៅឡើយទេ" : "No products extracted yet"}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {language === "km"
              ? "សូមអូសទម្លាក់រូបភាពម៉ឺនុយ ឬឯកសារតម្លៃនៅផ្នែកខាងលើ ដើម្បីឱ្យ AI ស្រង់ទិន្នន័យដោយស្វ័យប្រវត្តិ។"
              : "Drop a product flyer, restaurant menu, or price list into the uploader above to auto-generate your catalog."}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold transition cursor-pointer mx-auto"
          >
            <Plus size={14} />
            <span>{language === "km" ? "បង្កើតទំនិញដោយដៃ" : "Add First Product Manually"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const hasZeroPrice = p.price <= 0;
            return (
              <div
                key={p.id}
                className={clsx(
                  "group relative rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between",
                  p.is_active
                    ? hasZeroPrice
                      ? "border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-300/30"
                      : "border-slate-200/80 dark:border-slate-800"
                    : "border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <Sparkles size={10} />
                        AI Live
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-1">{p.name}</h3>
                    </div>

                    {hasZeroPrice ? (
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer shadow-2xs group/btn flex-shrink-0"
                        title="Click to set price"
                      >
                        <AlertCircle size={12} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span>$0.00 · Set Price</span>
                        <Pencil size={10} className="text-amber-600 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="group/price inline-flex items-center gap-1.5 text-base font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer flex-shrink-0"
                        title="Click to edit price"
                      >
                        <span>${p.price.toFixed(2)}</span>
                        <Pencil size={11} className="opacity-0 group-hover/price:opacity-100 text-slate-400 transition" />
                      </button>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Edit product price, name, and details"
                    >
                      <Pencil size={11} />
                      <span>{language === "km" ? "កែតម្លៃ" : "Edit Price"}</span>
                    </button>

                    <button
                      onClick={() => toggleActiveMutation.mutate(p)}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer",
                        p.is_active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      {p.is_active ? "Active in Chat" : "Paused"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Remove "${p.name}" from store catalog?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Product Modal */}
      {(editingProduct || isCreating) && (
        <ProductEditModal
          product={editingProduct}
          isCreating={isCreating}
          onClose={() => {
            setEditingProduct(null);
            setIsCreating(false);
          }}
          onSave={async (payload) => {
            await saveProductMutation.mutateAsync({
              id: editingProduct?.id,
              payload,
            });
          }}
          isSaving={saveProductMutation.isPending}
          language={language}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Product Edit / Create Modal Component
// ──────────────────────────────────────────────────────────────────

interface ProductEditModalProps {
  product: Product | null;
  isCreating: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  isSaving: boolean;
  language: string;
}

function ProductEditModal({
  product,
  isCreating,
  onClose,
  onSave,
  isSaving,
  language,
}: ProductEditModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "999");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isActive, setIsActive] = useState(product ? product.is_active : true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(language === "km" ? "សូមបញ្ចូលឈ្មោះទំនិញ" : "Product name is required");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError(language === "km" ? "សូមបញ្ចូលតម្លៃត្រឹមត្រូវ (>= 0)" : "Please enter a valid price (>= 0)");
      return;
    }

    const numStock = parseInt(stock, 10);
    const parsedStock = isNaN(numStock) || numStock < 0 ? 0 : numStock;

    const payload = {
      name: name.trim(),
      price: numPrice,
      stock: parsedStock,
      category: category.trim() || null,
      description: description.trim(),
      is_active: isActive,
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  const isZeroPrice = Boolean(product && product.price <= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package size={18} />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isCreating
                  ? language === "km"
                    ? "បន្ថែមទំនិញថ្មី"
                    : "Add New Product"
                  : language === "km"
                  ? "កែសម្រួលតម្លៃ & ព័ត៌មានទំនិញ"
                  : "Edit Product & Price"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "km"
                  ? "កំណត់តម្លៃ និងព័ត៌មានសម្រាប់ AI Chatbot ឆ្លើយតបអតិថិជន"
                  : "Update price & details for your AI chatbot catalog"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zero Price Notice */}
        {isZeroPrice && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              {language === "km"
                ? "រូបភាពដែលអ្នកបានបញ្ចូលមិនមានស្លាកតម្លៃឡើយ។ សូមកំណត់តម្លៃលក់ជាក់ស្តែងនៅទីនេះ ដើម្បីឱ្យ AI អាចប្រាប់តម្លៃដល់អតិថិជនបានត្រឹមត្រូវ។"
                : "This product was extracted from a photo without a printed price tag. Please set your selling price below so the AI chatbot can quote it to customers in chat."}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "km" ? "ឈ្មោះទំនិញ *" : "Product Name *"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Light Blue Dress Shirt, Iced Latte, Pizza..."
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-600" />
                <span>{language === "km" ? "តម្លៃ (USD) *" : "Price (USD $) *"}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus={isZeroPrice}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-7 pr-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "km" ? "ចំនួនក្នុងស្តុក" : "Stock Quantity"}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="999"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "km" ? "ប្រភេទ / ប្រភេទមុខទំនិញ (ស្រេចចិត្ត)" : "Category (Optional)"}
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Apparel, Drinks, Desserts..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "km" ? "ការពិពណ៌នាទំនិញ" : "Description / Details"}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, materials, sizing, or ingredients for chatbot reference..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Active in Chatbot Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {language === "km"
                ? "អនុញ្ញាតឱ្យ AI Chatbot ណែនាំ និងលក់ទំនិញនេះ (Active in Chat)"
                : "Active in Chatbot (AI will recommend and quote this item to customers)"}
            </span>
          </label>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {language === "km" ? "បោះបង់" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{language === "km" ? "កំពុងរក្សាទុក..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{language === "km" ? "រក្សាទុកការកែប្រែ" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tab 2: Store Policies & Chatbot Rules View
// ──────────────────────────────────────────────────────────────────

function ExtractedPoliciesView() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["knowledge"], queryFn: () => api.get<KnowledgeArticle[]>("/knowledge") });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/knowledge/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });

  const articles = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === "km" ? "គោលការណ៍ហាង & ចម្លើយដែល AI យល់ដឹង" : "Store Policies & Auto-Pilot Guidelines"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === "km"
              ? "ទាំងនេះជាច្បាប់ហាង (ការដឹកជញ្ជូន, ការទូទាត់, ការធានា) ដែល AI ប្រើដើម្បីឆ្លើយតបអតិថិជន។"
              : "Rules extracted from your uploaded flyers and documents that the AI references when answering questions."}
          </p>
        </div>

        <button
          onClick={() => void qc.invalidateQueries({ queryKey: ["knowledge"] })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto">
            <BookOpen size={24} />
          </div>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {language === "km" ? "មិនទាន់មានគោលការណ៍ហាងនៅឡើយទេ" : "No store policies extracted yet"}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {language === "km"
              ? "អូសទម្លាក់ខិតប័ណ្ណហាង ឬឯកសារព័ត៌មានដឹកជញ្ជូននៅខាងលើ ដើម្បីឱ្យ AI កត់ត្រាដោយស្វ័យប្រវត្តិ។"
              : "Upload a policy document or flyer containing delivery fees, payment terms, or warranty to auto-generate FAQs."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-sm transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck size={14} />
                    {art.title}
                  </span>

                  <button
                    onClick={() => {
                      if (confirm(`Delete policy "${art.title}"?`)) {
                        deleteMutation.mutate(art.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {art.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Chatbot Reference</span>
                <span>ID: #{art.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tab 3: Uploaded Files & Ingestion History View
// ──────────────────────────────────────────────────────────────────

function UploadHistoryView() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["knowledge-records"],
    queryFn: () => api.get<KnowledgeBaseRecord[]>("/knowledge/records"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/knowledge/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge-records"] }),
  });

  const records = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === "km" ? "ឯកសារដែលបានបញ្ចូល" : "Uploaded Catalogs & Documents"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === "km"
              ? "បញ្ជីរូបភាព និងឯកសារដែល AI បានស្រង់ទិន្នន័យរួច"
              : "Complete history of menus, flyers, and CSV files processed by the AI engine."}
          </p>
        </div>

        <button
          onClick={() => void qc.invalidateQueries({ queryKey: ["knowledge-records"] })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center space-y-2">
          <FileText size={24} className="text-slate-400 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No upload history</p>
          <p className="text-xs text-slate-500">Your uploaded files will appear here once submitted.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Document / File</th>
                <th className="py-3 px-4">Source Type</th>
                <th className="py-3 px-4">Extraction Status</th>
                <th className="py-3 px-4">Items Extracted</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((r) => {
                const pCount = r.structured_data?.products?.length ?? 0;
                const polCount = r.structured_data?.policies?.length ?? 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {r.source_type === "image" ? <ImageIcon size={14} /> : <FileText size={14} />}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                          {r.file_name || `Document #${r.id}`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 uppercase text-[11px] font-semibold text-slate-500">
                      {r.source_type}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          r.status === "processed" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                          r.status === "processing" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                          r.status === "failed" && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        )}
                      >
                        {r.status === "processed" && <CheckCircle2 size={10} />}
                        {r.status === "processing" && <Loader2 size={10} className="animate-spin" />}
                        {r.status === "failed" && <AlertCircle size={10} />}
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {r.status === "processed" ? (
                        <span>
                          <b>{pCount}</b> products, <b>{polCount}</b> policies
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete record #${r.id}?`)) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tab 4: Quick Replies View (Kept for instant slash commands)
// ──────────────────────────────────────────────────────────────────

function RepliesView() {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["quick-replies"], queryFn: () => api.get<QuickReply[]>("/quick-replies") });
  const [command, setCommand] = useState("");
  const [text, setText] = useState("");

  const addMutation = useMutation({
    mutationFn: () => api.post<QuickReply>("/quick-replies", { command: command.startsWith("/") ? command : `/${command}`, text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quick-replies"] });
      setCommand("");
      setText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/quick-replies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quick-replies"] }),
  });

  const replies = list.data ?? [];

  return (
    <div className="space-y-4">
      {/* Quick Add Form */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {language === "km" ? "បង្កើតសារកាត់រហ័ស" : "Add New Quick Reply"}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="/price or /delivery"
            className="w-full sm:w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pre-canned reply message for chat staff..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!command.trim() || !text.trim() || addMutation.isPending}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
          >
            Add Shortcut
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {replies.map((qr) => (
          <div
            key={qr.id}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
                {qr.command}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">{qr.text}</p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(qr.id)}
              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function logClientError(err: any) {
  // Silent background catch
  if (import.meta.env.DEV) {
    console.debug("[AI Ingestion Status Check]", err);
  }
}
