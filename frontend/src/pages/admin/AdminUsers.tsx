import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  Bot,
  Check,
  Clock,
  Copy,
  Crown,
  Edit2,
  Eye,
  EyeOff,
  Gem,
  Gift,
  KeyRound,
  Mail,
  MessageSquareQuote,
  Percent,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useLanguage } from "../../lib/i18n";
import type { AdminShop, AdminUser, Plan, Role, ShopStatus } from "../../lib/types";

const AVATAR_COLORS = [
  "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
  "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
  "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60",
  "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
  "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60",
  "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "US";
}

function generateRandomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function getPlanMeta(plan: Plan) {
  const code = (plan.code || "").toLowerCase();
  const name = (plan.name || "").toLowerCase();

  if (code.includes("unlimited") || name.includes("unlimited") || code.includes("premium")) {
    return {
      Icon: Crown,
      badgeClass: "bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500",
      pillClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      tagLabel: "VIP Tier",
    };
  }
  if (code.includes("enterprise") || name.includes("enterprise") || code.includes("custom")) {
    return {
      Icon: Gem,
      badgeClass: "bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400",
      accentBg: "bg-purple-500",
      pillClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      tagLabel: "Scale",
    };
  }
  if (code.includes("pro") || name.includes("pro") || code.includes("growth")) {
    return {
      Icon: Sparkles,
      badgeClass: "bg-indigo-100 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400",
      accentBg: "bg-indigo-500",
      pillClass: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      tagLabel: "Popular",
    };
  }
  return {
    Icon: Zap,
    badgeClass: "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
    accentBg: "bg-emerald-500",
    pillClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    tagLabel: "Starter",
  };
}

