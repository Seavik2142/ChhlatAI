import { useState, useMemo, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Mail,
  Store,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Headphones,
  Check,
  KeyRound,
  Tag,
} from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { ChannelRow } from "../../components/ui/Channel";
import { homeFor, useAuth } from "../../lib/auth";

/**
 * Validates and sanitizes redirect parameter to completely prevent Open Redirect vulnerabilities.
 * Disallows external URLs, protocol-relative paths (//evil.com), control characters, and javascript: schemes.
 */
export function getSafeRedirect(rawRedirect: string | null | undefined, fallback: string): string {
  if (!rawRedirect) return fallback;
  try {
    const decoded = decodeURIComponent(rawRedirect).trim();
    // Must start with single slash, not protocol-relative (//) and not backslash (/\)
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return fallback;
    }
    // Block common injection keywords in URL
    if (decoded.includes("javascript:") || decoded.includes("data:") || decoded.includes("\0")) {
      return fallback;
    }
    // Whitelist legitimate internal route paths
    const allowedPrefixes = ["/owner", "/admin", "/staff", "/print/"];
    const isAllowed = allowedPrefixes.some((prefix) => decoded.startsWith(prefix));
    return isAllowed ? decoded : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Evaluates password complexity for real-time security feedback.
 */
function evaluatePassword(pwd: string) {
  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUpper) score += 1;
  if (hasNumberOrSpecial) score += 1;

  return {
    score,
    hasMinLength,
    hasUpper,
    hasNumberOrSpecial,
    level: score === 3 ? "Strong" : score === 2 ? "Good" : score === 1 ? "Weak" : "Too short",
    color:
      score === 3
        ? "bg-emerald-500 text-emerald-700"
        : score === 2
        ? "bg-amber-500 text-amber-700"
        : "bg-rose-500 text-rose-700",
  };
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-12 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Form & Security Controls */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:col-span-6 xl:col-span-5">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
            >
              <img src="/logocllhatAI.svg" alt="Chhlat AI" className="h-9 sm:h-10 w-auto object-contain" />
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>TLS 1.3 · 256-Bit SSL</span>
            </div>
          </div>

          {/* Form Container */}
          <div className="mx-auto mt-8 flex w-full max-w-[440px] flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        {/* Footer Security Guarantee */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Chhlat AI (Cambodia) Co., Ltd. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Visual Trust & Features Showcase */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-16">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-slate-300">Live AI Social Inbox Engine</span>
          </div>
          <div className="text-xs text-slate-600">v2.4 Enterprise</div>
        </div>

        <div className="relative z-10 my-auto flex flex-col gap-8 max-w-xl">
          <div>
            <ChannelRow size={32} gap={10} />
            <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-white">
              Let AI answer every chat &amp; close sales 24/7.
            </h2>
            <p className="mt-3 text-lg font-medium text-indigo-300">
              ឱ្យ AI ឆ្លើយឆាត និងបិទការលក់ជំនួសអ្នក ២៤ ម៉ោង
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Connect Telegram, Facebook Messenger, Instagram and TikTok. Automatically answer product questions, detect
              purchasing intent, verify Bakong KHQR payments, and dispatch delivery orders.
            </p>
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold text-white">Zero Missed Chats</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Average reply speed &lt; 2.4 seconds in both Khmer and English with sentiment tracking.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold text-white">National KHQR Verified</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Instant payment return validation via Bakong, ABA PayWay &amp; ACLEDA merchant APIs.
              </p>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-md">
            <div className="flex items-center gap-1 text-amber-400 text-sm mb-2">
              {"★".repeat(5)}
            </div>
            <p className="text-xs italic leading-relaxed text-slate-300">
              &ldquo;Chhlat AI transformed our online boutique. Over 45% of our midnight and early-morning inquiries
              now convert directly to confirmed KHQR orders without waking up staff.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                S
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sreyneath Chem</p>
                <p className="text-[11px] text-slate-600">Glow Skin Cambodia · Phnom Penh</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-600">
          <span>Protected by strict parameter sanitation &amp; tenant role isolation</span>
          <span>Security Protocol AES-256</span>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // Parameter extraction & sanitization
  const rawRedirect = searchParams.get("redirect");
  const rawEmail = searchParams.get("email");
  const isRegisteredSuccess = searchParams.get("registered") === "true" || searchParams.get("registered") === "1";

  const [email, setEmail] = useState(() => (rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : ""));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoLoadedRole, setDemoLoadedRole] = useState<string | null>(null);

  // If already logged in, redirect safely to appropriate home
  if (user) {
    const safeTarget = getSafeRedirect(rawRedirect, homeFor(user));
    return <Navigate to={safeTarget} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError("Please provide both email and password.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const loggedUser = await login(cleanEmail, cleanPassword);
      // Parameter security: validate redirect against user's actual authenticated role
      const rawSafe = getSafeRedirect(rawRedirect, homeFor(loggedUser));
      let finalDest = rawSafe;
      if (rawSafe.startsWith("/admin") && loggedUser.role !== "super_admin") {
        finalDest = homeFor(loggedUser);
      } else if (rawSafe.startsWith("/owner") && loggedUser.role !== "owner") {
        finalDest = homeFor(loggedUser);
      }
      nav(finalDest);
    } catch (err) {
      setError((err as Error).message || "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };

  const loadDemo = (e: string, p: string, roleName: string) => {
    setEmail(e);
    setPassword(p);
    setError(null);
    setDemoLoadedRole(roleName);
    setTimeout(() => setDemoLoadedRole(null), 3000);
  };

  return (
    <AuthShell title="Sign in to your account" subtitle="Welcome back — your customers and inbox are waiting.">
      {/* Parameter Notification Banners */}
      {isRegisteredSuccess && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold">Account created successfully!</p>
            <p className="text-emerald-700">Please sign in with your credentials to access your new shop workspace.</p>
          </div>
        </div>
      )}

      {rawRedirect && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5 text-xs text-indigo-800">
          <Shield className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>Protected destination parameter verified. You will be redirected after signing in.</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Email Field with Icon */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@shop.kh"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
          </div>
        </div>

        {/* Password Field with Show/Hide Toggle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
            <span className="text-xs text-slate-600">Rate-limit guarded</span>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-600 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          loading={busy}
          type="submit"
          className="mt-1 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
        >
          Sign in <ArrowRight className="ml-1.5 h-4 w-4 inline" />
        </Button>
      </form>

      {/* Modern Clean Demo Accounts Switcher */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
            <span>Instant Demo Switcher</span>
          </div>
          {demoLoadedRole && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md animate-fade-in">
              <Check className="h-3 w-3" /> Loaded {demoLoadedRole}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Super Admin */}
          <button
            type="button"
            onClick={() => loadDemo("admin@omnichat.kh", "Admin@12345", "Super Admin")}
            className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-purple-300 hover:shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-purple-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Super Admin</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-600 truncate w-full">admin@omnichat.kh</span>
          </button>

          {/* Shop Owner */}
          <button
            type="button"
            onClick={() => loadDemo("owner@glowskin.kh", "Owner@12345", "Shop Owner")}
            className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-emerald-300 hover:shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-emerald-700">
              <Store className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Shop Owner</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-600 truncate w-full">owner@glowskin.kh</span>
          </button>

          {/* Chat Staff */}
          <button
            type="button"
            onClick={() => loadDemo("vanna@glowskin.kh", "Staff@12345", "Chat Staff")}
            className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-sky-300 hover:shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-sky-700">
              <Headphones className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Chat Staff</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-600 truncate w-full">vanna@glowskin.kh</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Create free shop account
        </Link>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // Parameter extraction & sanitization
  const rawPlan = searchParams.get("plan");
  const validatedPlan = rawPlan && ["free", "pro", "enterprise"].includes(rawPlan.toLowerCase())
    ? rawPlan.toLowerCase()
    : "free";

  const [form, setForm] = useState({
    shop_name: "",
    category: "Skincare & Cosmetics",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    plan_code: validatedPlan,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Promo Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    final_price: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const planPrice = form.plan_code === "enterprise" ? 199 : form.plan_code === "pro" ? 49 : 0;
      const res = await api.post<any>("/coupons/validate", {
        code: couponCode.trim(),
        plan_code: form.plan_code,
        price: planPrice,
      });
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discount_amount: res.discount_amount,
        final_price: res.final_price,
        message: res.message,
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.response?.data?.detail || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  if (user) return <Navigate to={homeFor(user)} replace />;

  const setField = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const passwordEval = useMemo(() => evaluatePassword(form.password), [form.password]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanShop = form.shop_name.trim();
    const cleanName = form.full_name.trim();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPhone = form.phone.trim();

    if (!cleanShop || !cleanName || !cleanEmail || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match. Please re-check.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await register({
        shop_name: cleanShop,
        category: form.category,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || "",
        password: form.password,
        plan_code: form.plan_code,
      });
      nav("/owner/settings");
    } catch (err) {
      setError((err as Error).message || "Could not complete registration");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your shop"
      subtitle="Connect your social channels & start closing sales with AI."
    >
      {/* Selected Plan Parameter Banner */}
      <div className="mb-5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-950">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>
              {form.plan_code === "pro"
                ? "Pro Tier (14-Day Free Trial)"
                : form.plan_code === "enterprise"
                ? "Enterprise Tier"
                : "Free Starter Tier"}
            </span>
          </div>
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {form.plan_code.toUpperCase()}
          </span>
        </div>
        <p className="mt-1 text-slate-600">
          {form.plan_code === "pro"
            ? "Full access to 4 channels (Telegram, FB, IG, TikTok), 10k AI replies, 5 staff seats & KHQR links."
            : "Includes 500 AI replies, 1 Telegram channel and automated KHQR payment links with no credit card."}
        </p>

        {/* Promo Coupon Discount Banner in Registration */}
        {form.plan_code !== "free" && (
          <div className="mt-3 pt-2.5 border-t border-indigo-200/60">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 p-2 text-emerald-900 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                  <span>
                    Coupon <strong>{appliedCoupon.code}</strong> applied!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-emerald-800">
                    ${appliedCoupon.final_price.toFixed(2)}/mo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                    className="text-[10.5px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : showCouponInput ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code (e.g. WELCOME50)"
                      className="w-full rounded-lg border border-indigo-200 bg-white py-1.5 pl-7 pr-2 font-mono text-[11.5px] font-bold uppercase text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponError(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                  >
                    Cancel
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10.5px] font-semibold text-rose-600">{couponError}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCouponInput(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <Tag size={11} />
                <span>Have a discount coupon code?</span>
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {/* Shop Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Shop Name</label>
          <div className="relative flex items-center">
            <Store className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={form.shop_name}
              onChange={setField("shop_name")}
              placeholder="e.g. Glow Skin Cambodia"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
          </div>
        </div>

        {/* Business Category Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">What do you sell?</label>
          <select
            value={form.category}
            onChange={setField("category")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
          >
            <option value="Skincare & Cosmetics">Skincare &amp; Cosmetics (គ្រឿងសម្អាង)</option>
            <option value="Fashion & Clothing">Fashion &amp; Clothing (សម្លៀកបំពាក់)</option>
            <option value="Electronics & Gadgets">Electronics &amp; Gadgets (គ្រឿងអេឡិចត្រូនិក)</option>
            <option value="Food & Beverage">Food &amp; Beverage (ម្ហូបអាហារ និងភេសជ្ជៈ)</option>
            <option value="Health & Supplements">Health &amp; Supplements (សុខភាព និងអាហារបំប៉ន)</option>
            <option value="General Retail">General Retail (ទំនិញទូទៅ)</option>
          </select>
        </div>

        {/* Owner Name & Phone Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Your Full Name</label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={form.full_name}
                onChange={setField("full_name")}
                placeholder="e.g. Sok Vanna"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Phone (Optional)</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
              <input
                type="tel"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="012 345 678"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
              />
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type="email"
              required
              value={form.email}
              onChange={setField("email")}
              placeholder="you@shop.kh"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
          </div>
        </div>

        {/* Password & Strength Meter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={setField("password")}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-600 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Real-time Password Complexity Evaluation */}
          {form.password && (
            <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-600">Password strength:</span>
                <span className={`text-[11px] font-bold ${passwordEval.score === 3 ? "text-emerald-700" : passwordEval.score === 2 ? "text-amber-700" : "text-rose-700"}`}>
                  {passwordEval.level}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5 mb-2">
                <div className={`rounded-full ${passwordEval.score >= 1 ? passwordEval.color : "bg-slate-200"}`} />
                <div className={`rounded-full ${passwordEval.score >= 2 ? passwordEval.color : "bg-slate-200"}`} />
                <div className={`rounded-full ${passwordEval.score >= 3 ? passwordEval.color : "bg-slate-200"}`} />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                <span className={passwordEval.hasMinLength ? "text-emerald-700 font-medium" : ""}>
                  {passwordEval.hasMinLength ? "✓" : "○"} 8+ characters
                </span>
                <span className={passwordEval.hasUpper ? "text-emerald-700 font-medium" : ""}>
                  {passwordEval.hasUpper ? "✓" : "○"} Uppercase letter
                </span>
                <span className={passwordEval.hasNumberOrSpecial ? "text-emerald-700 font-medium" : ""}>
                  {passwordEval.hasNumberOrSpecial ? "✓" : "○"} Number or symbol
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Confirm Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              value={form.confirm_password}
              onChange={setField("confirm_password")}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/15"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-slate-600 hover:text-slate-600 focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.confirm_password && form.password !== form.confirm_password && (
            <p className="text-[11px] text-rose-600 font-medium">Passwords do not match</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          loading={busy}
          type="submit"
          className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
        >
          Create my shop workspace <ArrowRight className="ml-1.5 h-4 w-4 inline" />
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
