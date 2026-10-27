import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe,
  History,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  User,
  X,
  Send,
  Bell,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { shortDate } from "../../lib/format";
import { useLanguage } from "../../lib/i18n";
import type {
  AdminTelegramBotStatus,
  AdminUser,
  ErrorLog,
  SecurityAuditLog,
  SecuritySettings,
  SystemDiagnostics,
} from "../../lib/types";

export { AdminAnnouncements } from "./AdminAnnouncements";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "AD";
}

function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 4; i < 14; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-700" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (score <= 4) return { score: 2, label: "Medium", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return "Just started";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getActionBadge(action: string) {
  if (action.includes("PASSWORD")) {
    return {
      bg: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
      icon: <KeyRound size={12} className="text-amber-600 dark:text-amber-400" />,
    };
  }
  if (action.includes("SECURITY")) {
    return {
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60",
      icon: <Lock size={12} className="text-indigo-600 dark:text-indigo-400" />,
    };
  }
  if (action.includes("SUPER_ADMIN")) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
      icon: <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />,
    };
  }
  if (action.includes("PURGED") || action.includes("DELETE")) {
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
      icon: <Trash2 size={12} className="text-rose-600 dark:text-rose-400" />,
    };
  }
  return {
    bg: "bg-slate-50 text-slate-700 border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    icon: <Activity size={12} className="text-slate-600 dark:text-slate-400" />,
  };
}