export function AdminUsers() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<"all" | Role | "disabled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<AdminUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [tierUser, setTierUser] = useState<AdminUser | null>(null);

  // Form states: Grant Subscription Tier
  const [selectedPlanId, setSelectedPlanId] = useState<number | 0>(0);
  const [selectedTierStatus, setSelectedTierStatus] = useState<ShopStatus>("active");
  const [tierNotes, setTierNotes] = useState("");

  // Form states: Add User
  const [addFullName, setAddFullName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<Role>("staff");
  const [addShopId, setAddShopId] = useState<number | 0>(0);
  const [addCommission, setAddCommission] = useState<number>(0);
  const [showAddPass, setShowAddPass] = useState(false);

  // Form states: Edit User
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("staff");
  const [editShopId, setEditShopId] = useState<number | 0>(0);
  const [editPlanId, setEditPlanId] = useState<number | 0>(0);
  const [editShopStatus, setEditShopStatus] = useState<ShopStatus>("active");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCommission, setEditCommission] = useState<number>(0);

  // Form states: Reset Password
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(true);
  const [copiedPass, setCopiedPass] = useState(false);

  // Fetch users list
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUser[]>("/admin/users"),
  });

  // Fetch shops for dropdown assignment
  const shopsQuery = useQuery({
    queryKey: ["admin-shops-dropdown"],
    queryFn: () => api.get<AdminShop[]>("/admin/shops"),
  });

  // Fetch subscription plans
  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.get<Plan[]>("/admin/plans"),
  });

  // Mutations
  const grantTierMutation = useMutation({
    mutationFn: ({ userId, planId, status, notes }: { userId: number; planId: number; status: ShopStatus; notes?: string }) =>
      api.post(`/admin/users/${userId}/grant-subscription`, { plan_id: planId, status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setTierUser(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to grant subscription tier");
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: {
      full_name: string;
      email: string;
      password: string;
      role: Role;
      shop_id: number | null;
      commission_rate: number;
    }) => api.post("/admin/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowAddModal(false);
      resetAddForm();
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUser> }) =>
      api.patch(`/admin/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setEditUser(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update user");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, new_password }: { id: number; new_password: string }) =>
      api.post(`/admin/users/${id}/reset-password`, { new_password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      alert("Password has been reset successfully!");
      setResetPassUser(null);
      setNewPassword("");
      setCopiedPass(false);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to reset password");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setDeleteUserTarget(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete user");
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to toggle status");
    },
  });

  const resetAddForm = () => {
    setAddFullName("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("staff");
    setAddShopId(0);
    setAddCommission(0);
    setShowAddPass(false);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditShopId(user.shop_id || 0);
    setEditPlanId(user.plan_id || 0);
    setEditShopStatus((user.shop_status as ShopStatus) || "active");
    setEditIsActive(user.is_active);
    setEditCommission(user.commission_rate || 0);
  };

  const handleOpenResetPassword = (user: AdminUser) => {
    setResetPassUser(user);
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setShowNewPass(true);
    setCopiedPass(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    alert(`Copied email: ${email}`);
  };

  const users = usersQuery.data ?? [];
  const shops = shopsQuery.data ?? [];

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (roleFilter === "disabled" && u.is_active) return false;
    if (roleFilter !== "all" && roleFilter !== "disabled" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchShop = u.shop_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchShop) return false;
    }
    return true;
  });

  // KPI stats
  const totalUsers = users.length;
  const countOwners = users.filter((u) => u.role === "owner").length;
  const countStaff = users.filter((u) => u.role === "staff").length;
  const countAdmins = users.filter((u) => u.role === "super_admin").length;
  const countDisabled = users.filter((u) => !u.is_active).length;

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-6 sm:px-8 sm:py-7 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("users.title", "Users & Accounts management")}
            </h1>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {totalUsers} {t("users.all", "Users")}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {t("users.subtitle", "Control user information, Gmail credentials, passwords, roles, and shop associations")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const headers = "ID,Full Name,Email,Role,Shop,Status,Commission\n";
              const rows = users
                .map((u) => `"${u.id}","${u.full_name}","${u.email}","${u.role}","${u.shop_name || ""}","${u.is_active ? "Active" : "Disabled"}","${u.commission_rate}"`)
                .join("\n");
              const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `chhlat_users_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <Upload size={15} className="text-slate-400 dark:text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-user"
            onClick={() => {
              resetAddForm();
              setAddPassword(generateRandomPassword());
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/25 hover:shadow-md hover:shadow-indigo-600/35 transition-all active:scale-98 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>{t("users.addUser", "Add User")}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{totalUsers}</div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check size={12} /> {users.filter((u) => u.is_active).length} active accounts
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shop Owners</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Store size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{countOwners}</div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Merchant business owners</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff Members</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{countStaff}</div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Chat agents & operators</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Super Admins</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{countAdmins}</div>
          <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">Root platform authority</div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Role tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: t("users.all", "All Users"), count: totalUsers },
            { id: "owner", label: t("users.owners", "Shop Owners"), count: countOwners },
            { id: "staff", label: t("users.staff", "Staff"), count: countStaff },
            { id: "super_admin", label: t("users.admins", "Admins"), count: countAdmins },
            { id: "disabled", label: t("users.disabled", "Disabled"), count: countDisabled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition ${
                roleFilter === tab.id
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                  roleFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("users.searchPlaceholder", "Search by name, Gmail/email, or shop…")}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 py-1.5 pl-9 pr-3 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Users Table ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5 whitespace-nowrap">User & Gmail / Email</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Role</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Associated Shop</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Subscription Tier</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Commission</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap min-w-[190px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">{t("users.noUsers", "No users found matching your search.")}</p>
                    <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const initials = getInitials(u.full_name);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* User Info & Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`flex size-10 items-center justify-center rounded-xl font-bold text-[13px] border ${avatarColor}`}>
                              {initials}
                            </div>
                            {u.is_online && (
                              <span
                                title="Online now"
                                className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{u.full_name}</span>
                              {isCurrent && (
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <Mail size={12} className="text-slate-400 dark:text-slate-500" />
                              <span className="font-mono text-slate-600 dark:text-slate-300">{u.email}</span>
                              <button
                                onClick={() => handleCopyEmail(u.email)}
                                title="Copy email"
                                className="text-slate-300 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        {u.role === "super_admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                            <ShieldCheck size={12} /> Super Admin
                          </span>
                        )}
                        {u.role === "owner" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            <Store size={12} /> Shop Owner
                          </span>
                        )}
                        {u.role === "staff" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <UserCheck size={12} /> Staff
                          </span>
                        )}
                      </td>

                      {/* Shop Association */}
                      <td className="px-4 py-3.5">
                        {u.shop_name ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <Store size={13} className="text-slate-400 dark:text-slate-500" />
                            <span>{u.shop_name}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400 dark:text-slate-500 italic">Global / All Shops</span>
                        )}
                      </td>

                      {/* Subscription Tier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.role === "super_admin" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                            <ShieldCheck size={11} /> Root Platform
                          </span>
                        ) : u.plan_name ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setTierUser(u);
                                setSelectedPlanId(u.plan_id || plansQuery.data?.[1]?.id || plansQuery.data?.[0]?.id || 1);
                                setSelectedTierStatus((u.shop_status as ShopStatus) || "active");
                                setTierNotes("");
                              }}
                              title="Click to Grant or Upgrade Subscription Tier"
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-2xs hover:ring-2 hover:ring-purple-400/40 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                u.plan_code === "premium" || u.plan_name === "Unlimited"
                                  ? "bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60"
                                  : u.plan_name === "Enterprise"
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                                  : u.plan_name === "Pro"
                                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {u.plan_code === "premium" || u.plan_name === "Unlimited" ? (
                                <Crown size={11} className="text-amber-500 fill-amber-400" />
                              ) : u.plan_name === "Enterprise" ? (
                                <Sparkles size={11} className="text-indigo-500" />
                              ) : u.plan_name === "Pro" ? (
                                <Sparkles size={11} className="text-purple-500" />
                              ) : null}
                              <span>{u.plan_name}</span>
                            </button>
                            {u.shop_status && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded whitespace-nowrap ${
                                  u.shop_status === "active"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : u.shop_status === "trial"
                                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}
                              >
                                {u.shop_status === "active" ? "Active" : u.shop_status === "trial" ? "Trial" : "Suspended"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTierUser(u);
                              setSelectedPlanId(u.plan_id || plansQuery.data?.[1]?.id || plansQuery.data?.[0]?.id || 1);
                              setSelectedTierStatus((u.shop_status as ShopStatus) || "active");
                              setTierNotes("");
                            }}
                            title="Grant complimentary subscription tier"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200/90 dark:border-purple-800/80 bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs active:scale-95"
                          >
                            <Crown size={12} className="text-amber-500 fill-amber-400" />
                            <span>Grant Tier</span>
                          </button>
                        )}
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.role === "staff" ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">{u.commission_rate}%</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500" /> Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Grant Subscription Tier Button */}
                          {u.role !== "super_admin" && (
                            <button
                              id={`btn-grant-tier-${u.id}`}
                              onClick={() => {
                                setTierUser(u);
                                setSelectedPlanId(u.plan_id || plansQuery.data?.[1]?.id || plansQuery.data?.[0]?.id || 1);
                                setSelectedTierStatus((u.shop_status as ShopStatus) || "active");
                                setTierNotes("");
                              }}
                              title="Grant or Upgrade Subscription Tier (Admin Gift)"
                              className="flex size-8 items-center justify-center rounded-xl border border-purple-200/90 dark:border-purple-800/80 bg-purple-50/90 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 shadow-2xs hover:shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer active:scale-95 shrink-0"
                            >
                              <Crown size={14} className="text-amber-500 fill-amber-400" />
                            </button>
                          )}

                          {/* Reset Password Button */}
                          <button
                            id={`btn-reset-password-${u.id}`}
                            onClick={() => handleOpenResetPassword(u)}
                            title="Reset / Change Password"
                            className="flex size-8 items-center justify-center rounded-xl border border-amber-200/90 dark:border-amber-800/80 bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-700 dark:text-amber-300 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer active:scale-95 shrink-0"
                          >
                            <KeyRound size={14} className="text-amber-600 dark:text-amber-400" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            id={`btn-edit-user-${u.id}`}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Info"
                            className="flex size-8 items-center justify-center rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Toggle Active / Suspend */}
                          <button
                            id={`btn-toggle-status-${u.id}`}
                            onClick={() => toggleUserActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                            disabled={isCurrent}
                            title={isCurrent ? "Cannot disable your own account" : u.is_active ? "Disable Account" : "Activate Account"}
                            className={`flex size-8 items-center justify-center rounded-xl border transition-all shadow-2xs shrink-0 ${
                              isCurrent
                                ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600"
                                : u.is_active
                                ? "border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-700 cursor-pointer active:scale-95"
                                : "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer active:scale-95"
                            }`}
                          >
                            {u.is_active ? <Ban size={13} /> : <Check size={13} />}
                          </button>

                          {/* Delete Account */}
                          <button
                            id={`btn-delete-user-${u.id}`}
                            onClick={() => setDeleteUserTarget(u)}
                            disabled={isCurrent}
                            title={isCurrent ? "Cannot delete yourself" : "Delete Account"}
                            className={`flex size-8 items-center justify-center rounded-xl border transition-all shadow-2xs shrink-0 ${
                              isCurrent
                                ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600"
                                : "border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 cursor-pointer active:scale-95"
                            }`}
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

      {/* ── MODAL: Reset Password ── */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/20">
                  <KeyRound size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Reset User Password
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 dark:text-amber-300 uppercase">
                      <KeyRound size={11} /> Credentials
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign or generate a new secure password for this user
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target User Info Callout */}
            <div className="mt-4 rounded-xl border border-amber-100/80 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-amber-50/40 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm shadow-xs">
                  {getInitials(resetPassUser.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-slate-900 dark:text-slate-100 truncate">
                      {resetPassUser.full_name}
                    </span>
                    <span className="rounded-md bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">
                      {resetPassUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span>{resetPassUser.email}</span>
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 shrink-0">
                ID #{resetPassUser.id}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-amber-500" />
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generateRandomPassword());
                      setCopiedPass(false);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={12} /> Generate Secure
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyRound size={15} />
                  </span>
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-10 py-2.5 font-mono text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400"
                    placeholder="Enter min 6 characters…"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    title={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick Copy Box */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5">
                <div className="min-w-0 pr-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Credential preview:</span>
                  <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {newPassword || "(Empty)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  disabled={!newPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-700 px-3 py-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-650 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {copiedPass ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedPass ? "Copied!" : "Copy Password"}</span>
                </button>
              </div>

              {/* Security Warning Notice */}
              <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex items-start gap-2.5 text-[12px] text-amber-800 dark:text-amber-300">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  This password takes effect immediately. Remember to copy and share the new credentials with the user before closing.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPassword.length < 6) {
                    alert("Password must be at least 6 characters");
                    return;
                  }
                  resetPasswordMutation.mutate({
                    id: resetPassUser.id,
                    new_password: newPassword,
                  });
                }}
                disabled={resetPasswordMutation.isPending || !newPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <KeyRound size={15} />
                <span>{resetPasswordMutation.isPending ? "Updating Password…" : "Apply New Password"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add User ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <UserPlus size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Create New User Account
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-300 uppercase">
                      <Users size={11} /> Provisioning
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Register a new user account with credentials, role, and shop assignment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!addFullName.trim() || !addEmail.trim() || !addPassword.trim()) {
                  alert("Please fill in all required fields.");
                  return;
                }
                createUserMutation.mutate({
                  full_name: addFullName.trim(),
                  email: addEmail.trim(),
                  password: addPassword,
                  role: addRole,
                  shop_id: addShopId > 0 ? addShopId : null,
                  commission_rate: addRole === "staff" ? Number(addCommission) : 0,
                });
              }}
              className="mt-5 space-y-5"
            >
              {/* Section: Credentials */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-500" />
                  Account Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserCheck size={15} />
                      </span>
                      <input
                        type="text"
                        required
                        value={addFullName}
                        onChange={(e) => setAddFullName(e.target.value)}
                        placeholder="e.g. Sreypov Chan"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Gmail / Business Email *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        required
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        placeholder="e.g. chan.sreypov@gmail.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 font-mono text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password input row */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound size={13} className="text-indigo-500" />
                      Initial Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddPassword(generateRandomPassword())}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={11} /> Generate Secure
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound size={15} />
                    </span>
                    <input
                      type={showAddPass ? "text" : "password"}
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="Min 6 characters…"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-10 py-2.5 font-mono text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPass(!showAddPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    >
                      {showAddPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Role Selector (3 Interactive Cards) */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-indigo-500" />
                  User Role & Access Permissions *
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Staff Member */}
                  <button
                    type="button"
                    onClick={() => setAddRole("staff")}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      addRole === "staff"
                        ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                        <UserCheck size={15} />
                      </span>
                      {addRole === "staff" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Staff Member
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Operational store agent, chats & orders
                    </div>
                  </button>

                  {/* Shop Owner */}
                  <button
                    type="button"
                    onClick={() => setAddRole("owner")}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      addRole === "owner"
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                        <Store size={15} />
                      </span>
                      {addRole === "owner" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Shop Owner
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Full merchant authority over store
                    </div>
                  </button>

                  {/* Super Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      setAddRole("super_admin");
                      setAddShopId(0);
                    }}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      addRole === "super_admin"
                        ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                        <ShieldCheck size={15} />
                      </span>
                      {addRole === "super_admin" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Super Admin
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Unrestricted platform root authority
                    </div>
                  </button>
                </div>
              </div>

              {/* Section: Shop Assignment & Commission */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <Store size={12} className="text-indigo-500" />
                  Store Assignment & Operations
                </div>

                {addRole === "super_admin" ? (
                  <div className="rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-3 flex items-center gap-2.5 text-[12px] text-purple-900 dark:text-purple-300">
                    <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                    <span>
                      Super Admins possess root-level authority across all stores and system settings without requiring a shop assignment.
                    </span>
                  </div>
                ) : (
                  <div className={`grid ${addRole === "staff" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3.5`}>
                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Shop
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Store size={15} />
                        </span>
                        <select
                          value={addShopId}
                          onChange={(e) => setAddShopId(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        >
                          <option value={0}>None / Unassigned Store</option>
                          {shops.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {addRole === "staff" && (
                      <div>
                        <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Commission Rate (%)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Percent size={15} />
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={addCommission}
                            onChange={(e) => setAddCommission(Number(e.target.value))}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-8 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <UserPlus size={15} />
                  <span>{createUserMutation.isPending ? "Creating User…" : "Create User Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit User ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
                  <Edit2 size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Edit User Account
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      ID #{editUser.id}
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Modify user credentials, roles, store assignment, and access status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Overview Callout */}
            <div className="mt-4 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-indigo-50/40 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-indigo-950/20 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xs">
                  {getInitials(editUser.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-slate-900 dark:text-slate-100 truncate">
                      {editUser.full_name}
                    </span>
                    <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase">
                      {editUser.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono truncate">
                      <Mail size={11} className="text-slate-400 shrink-0" />
                      {editUser.email}
                    </span>
                    {editUser.shop_name && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Store size={11} className="text-slate-400 shrink-0" />
                          {editUser.shop_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 border ${
                  editIsActive
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                }`}
              >
                <span className={`size-1.5 rounded-full ${editIsActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                {editIsActive ? "Active" : "Disabled"}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUserMutation.mutate({
                  id: editUser.id,
                  data: {
                    full_name: editFullName.trim(),
                    email: editEmail.trim(),
                    role: editRole,
                    shop_id: editShopId > 0 ? editShopId : null,
                    plan_id: editPlanId > 0 ? editPlanId : undefined,
                    shop_status: editShopStatus,
                    is_active: editIsActive,
                    commission_rate: editRole === "staff" ? Number(editCommission) : 0,
                  },
                });
              }}
              className="mt-5 space-y-5"
            >
              {/* Section 1: Credentials */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-500" />
                  Account Identity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserCheck size={15} />
                      </span>
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Gmail / Business Email *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 font-mono text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Role Selection (3 Interactive Cards) */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-indigo-500" />
                  User Role & Access Permissions *
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Staff Member */}
                  <button
                    type="button"
                    onClick={() => setEditRole("staff")}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      editRole === "staff"
                        ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                        <UserCheck size={15} />
                      </span>
                      {editRole === "staff" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Staff Member
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Operational store agent, chats & orders
                    </div>
                  </button>

                  {/* Shop Owner */}
                  <button
                    type="button"
                    onClick={() => setEditRole("owner")}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      editRole === "owner"
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                        <Store size={15} />
                      </span>
                      {editRole === "owner" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Shop Owner
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Full merchant authority over store
                    </div>
                  </button>

                  {/* Super Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditRole("super_admin");
                      setEditShopId(0);
                    }}
                    className={`flex flex-col items-start rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      editRole === "super_admin"
                        ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                        <ShieldCheck size={15} />
                      </span>
                      {editRole === "super_admin" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-bold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                      Super Admin
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Unrestricted platform root authority
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 3: Shop Assignment & Commission */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <Store size={12} className="text-indigo-500" />
                  Store Assignment & Operations
                </div>

                {editRole === "super_admin" ? (
                  <div className="rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-3 flex items-center gap-2.5 text-[12px] text-purple-900 dark:text-purple-300">
                    <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                    <span>
                      Super Admins possess root-level authority across all stores and system settings without requiring a shop assignment.
                    </span>
                  </div>
                ) : (
                  <div className={`grid ${editRole === "staff" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3.5`}>
                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Shop
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Store size={15} />
                        </span>
                        <select
                          value={editShopId}
                          onChange={(e) => setEditShopId(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        >
                          <option value={0}>None / Unassigned Store</option>
                          {shops.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {editRole === "staff" && (
                      <div>
                        <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Commission Rate (%)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Percent size={15} />
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={editCommission}
                            onChange={(e) => setEditCommission(Number(e.target.value))}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-9 pr-8 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Subscription Tier & Status (Non-Super Admin) */}
              {editRole !== "super_admin" && (
                <div className="rounded-xl border border-purple-200/70 dark:border-purple-900/50 bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-purple-50/40 dark:from-purple-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-2.5 flex items-center gap-1.5">
                    <Crown size={13} className="text-amber-500" />
                    Subscription Plan & Tier Status
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Subscription Tier
                      </label>
                      <select
                        value={editPlanId}
                        onChange={(e) => setEditPlanId(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2 text-[12px] text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition cursor-pointer"
                      >
                        <option value={0}>Keep Existing / Free Tier</option>
                        {(plansQuery.data || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.price_monthly}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Tier Status
                      </label>
                      <select
                        value={editShopStatus}
                        onChange={(e) => setEditShopStatus(e.target.value as ShopStatus)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2 text-[12px] text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition cursor-pointer"
                      >
                        <option value="active">Active (Granted Access)</option>
                        <option value="trial">Trial Mode</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Account Status Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 p-3.5">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-slate-800 dark:text-slate-100">
                      Account Sign-In & Access
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        editIsActive
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {editIsActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {editIsActive
                      ? "User can authenticate and manage store operations"
                      : "Login disabled — user cannot access the platform"}
                  </div>
                </div>
                <label
                  className={`relative inline-flex items-center ${
                    currentUser?.id === editUser.id ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                  title={currentUser?.id === editUser.id ? "You cannot deactivate your own account" : undefined}
                >
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    disabled={currentUser?.id === editUser.id}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-disabled:opacity-50 shadow-inner"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <Check size={15} />
                  <span>{updateUserMutation.isPending ? "Saving Changes…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Grant Subscription Tier ── */}
      {tierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Header with Gift & Crown badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Gift size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Grant Subscription Tier
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-purple-700 dark:text-purple-300 uppercase">
                      <ShieldCheck size={11} /> Super Admin
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Complimentary upgrade or tier grant by Super Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTierUser(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Details Callout */}
            <div className="mt-4 rounded-xl border border-purple-100/90 dark:border-purple-900/40 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-purple-50/50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xs">
                  {getInitials(tierUser.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-slate-900 dark:text-slate-100 truncate">
                      {tierUser.full_name}
                    </span>
                    <span className="rounded-md bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
                      {tierUser.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono truncate">
                      <Mail size={11} className="text-slate-400 shrink-0" />
                      {tierUser.email}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="flex items-center gap-1 truncate">
                      <Store size={11} className="text-slate-400 shrink-0" />
                      {tierUser.shop_name || "Store auto-created"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-purple-100 dark:border-purple-900/40 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Current Tier
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  <Sparkles size={11} className="text-amber-500" />
                  {tierUser.plan_name || "Free"}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedPlanId) return;
                grantTierMutation.mutate({
                  userId: tierUser.id,
                  planId: selectedPlanId,
                  status: selectedTierStatus,
                  notes: tierNotes.trim() || undefined,
                });
              }}
              className="mt-5 space-y-4"
            >
              {/* Select Plan Cards */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Crown size={14} className="text-amber-500" />
                    Select Subscription Tier to Grant
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Admin override waives all billing
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(plansQuery.data || []).map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    const isCurrent = tierUser.plan_id === p.id;
                    const meta = getPlanMeta(p);
                    const PlanIcon = meta.Icon;

                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-600/25 shadow-sm"
                            : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 hover:shadow-2xs"
                        }`}
                      >
                        <div>
                          {/* Plan Title & Icon */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`flex size-7 items-center justify-center rounded-lg border ${meta.badgeClass}`}>
                                <PlanIcon size={14} />
                              </span>
                              <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100">
                                {p.name}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="flex size-5 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                                <Check size={11} strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="size-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                          </div>

                          {/* Price & Waived Badge */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                              ${p.price_monthly}/mo
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                              <Gift size={9} /> 100% Free Grant
                            </span>
                            {isCurrent && (
                              <span className="ml-auto text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                Current
                              </span>
                            )}
                          </div>

                          {/* Plan Specs with Lucide Icons */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <Bot size={12} className="text-purple-500 shrink-0" />
                              <span><strong className="text-slate-800 dark:text-slate-100">{(p.ai_replies_limit || 0).toLocaleString()}</strong> AI replies</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <Users size={12} className="text-indigo-500 shrink-0" />
                              <span><strong className="text-slate-800 dark:text-slate-100">{p.staff_seats}</strong> staff seat{p.staff_seats > 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <Radio size={12} className="text-blue-500 shrink-0" />
                              <span><strong className="text-slate-800 dark:text-slate-100">{p.channels_limit}</strong> channel{p.channels_limit > 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status & Validity */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} className="text-purple-500" />
                  Account Status to Assign
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTierStatus("active")}
                    className={`flex items-start gap-2.5 rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      selectedTierStatus === "active"
                        ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <ShieldCheck size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        Active (Full Access)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Permanent features unlocked
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTierStatus("trial")}
                    className={`flex items-start gap-2.5 rounded-xl p-3 text-left border transition-all cursor-pointer ${
                      selectedTierStatus === "trial"
                        ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 ring-2 ring-sky-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 mt-0.5">
                      <Clock size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        Trial Mode
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Temporary evaluation grant
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Admin Note */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <MessageSquareQuote size={14} className="text-purple-500" />
                  Admin Gift Reason / Notes (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. VIP client promo, manual invoice settled, partnership grant"
                    value={tierNotes}
                    onChange={(e) => setTierNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-3.5 pr-8 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {tierNotes && (
                    <button
                      type="button"
                      onClick={() => setTierNotes("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quick preset tags */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-0.5">
                    <Tag size={10} /> Quick tags:
                  </span>
                  {[
                    "VIP Client Promo",
                    "Manual Invoice Settled",
                    "Strategic Partner Grant",
                    "Beta Tester Access",
                    "Customer Loyalty Gift",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTierNotes(chip)}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition cursor-pointer border ${
                        tierNotes === chip
                          ? "bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold"
                          : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
                      }`}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTierUser(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantTierMutation.isPending || !selectedPlanId}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <Gift size={15} />
                  <span>{grantTierMutation.isPending ? "Granting Tier…" : "Grant Subscription Tier"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20">
                  <Trash2 size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Delete User Account
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-700 dark:text-rose-300 uppercase">
                      <AlertTriangle size={11} /> Permanent
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Revoke platform access and delete user profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target User Info Callout */}
            <div className="mt-4 rounded-xl border border-rose-100/80 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/60 via-red-50/30 to-rose-50/40 dark:from-rose-950/20 dark:via-red-950/10 dark:to-rose-950/20 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold text-sm shadow-xs">
                  {getInitials(deleteUserTarget.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-slate-900 dark:text-slate-100 truncate">
                      {deleteUserTarget.full_name}
                    </span>
                    <span className="rounded-md bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase">
                      {deleteUserTarget.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span>{deleteUserTarget.email}</span>
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 shrink-0">
                ID #{deleteUserTarget.id}
              </span>
            </div>

            {/* Warning Callout */}
            <div className="mt-4 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 flex items-start gap-3 text-[12px] text-rose-900 dark:text-rose-200">
              <AlertTriangle size={17} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                This action is <strong className="font-semibold text-rose-700 dark:text-rose-300">irreversible</strong>. The user will immediately be logged out, their account disabled, and all store management access revoked.
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteUserMutation.mutate(deleteUserTarget.id)}
                disabled={deleteUserMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/35 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <Trash2 size={15} />
                <span>{deleteUserMutation.isPending ? "Deleting Account…" : "Yes, Delete Account"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