export function AdminSystemSettings({
  defaultTab = "profile",
}: {
  defaultTab?: "profile" | "security" | "admins" | "audit" | "logs" | "telegram";
}) {
  const { t } = useLanguage();
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "admins" | "audit" | "logs" | "telegram">(
    defaultTab
  );

  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Secure Password Change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Security Policies state
  const [newIpInput, setNewIpInput] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Super Admins state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminName, setAddAdminName] = useState("");
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminPass, setAddAdminPass] = useState("");
  const [showAddAdminPass, setShowAddAdminPass] = useState(false);
  const [resetAdminTarget, setResetAdminTarget] = useState<AdminUser | null>(null);
  const [adminResetPass, setAdminResetPass] = useState("");
  const [showAdminResetPass, setShowAdminResetPass] = useState(true);
  const [copiedResetPass, setCopiedResetPass] = useState(false);

  // Audit Logs filter state
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // 1. Diagnostics Query (refreshed every 15s)
  const diagnosticsQuery = useQuery({
    queryKey: ["admin-system-diagnostics"],
    queryFn: () => api.get<SystemDiagnostics>("/admin/system-diagnostics"),
    refetchInterval: 15000,
  });

  // 2. Security Settings Query & Mutation
  const securityQuery = useQuery({
    queryKey: ["admin-security-settings"],
    queryFn: () => api.get<SecuritySettings>("/admin/security-settings"),
  });

  const [secForm, setSecForm] = useState<SecuritySettings>({
    session_timeout_minutes: 120,
    enforce_2fa: false,
    max_login_attempts: 5,
    password_min_length: 8,
    require_special_char: true,
    require_number: true,
    require_uppercase: true,
    ip_allowlist: [],
    allow_admin_registration: false,
    auto_backup_enabled: true,
    ssl_enforced: true,
  });

  useEffect(() => {
    if (securityQuery.data) {
      setSecForm(securityQuery.data);
    }
  }, [securityQuery.data]);

  const updateSecurityMutation = useMutation({
    mutationFn: (data: SecuritySettings) => api.put<SecuritySettings>("/admin/security-settings", data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["admin-security-settings"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      setSecForm(saved);
      setSecuritySuccess("Security policies saved and applied platform-wide!");
      setSecurityError(null);
      setTimeout(() => setSecuritySuccess(null), 4000);
    },
    onError: (err: any) => {
      setSecurityError(err.message || "Failed to update security settings");
      setSecuritySuccess(null);
    },
  });

  // 3. Audit Logs Query
  const auditLogsQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => api.get<SecurityAuditLog[]>("/admin/audit-logs"),
  });

  // 4. Error Logs Query & Clear
  const logsQuery = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => api.get<ErrorLog[]>("/admin/logs"),
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => api.del("/admin/logs"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-system-diagnostics"] });
    },
  });

  // 5. Super Admins Query
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUser[]>("/admin/users"),
  });
  const superAdmins = usersQuery.data?.filter((u) => u.role === "super_admin") ?? [];

  // Create Super Admin mutation
  const createSuperAdminMutation = useMutation({
    mutationFn: (data: { full_name: string; email: string; password: string }) =>
      api.post("/admin/users", {
        ...data,
        role: "super_admin",
        shop_id: null,
        commission_rate: 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      setShowAddAdminModal(false);
      setAddAdminName("");
      setAddAdminEmail("");
      setAddAdminPass("");
      alert("New Super Admin account created successfully!");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create super admin");
    },
  });

  // Reset Super Admin password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      api.post(`/admin/users/${userId}/reset-password`, { new_password: password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      alert("Admin password reset successfully!");
      setResetAdminTarget(null);
      setAdminResetPass("");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to reset password");
    },
  });

  // 6. Super Admin Telegram Bot Query & Mutations (@chhlatAI_bot)
  const adminTelegramBotQuery = useQuery({
    queryKey: ["admin-telegram-bot-status"],
    queryFn: () => api.get<AdminTelegramBotStatus>("/admin/telegram-bot/status"),
  });

  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);
  const [testAlertError, setTestAlertError] = useState<string | null>(null);
  const [newChatIdInput, setNewChatIdInput] = useState("");

  const updateAdminBotConfigMutation = useMutation({
    mutationFn: (cfg: Partial<AdminTelegramBotStatus>) =>
      api.post<AdminTelegramBotStatus>("/admin/telegram-bot/config", cfg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-bot-status"] });
    },
  });

  const setupWebhookMutation = useMutation({
    mutationFn: () => api.post("/admin/telegram-bot/setup-webhook", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-bot-status"] });
      setTestAlertSuccess("Webhook registered successfully with Telegram API!");
      setTestAlertError(null);
      setTimeout(() => setTestAlertSuccess(null), 4000);
    },
    onError: (err: any) => {
      setTestAlertError(err.message || "Failed to register webhook");
      setTestAlertSuccess(null);
    },
  });

  const sendTestAlertMutation = useMutation({
    mutationFn: (kind: string) => api.post("/admin/telegram-bot/send-test", { kind }),
    onSuccess: () => {
      setTestAlertSuccess("Test alert dispatched to Telegram successfully!");
      setTestAlertError(null);
      setTimeout(() => setTestAlertSuccess(null), 4000);
    },
    onError: (err: any) => {
      setTestAlertError(
        err.message || "Failed to send test alert. Make sure you sent /start to @chhlatAI_bot first."
      );
      setTestAlertSuccess(null);
    },
  });

  // Handle Save Admin Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!fullName.trim()) {
      setProfileError("Full Name cannot be empty.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setProfileError("Please enter a valid Gmail / email address.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.patch("/auth/me", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      });
      await refresh();
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      setProfileSuccess(t("system.profileUpdated", "Admin profile updated successfully!"));
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update admin profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Update Admin Password with Current Password Verification
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (!currentPassword) {
      setPassError("Security verification required: Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPassError("Please provide a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPassError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match. Please verify.");
      return;
    }

    setIsSavingPass(true);
    try {
      await api.patch("/auth/me", {
        current_password: currentPassword,
        password: newPassword,
      });
      setPassSuccess(t("system.passwordUpdated", "Admin password updated successfully! Please keep it secure."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      setTimeout(() => setPassSuccess(null), 4000);
    } catch (err: any) {
      setPassError(err.message || "Failed to update admin password.");
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPass(true);
    setShowConfirmPass(true);
    navigator.clipboard.writeText(generated);
    setPassCopied(true);
    setTimeout(() => setPassCopied(false), 2500);
  };

  const strength = getPasswordStrength(newPassword);

  const handleAddIp = () => {
    const clean = newIpInput.trim();
    if (!clean) return;
    if (secForm.ip_allowlist.includes(clean)) {
      setNewIpInput("");
      return;
    }
    setSecForm((prev) => ({
      ...prev,
      ip_allowlist: [...prev.ip_allowlist, clean],
    }));
    setNewIpInput("");
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setSecForm((prev) => ({
      ...prev,
      ip_allowlist: prev.ip_allowlist.filter((ip) => ip !== ipToRemove),
    }));
  };

  const filteredAuditLogs = (auditLogsQuery.data || []).filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actor_email.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(q))
    );
  });

  const diagnostics = diagnosticsQuery.data;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 sm:px-8 sm:py-7 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
              {t("system.headerTitle", "System Settings & Admin Control")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60 shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real Database Telemetry
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Enterprise security policies, administrator credentials, access audit logs, and cluster diagnostics
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <User size={14} />
            <span>Profile & Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "security"
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Lock size={14} />
            <span>Security Controls</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "admins"
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Super Admins</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "admins"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {superAdmins.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <History size={14} />
            <span>Audit Trail</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "audit"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {auditLogsQuery.data?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "logs"
                ? "bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Activity size={14} />
            <span>Health & Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
              activeTab === "telegram"
                ? "bg-slate-900 text-white shadow-xs dark:bg-sky-600 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Send size={14} className="text-sky-500" />
            <span>Telegram Assistant</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "telegram"
                  ? "bg-white/20 text-white"
                  : "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
              }`}
            >
              @chhlatAI_bot
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: Admin Profile & Credentials Controller ── */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Admin Profile Information (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-[15px] font-bold text-white shadow-md shadow-indigo-600/20">
                  {getInitials(user?.full_name || fullName || "AD")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                      {t("system.adminProfile", "Admin Profile Information")}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Root
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                    Update your platform super admin full name and authentication Gmail
                  </p>
                </div>
              </div>
            </div>

            {/* Notification alerts */}
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-[12px] text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-[12px] text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300">
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative mt-1.5">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mao Seavik"
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    Admin Gmail / Email Address
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedEmail ? "Copied" : "Copy email"}</span>
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@omnichat.kh"
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  This Gmail/email is used to authenticate with root privileges.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-[12px] text-indigo-950 space-y-1.5 dark:border-indigo-950/60 dark:bg-indigo-950/20 dark:text-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                    <ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Role & Privileges</span>
                  </div>
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                  Full administrative permissions: Shop provisioning, billing invoices, global AI models, security policies, and cluster diagnostics.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-indigo-600/80 dark:text-indigo-400 font-mono">
                  <span>Account ID: #{user?.id || 1}</span>
                  <span>Session: Authenticated</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer w-full sm:w-auto dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  {isSavingProfile ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{isSavingProfile ? "Saving Profile…" : "Save Profile Information"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Secure Password Controller (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    {t("system.passwordControl", "Admin Password Controller")}
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                    Requires verification of your current password for heightened security
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-[11.5px] font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
                title="Generate strong 14-character password and copy to clipboard"
              >
                <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{passCopied ? "Copied!" : "Generate Strong"}</span>
              </button>
            </div>

            {/* Notification alerts */}
            {passSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-[12px] text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-[12px] text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300">
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* CURRENT PASSWORD (Security Verification) */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Current Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your existing password to verify"
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-10 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Required to prevent unauthorized credential alterations.
                </p>
              </div>

              {/* NEW PASSWORD */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  {t("system.newPass", "New Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters (uppercase, digit, symbol)"
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-10 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  {t("system.confirmPass", "Confirm New Password")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-10 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Strength indicator */}
              {newPassword && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Password Strength:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className={newPassword.length >= 8 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-300 dark:text-slate-600"}>
                        {newPassword.length >= 8 ? "✓" : "○"}
                      </span>
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={/[A-Z]/.test(newPassword) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-300 dark:text-slate-600"}>
                        {/[A-Z]/.test(newPassword) ? "✓" : "○"}
                      </span>
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={/[0-9]/.test(newPassword) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-300 dark:text-slate-600"}>
                        {/[0-9]/.test(newPassword) ? "✓" : "○"}
                      </span>
                      <span>Number included</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-300 dark:text-slate-600"}>
                        {/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}
                      </span>
                      <span>Special symbol</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPass || !newPassword}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-amber-600/20 hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer w-full sm:w-auto dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                  {isSavingPass ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
                  <span>{isSavingPass ? "Verifying & Updating…" : "Update Admin Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: Security Controls & Policies ── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Security Policies & Access Controls</h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60">
                  Database Persistent
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                Configure authentication rules, session lifecycles, and IP restrictions stored in PostgreSQL
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateSecurityMutation.mutate(secForm)}
              disabled={updateSecurityMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {updateSecurityMutation.isPending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>{updateSecurityMutation.isPending ? "Saving Policies…" : "Save Security Policies"}</span>
            </button>
          </div>

          {securitySuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-[12px] text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{securitySuccess}</span>
            </div>
          )}
          {securityError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-[12px] text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card 1: Session & Authentication Rules */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Session & Login Governance</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure session timeout and rate limiting</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    Session Timeout Duration
                  </label>
                  <select
                    value={secForm.session_timeout_minutes}
                    onChange={(e) =>
                      setSecForm({ ...secForm, session_timeout_minutes: parseInt(e.target.value) })
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-[13px] text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value={15}>15 Minutes (Strict Banking Standard)</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours (Default)</option>
                    <option value={480}>8 Hours (Full Shift)</option>
                    <option value={1440}>24 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    Max Login Attempts Before Lockout
                  </label>
                  <select
                    value={secForm.max_login_attempts}
                    onChange={(e) =>
                      setSecForm({ ...secForm, max_login_attempts: parseInt(e.target.value) })
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-[13px] text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value={3}>3 Failed Attempts</option>
                    <option value={5}>5 Failed Attempts (Default)</option>
                    <option value={10}>10 Failed Attempts</option>
                  </select>
                </div>

                <div className="pt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">
                        Enforce 2-Factor Authentication (2FA)
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Require TOTP authentication for all administrative accounts
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecForm({ ...secForm, enforce_2fa: !secForm.enforce_2fa })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        secForm.enforce_2fa ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          secForm.enforce_2fa ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">
                        Block Public Super Admin Registrations
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Super admins can only be invited directly by existing root accounts
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSecForm({
                          ...secForm,
                          allow_admin_registration: !secForm.allow_admin_registration,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        !secForm.allow_admin_registration ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          !secForm.allow_admin_registration ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Password Complexity & Infrastructure */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Password Policy & Encryption</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Enforce enterprise password complexity standards</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    Minimum Password Length
                  </label>
                  <select
                    value={secForm.password_min_length}
                    onChange={(e) =>
                      setSecForm({ ...secForm, password_min_length: parseInt(e.target.value) })
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-[13px] text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value={8}>8 Characters Minimum</option>
                    <option value={10}>10 Characters Minimum</option>
                    <option value={12}>12 Characters (Recommended)</option>
                    <option value={16}>16 Characters (High Security)</option>
                  </select>
                </div>

                <div className="pt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                      Require Uppercase & Lowercase letters
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSecForm({ ...secForm, require_uppercase: !secForm.require_uppercase })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        secForm.require_uppercase ? "bg-amber-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          secForm.require_uppercase ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                      Require at least 1 Numeric Digit (0-9)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSecForm({ ...secForm, require_number: !secForm.require_number })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        secForm.require_number ? "bg-amber-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          secForm.require_number ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                      Require Special Character (!@#$%^&*)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSecForm({ ...secForm, require_special_char: !secForm.require_special_char })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        secForm.require_special_char ? "bg-amber-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          secForm.require_special_char ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                        Automated Daily Database Snapshots
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Continuous PostgreSQL WAL archiving & daily backup retention
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSecForm({ ...secForm, auto_backup_enabled: !secForm.auto_backup_enabled })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        secForm.auto_backup_enabled ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                          secForm.auto_backup_enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: IP Allowlisting (Full Width) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Administrator IP Allowlist Restrictions
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Restrict administrative dashboard access to trusted office IPs or VPN gateways. Leave empty to allow all IP addresses.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={newIpInput}
                  onChange={(e) => setNewIpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIp();
                    }
                  }}
                  placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddIp}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-slate-800 transition cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <Plus size={14} />
                  <span>Add IP Address</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {secForm.ip_allowlist.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-3 text-[12px] text-slate-400 w-full text-center dark:border-slate-700 dark:text-slate-500">
                    No IP restrictions active. Administrative endpoints accessible from all authorized networks.
                  </div>
                ) : (
                  secForm.ip_allowlist.map((ip) => (
                    <span
                      key={ip}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 font-mono text-[12px] font-semibold text-slate-800 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    >
                      <span>{ip}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIp(ip)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 dark:text-slate-500 dark:hover:text-rose-400"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Super Admin Accounts ── */}
      {activeTab === "admins" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  {t("system.tabAdmins", "Super Admin Accounts")}
                </h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60">
                  {superAdmins.length} Super Admins
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                Accounts with root administrative control over Chhlat AI
              </p>
            </div>

            <button
              onClick={() => {
                setAddAdminPass(generateStrongPassword());
                setShowAddAdminModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              <Plus size={15} />
              <span>Add Super Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC]/90 border-y border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-6">Super Admin</th>
                  <th className="py-3.5 px-6">Gmail / Email</th>
                  <th className="py-3.5 px-6">Access Level</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {superAdmins.map((adm) => {
                  const isCurrent = adm.id === user?.id;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/50 transition dark:hover:bg-slate-800/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-[12px] font-bold text-white shadow-xs">
                            {getInitials(adm.full_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>{adm.full_name}</span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: #{adm.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[12px] text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{adm.email}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(adm.email);
                              alert(`Copied ${adm.email} to clipboard!`);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                            title="Copy email"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60">
                          <ShieldCheck size={12} />
                          Root Super Admin
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                            adm.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                              : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              adm.is_active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {adm.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[12px]">
                        {adm.created_at ? shortDate(adm.created_at) : "System"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setResetAdminTarget(adm);
                            const gen = generateStrongPassword();
                            setAdminResetPass(gen);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-[11.5px] font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 cursor-pointer"
                          title="Reset password for this admin"
                        >
                          <KeyRound size={13} className="text-amber-600 dark:text-amber-400" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Security Audit Trail ── */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Security Audit Trail</h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                  Real Database Records
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                Immutable historical record of sensitive admin events, password updates, and policy revisions
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter by action or email…"
                  className="h-9 w-56 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-[12px] text-slate-900 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800 dark:placeholder-slate-500"
                />
              </div>

              <button
                type="button"
                onClick={() => auditLogsQuery.refetch()}
                disabled={auditLogsQuery.isFetching}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw size={13} className={auditLogsQuery.isFetching ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-[#F8FAFC]/90 border-y border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Event Action</th>
                  <th className="py-3 px-5">Actor</th>
                  <th className="py-3 px-5">Details</th>
                  <th className="py-3 px-5">IP / Source</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <History size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No security audit events found</p>
                      <p className="text-[11px]">All administrative activities are recorded in real-time.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-5 font-mono text-[11.5px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {shortDate(log.created_at)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-medium text-slate-900 dark:text-white">{log.actor_email}</div>
                          {log.actor_id && (
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">ID #{log.actor_id}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 max-w-[360px]">
                          <span className="line-clamp-2">{log.details}</span>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div>{log.ip_address || "127.0.0.1"}</div>
                          {log.user_agent && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]" title={log.user_agent}>
                              {log.user_agent}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                            <Check size={11} />
                            Success
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: System Health & Diagnostics ── */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Real Diagnostics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Database Health */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">PostgreSQL Database</span>
                <Database size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-bold font-mono text-slate-900 dark:text-white">
                  {diagnostics?.database.latency_ms ?? 0} ms
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Ping latency</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Tables: {diagnostics?.database.total_tables ?? 23}</span>
                <span>Active Conns: {diagnostics?.database.active_connections ?? 1}</span>
              </div>
            </div>

            {/* 2. Redis & PubSub */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Cache & Realtime Hub</span>
                <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-white capitalize">
                  {diagnostics?.redis.status ?? "in-memory"}
                </span>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate" title={diagnostics?.redis.url}>
                {diagnostics?.redis.url ?? "In-process memory"}
              </div>
            </div>

            {/* 3. Server Uptime */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Server Uptime</span>
                <Server size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-white">
                  {formatUptime(diagnostics?.server.uptime_seconds ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Py: {diagnostics?.server.python_version ?? "3.14"}</span>
                <span>v{diagnostics?.server.app_version ?? "1.1.0"}</span>
              </div>
            </div>

            {/* 4. Platform Data Metrics */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Database Records</span>
                <Globe size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-bold font-mono text-slate-900 dark:text-white">
                  {diagnostics?.metrics.total_shops ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Shops registered</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Users: {diagnostics?.metrics.total_users ?? 0}</span>
                <span>Orders: {diagnostics?.metrics.total_orders ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Error Logs Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
                {t("system.tabLogs", "System Logs & Diagnostics")}
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                Live application error logs and exception records from cluster runtime
              </p>
            </div>

            <button
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 size={14} />
              <span>
                {clearLogsMutation.isPending ? "Clearing…" : t("system.clearLogs", "Clear Error Logs")}
              </span>
            </button>
          </div>

          {/* Logs viewer */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 font-mono text-[12px] text-slate-700 dark:text-slate-300">
                <Terminal size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold">cluster-diagnostics.log</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {logsQuery.data?.length ?? 0} events recorded
              </span>
            </div>

            <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[12px]">
              {logsQuery.data?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="font-sans font-medium text-slate-700 dark:text-slate-300">All systems operating nominally.</p>
                  <p className="text-[11px]">Zero webhook or runtime exceptions in the last 24 hours.</p>
                </div>
              ) : (
                logsQuery.data?.map((log) => (
                  <div key={log.id} className="py-3 flex items-start gap-3">
                    <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-100 uppercase dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
                      {log.level}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap">
                      {shortDate(log.created_at)}
                    </span>
                    <div className="flex-1 text-slate-800 dark:text-slate-200">
                      <p className="font-semibold">
                        {log.source}: {log.message}
                      </p>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <pre className="mt-1 rounded bg-slate-50 p-2 text-[11px] text-slate-600 overflow-x-auto border border-slate-100 dark:bg-slate-950/60 dark:text-slate-300 dark:border-slate-800">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: Super Admin Telegram Assistant (@chhlatAI_bot) ── */}
      {activeTab === "telegram" && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-7 text-white shadow-lg">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-sky-100 border border-white/20">
                  <Send size={12} className="text-white" />
                  <span>Platform Super Admin Bot</span>
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono">{adminTelegramBotQuery.data?.bot_username || "@chhlatAI_bot"}</span>
                </div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  Super Admin Telegram Control Bot
                </h2>
                <p className="text-[13px] leading-relaxed text-sky-100">
                  Stream real-time push alerts to your Telegram for <b>New User Registrations</b>, <b>Security Audit Trail</b>, and <b>Health & Diagnostics</b>. Query cluster telemetry and platform KPIs directly from your phone.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://t.me/${(adminTelegramBotQuery.data?.bot_username || "chhlatAI_bot").replace("@", "")}?start=admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-sky-700 shadow-md hover:bg-sky-50 transition cursor-pointer"
                >
                  <Send size={15} className="text-sky-600" />
                  <span>Open @chhlatAI_bot</span>
                </a>

                <button
                  type="button"
                  onClick={() => setupWebhookMutation.mutate()}
                  disabled={setupWebhookMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md px-4 py-2.5 text-[13px] font-bold text-white hover:bg-white/20 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={setupWebhookMutation.isPending ? "animate-spin" : ""} />
                  <span>Sync Webhook</span>
                </button>
              </div>
            </div>

            {/* Background Decorative Blob */}
            <div className="absolute -right-10 -bottom-10 size-64 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
          </div>

          {/* Feedback messages */}
          {testAlertSuccess && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-[13px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-300">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{testAlertSuccess}</span>
            </div>
          )}

          {testAlertError && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-[13px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-300">
              <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{testAlertError}</span>
            </div>
          )}

          {/* 3-Column Status & Test Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* 1. Connection & Webhook */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Bot Runtime
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div>
                <div className="text-[16px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{adminTelegramBotQuery.data?.bot_username || "@chhlatAI_bot"}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Configured in <code className="text-indigo-600 dark:text-indigo-400 font-mono">backend/.env</code>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Registered Webhook URL:</div>
                <div className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg truncate" title={adminTelegramBotQuery.data?.webhook_url}>
                  {adminTelegramBotQuery.data?.webhook_url || "/api/v1/webhooks/telegram/admin-bot"}
                </div>
              </div>
            </div>

            {/* 2. Linked Admin Chats */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Subscribed Admin Chats
                </span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  {adminTelegramBotQuery.data?.chat_ids?.length || 0} linked
                </span>
              </div>

              <div className="space-y-2">
                {(!adminTelegramBotQuery.data?.chat_ids || adminTelegramBotQuery.data.chat_ids.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-[12px] text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
                    <p className="font-bold">No Telegram chats linked yet!</p>
                    <p className="text-[11px]">
                      Open <b>@chhlatAI_bot</b> on Telegram and click <b>Start</b> (or send <code className="font-mono">/start</code>) to link your account.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {adminTelegramBotQuery.data.chat_ids.map((cid) => (
                      <div
                        key={cid}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5 text-[11.5px] font-mono text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                      >
                        <span>Chat ID: {cid}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const remaining = (adminTelegramBotQuery.data?.chat_ids || []).filter((c) => c !== cid);
                            updateAdminBotConfigMutation.mutate({ chat_ids: remaining });
                          }}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                        >
                          Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add chat ID manually */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter Chat ID (e.g. 12345678)"
                  value={newChatIdInput}
                  onChange={(e) => setNewChatIdInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11.5px] font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newChatIdInput.trim()) {
                      const updated = Array.from(new Set([...(adminTelegramBotQuery.data?.chat_ids || []), newChatIdInput.trim()]));
                      updateAdminBotConfigMutation.mutate({ chat_ids: updated });
                      setNewChatIdInput("");
                    }
                  }}
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700 transition cursor-pointer"
                >
                  Link
                </button>
              </div>
            </div>

            {/* 3. Live Test Dispatcher */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Instant Test Alerts
              </span>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400">
                Verify Telegram push notifications arrive on your phone in real-time:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => sendTestAlertMutation.mutate("new_user")}
                  disabled={sendTestAlertMutation.isPending}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>🎉</span>
                    <span>Test New User Alert</span>
                  </span>
                  <span className="text-[10.5px] text-sky-600 font-mono">Send &rsaquo;</span>
                </button>

                <button
                  type="button"
                  onClick={() => sendTestAlertMutation.mutate("audit")}
                  disabled={sendTestAlertMutation.isPending}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Test Audit Trail Alert</span>
                  </span>
                  <span className="text-[10.5px] text-indigo-600 font-mono">Send &rsaquo;</span>
                </button>

                <button
                  type="button"
                  onClick={() => sendTestAlertMutation.mutate("health")}
                  disabled={sendTestAlertMutation.isPending}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>🩺</span>
                    <span>Test Health Ping Alert</span>
                  </span>
                  <span className="text-[10.5px] text-emerald-600 font-mono">Send &rsaquo;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Alert Channels & Automation Preferences */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={17} className="text-sky-600 dark:text-sky-400" />
              <span>Automated Alert Rules</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 p-4 cursor-pointer hover:bg-slate-50/60 transition dark:border-slate-800 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={adminTelegramBotQuery.data?.notify_new_users ?? true}
                  onChange={(e) =>
                    updateAdminBotConfigMutation.mutate({ notify_new_users: e.target.checked })
                  }
                  className="mt-0.5 size-4 rounded text-sky-600 cursor-pointer"
                />
                <div>
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                    New User Registrations
                  </div>
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                    Sends push alert with user full name, email, shop slug, plan tier, and IP.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 p-4 cursor-pointer hover:bg-slate-50/60 transition dark:border-slate-800 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={adminTelegramBotQuery.data?.notify_audit_trail ?? true}
                  onChange={(e) =>
                    updateAdminBotConfigMutation.mutate({ notify_audit_trail: e.target.checked })
                  }
                  className="mt-0.5 size-4 rounded text-sky-600 cursor-pointer"
                />
                <div>
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                    Security & Audit Trail
                  </div>
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                    Alerts on subscription tier grants, password resets, role updates, and policy changes.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 p-4 cursor-pointer hover:bg-slate-50/60 transition dark:border-slate-800 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={adminTelegramBotQuery.data?.notify_health_alerts ?? true}
                  onChange={(e) =>
                    updateAdminBotConfigMutation.mutate({ notify_health_alerts: e.target.checked })
                  }
                  className="mt-0.5 size-4 rounded text-sky-600 cursor-pointer"
                />
                <div>
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                    Health & Diagnostics
                  </div>
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                    Alerts if database connection drops, Redis status degrades, or exceptions spike.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Interactive Commands Reference */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal size={17} className="text-indigo-600 dark:text-indigo-400" />
              <span>Supported Telegram Commands (Type directly in @chhlatAI_bot)</span>
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  cmd: "/health",
                  desc: "PostgreSQL DB latency, active connections, Redis status, uptime",
                  badge: "Diagnostics",
                },
                {
                  cmd: "/stats",
                  desc: "Platform summary: total shops, users, orders, revenue, error logs",
                  badge: "Overview",
                },
                {
                  cmd: "/users",
                  desc: "Lists the latest 5 registered users, emails, shop slugs, and plans",
                  badge: "User Control",
                },
                {
                  cmd: "/audit",
                  desc: "Streams recent security audit trail logs with actors and timestamps",
                  badge: "Audit Trail",
                },
                {
                  cmd: "/shops",
                  desc: "Overview of registered shops, active statuses, categories, and phones",
                  badge: "Merchant Overview",
                },
                {
                  cmd: "/start",
                  desc: "Links your Telegram account as an authorized Super Admin recipient",
                  badge: "Setup",
                },
              ].map((item) => (
                <div
                  key={item.cmd}
                  className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-[14px] font-bold font-mono text-sky-600 dark:text-sky-400">
                      {item.cmd}
                    </code>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Create New Super Admin ── */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-[500px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Add Super Admin</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Create a new platform administrator</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={addAdminName}
                  onChange={(e) => setAddAdminName(e.target.value)}
                  placeholder="e.g. Sok Sovann"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Admin Gmail / Email *</label>
                <input
                  type="email"
                  value={addAdminEmail}
                  onChange={(e) => setAddAdminEmail(e.target.value)}
                  placeholder="admin.sovann@chhlatai.com"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateStrongPassword();
                      setAddAdminPass(gen);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Generate Strong
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type={showAddAdminPass ? "text" : "password"}
                    value={addAdminPass}
                    onChange={(e) => setAddAdminPass(e.target.value)}
                    placeholder="Set secure password"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddAdminPass(!showAddAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showAddAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createSuperAdminMutation.mutate({
                    full_name: addAdminName,
                    email: addAdminEmail,
                    password: addAdminPass,
                  })
                }
                disabled={
                  createSuperAdminMutation.isPending || !addAdminName || !addAdminEmail || !addAdminPass
                }
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {createSuperAdminMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                <span>Create Super Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Reset Super Admin Password ── */}
      {resetAdminTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Reset Admin Password</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[280px]">
                    {resetAdminTarget.full_name} ({resetAdminTarget.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetAdminTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateStrongPassword();
                      setAdminResetPass(gen);
                    }}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    <Sparkles size={12} />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type={showAdminResetPass ? "text" : "password"}
                    value={adminResetPass}
                    onChange={(e) => setAdminResetPass(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-20 text-[13px] font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(adminResetPass);
                        setCopiedResetPass(true);
                        setTimeout(() => setCopiedResetPass(false), 2000);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                      title="Copy password"
                    >
                      {copiedResetPass ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdminResetPass(!showAdminResetPass)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showAdminResetPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setResetAdminTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  resetPasswordMutation.mutate({
                    userId: resetAdminTarget.id,
                    password: adminResetPass,
                  })
                }
                disabled={resetPasswordMutation.isPending || !adminResetPass}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {resetPasswordMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                <span>Confirm Reset Password</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep export alias for backwards compatibility
export const AdminErrorLogs = AdminSystemSettings;
