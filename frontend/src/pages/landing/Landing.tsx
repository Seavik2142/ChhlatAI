import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Lock,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { PaidToast, ProviderCard } from "../../components/commerce/ProviderCard";
import { SendToDelivery } from "../../components/commerce/SendToDelivery";
import { IconRail } from "../../components/inbox/IconRail";
import { LiveChat } from "../../components/inbox/LiveChat";
import { PriorityToast } from "../../components/inbox/PriorityToast";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { ThemeToggle } from "../../lib/theme";
import { useLanguage } from "../../lib/i18n";
import {
  DEMO_STAFF,
  demoChannyChat,
  demoDaraChat,
  demoDeliveryOrder,
  demoInbox,
  demoInboxST02,
  demoProviders,
  demoQuickReplies,
  demoSuggestion,
} from "./demo";
import { Scaled } from "./Scaled";

const noop = () => {};

const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx("mx-auto w-full max-w-[1240px] px-4 sm:px-6 xl:px-8", className)}>{children}</div>
);

/** Smooth Scroll-Triggered Entrance Component */
function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    return false;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx(
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <NavBar />
      <Hero />
      <StatsBand />
      <EcosystemMarquee />
      <ScrollReveal>
        <Problems />
      </ScrollReveal>
      <ScrollReveal>
        <Features />
      </ScrollReveal>
      <ScrollReveal>
        <RoiCalculator />
      </ScrollReveal>
      <ScrollReveal>
        <Spotlights />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <Pricing />
      </ScrollReveal>
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal>
        <Faq />
      </ScrollReveal>
      <ScrollReveal>
        <FinalCta />
      </ScrollReveal>
      <div className="h-20" />
      <Footer />
    </div>
  );
}

// ------------------------------------------------------------------ nav

function NavBar() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-md transition-all">
      <Container className="flex items-center justify-between gap-6 py-3.5 sm:py-4">
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center transition-opacity hover:opacity-90">
          <img
            src="/logocllhatAI.svg"
            alt="Chhlat AI"
            className="h-9 sm:h-10 w-auto object-contain dark:hidden"
          />
          <img
            src="/logocllhatAI-dark.svg"
            alt="Chhlat AI"
            className="h-9 sm:h-10 w-auto object-contain hidden dark:block"
          />
        </Link>

        {/* Navigation links */}
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-1 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-2xs backdrop-blur-sm lg:flex">
          {[
            ["Features", "#features"],
            ["How it works", "#how"],
            ["Pricing", "#pricing"],
            ["Customers", "#customers"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-2xs"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Toggle language"
          >
            <Globe className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === "en" ? "ខ្មែរ / EN" : "EN / ខ្មែរ"}</span>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle id="landing-theme-toggle-btn" />

          <Link
            to="/login"
            className="hidden text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:inline-block"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Start free</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </header>
  );
}

// ------------------------------------------------------------------ hero

function Stars() {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

const LIVE_ACTIVITY_EVENTS = [
  { shop: "GLOW Skin Cambodia", action: "Closed $24.00 order via Bakong KHQR", time: "just now", channel: "facebook", bank: "bakong" },
  { shop: "Kasekor Agri Depot", action: "AI recommended crop care in Khmer", time: "18s ago", channel: "telegram", bank: null },
  { shop: "Brown Bean Coffee", action: "Dispatched 2 orders with QR waybills", time: "42s ago", channel: "instagram", courier: "jnt" },
  { shop: "Modern Living Phnom Penh", action: "ABA PayWay $140.00 confirmed in 1.4s", time: "1m ago", channel: "tiktok", bank: "aba" },
];

function HeroLiveActivity() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LIVE_ACTIVITY_EVENTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const event = LIVE_ACTIVITY_EVENTS[index];

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-3.5 py-1.5 shadow-2xs backdrop-blur-md transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
      <BrandLogo brand={event.channel} size={18} rounded="full" />
      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{event.shop}</span>
        <span className="text-slate-400 dark:text-slate-600">·</span>
        <span className="max-w-[320px] truncate">{event.action}</span>
        {event.bank && <BrandLogo brand={event.bank} size={15} rounded="sm" className="inline-block shrink-0" />}
        {"courier" in event && event.courier && <BrandLogo brand={event.courier} size={15} rounded="sm" className="inline-block shrink-0" />}
        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
          {event.time}
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50/30 dark:from-[#030712] dark:via-[#080d1a] dark:to-[#030712] px-4 pt-12 pb-20 sm:pt-16 sm:pb-28 transition-colors">
      {/* Decorative ambient aurora glowing orbs with drift animation */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent dark:from-indigo-600/30 dark:via-purple-600/20 dark:to-transparent blur-3xl animate-aurora-drift" />
      <div className="pointer-events-none absolute -top-20 right-1/4 h-[460px] w-[580px] translate-x-1/3 rounded-full bg-gradient-to-bl from-violet-500/15 via-pink-500/10 to-transparent dark:from-violet-600/25 dark:via-fuchsia-600/15 dark:to-transparent blur-3xl animate-aurora-drift-2" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-40 dark:opacity-30 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_60%,transparent_100%)]" />

      <Container className="relative flex flex-col items-center gap-10 text-center sm:gap-12">
        {/* Release / Feature Pill with real bank icons */}
        <a
          href="#features"
          className="group inline-flex items-center gap-2 rounded-full border border-indigo-100 dark:border-indigo-500/30 bg-white/95 dark:bg-slate-900/80 px-3.5 py-1.5 shadow-2xs backdrop-blur-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:shadow-xs"
        >
          <div className="flex items-center -space-x-1">
            <BrandLogo brand="bakong" size={18} rounded="full" className="ring-1 ring-white dark:ring-slate-900" />
            <BrandLogo brand="aba" size={18} rounded="full" className="ring-1 ring-white dark:ring-slate-900" />
            <BrandLogo brand="acleda" size={18} rounded="full" className="ring-1 ring-white dark:ring-slate-900" />
          </div>
          <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
            NEW
          </span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 sm:text-sm">
            Bakong KHQR, ABA PayWay &amp; ACLEDA — auto-confirmed in seconds
          </span>
          <ArrowRight className="size-3.5 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-1" />
        </a>

        {/* Hero Headline & Subtitles */}
        <div className="flex max-w-[880px] flex-col items-center gap-5 sm:gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl sm:leading-[1.15]">
            Let AI answer every chat <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent animate-gradient-x">
              and close sales — 24/7
            </span>
          </h1>

          {/* Khmer Dual Language Highlight Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100/90 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/50 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs sm:text-base">
            <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span>ឱ្យ AI ឆ្លើយឆាត និងបិទការលក់ជំនួសអ្នក ២៤ ម៉ោង</span>
          </div>

          <p className="max-w-[720px] text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-relaxed">
            One unified inbox for <strong>Telegram, Facebook, Instagram, and TikTok</strong>. Chhlat AI recommends
            products, generates invoices, verifies real ABA &amp; Bakong KHQR payments, and books fast delivery — while
            your staff focus on high-value customers.
          </p>

          {/* Action Buttons */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="group relative overflow-hidden flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-500/25 dark:shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-indigo-600 dark:hover:from-indigo-400 dark:hover:to-indigo-500 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
              <Sparkles className="size-4" />
              <span>Start free — no card needed</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#how"
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="size-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
              <span>Watch 2-min demo</span>
            </a>
          </div>

          {/* Real-time Dynamic Activity Ticker */}
          <div className="pt-1">
            <HeroLiveActivity />
          </div>

          {/* Social Proof & Channel Support */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 shadow-2xs">
              <BrandLogo brand="telegram" size={20} rounded="full" />
              <BrandLogo brand="facebook" size={20} rounded="full" />
              <BrandLogo brand="instagram" size={20} rounded="full" />
              <BrandLogo brand="tiktok" size={20} rounded="full" />
              <span className="ml-1 text-slate-500 dark:text-slate-400">Connected</span>
            </div>
            <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Stars />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Loved by 1,200+ Cambodian shops</span>
            </div>
          </div>
        </div>

        {/* Interactive Showcase Preview */}
        <ProductShot />
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ product showcase with tab switcher

function ProductShot() {
  const [activeTab, setActiveTab] = useState<"chat" | "payments" | "delivery">("chat");

  return (
    <div className="relative w-full max-w-[1180px] flex flex-col gap-3">
      {/* Floating Interactive Badge 1: Left (Telegram chat inquiry) */}
      <div className="hidden xl:flex absolute -left-12 top-28 z-20 items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/90 p-3.5 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/50 backdrop-blur-md animate-float-slow max-w-[280px] text-left ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="relative">
          <BrandLogo brand="telegram" size={40} rounded="full" />
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Telegram Inquiry</span>
            <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">0.8s reply</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">"Bong, have acne serum?"</span>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">AI sent price &amp; KHQR</span>
        </div>
      </div>

      {/* Floating Interactive Badge 2: Right (Bank verified & waybill) */}
      <div className="hidden xl:flex absolute -right-12 bottom-28 z-20 items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/90 p-3.5 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-950/50 backdrop-blur-md animate-float-reverse max-w-[300px] text-left ring-1 ring-slate-900/5 dark:ring-white/10">
        <BrandLogo brand="bakong" size={40} rounded="xl" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Bakong KHQR Paid</span>
            <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">$15.50</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Bank webhook verified (0.9s)</span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>✓</span>
            <BrandLogo brand="jnt" size={14} rounded="sm" className="inline-block" />
            <span>Waybill auto-generated</span>
          </div>
        </div>
      </div>

      {/* Interactive Feature Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-1 shadow-xs backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("chat")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
              activeTab === "chat"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <BrandLogo brand="telegram" size={16} rounded="full" />
            <span>AI Chat &amp; Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
              activeTab === "payments"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <BrandLogo brand="bakong" size={16} rounded="sm" />
            <span>KHQR &amp; Bank Payments</span>
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
              activeTab === "delivery"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <BrandLogo brand="jnt" size={16} rounded="sm" />
            <span>1-Click Delivery</span>
          </button>
        </div>
      </div>

      {/* Browser Mockup Window */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-indigo-500/10 dark:shadow-[0_0_80px_-20px_rgba(99,102,241,0.25)] ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300 hover:shadow-indigo-500/20">
        {/* Browser Top Navigation Chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-rose-400/90" />
            <span className="size-3 rounded-full bg-amber-400/90" />
            <span className="size-3 rounded-full bg-emerald-400/90" />
          </div>
          <span className="flex-1" />
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/80 px-4 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
            <Lock className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400">https://</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">app.chhlat.ai</span>
            <span className="text-slate-400 dark:text-slate-500">/{activeTab}</span>
          </div>
          <span className="flex-1" />
          <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Live</span>
          </div>
        </div>

        {/* Viewport content */}
        <div className="relative bg-slate-50 dark:bg-slate-950">
          {activeTab === "chat" && (
            <Scaled width={1440} height={900} maxScale={0.82}>
              <DemoScreen variant="st01" />
            </Scaled>
          )}

          {activeTab === "payments" && (
            <div className="flex min-h-[520px] flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/20">
              <Scaled width={1200} height={485} maxScale={0.78}>
                <div className="grid h-[485px] grid-cols-3 gap-6 text-left">
                  {demoProviders.map((p) => (
                    <ProviderCard key={p.id} p={p} />
                  ))}
                </div>
              </Scaled>
              <div className="mt-6">
                <PaidToast title="INV-1187 paid · $15.50" body="Confirmed by Bakong in 3 seconds · Stock deducted" />
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="flex min-h-[520px] items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/20">
              <Scaled width={440} height={580} maxScale={0.9} clip={false} className="text-left">
                <SendToDelivery order={demoDeliveryOrder} fees={{ phnom_penh: 1.5, province: 2, grab: 2.8 }} />
              </Scaled>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The real Staff Panel components rendered with demo data. */
function DemoScreen({ variant }: { variant: "st01" | "st02" }) {
  const st02 = variant === "st02";
  const [draft, setDraft] = useState(st02 ? "/de" : "");
  return (
    <div className="flex h-[900px] w-[1440px] bg-canvas text-left">
      <IconRail active="chat" chatCount={7} userName={DEMO_STAFF.name} online />
      <LiveChat
        inbox={st02 ? demoInboxST02() : demoInbox()}
        tab="all"
        onTab={noop}
        query=""
        onQuery={noop}
        selected={st02 ? demoDaraChat() : demoChannyChat()}
        onSelect={noop}
        online
        meId={DEMO_STAFF.id}
        quickReplies={demoQuickReplies}
        draft={draft}
        onDraft={setDraft}
        suggestion={st02 ? demoSuggestion : null}
        chatActions={{ takeOver: noop, resumeAi: noop, send: noop }}
        copilotActions={{ shareTracking: noop }}
        overlay={
          !st02 && (
            <PriorityToast
              title="🚨 High priority · Dara Sok ⭐ VIP"
              body="Customer is upset — paid yesterday, parcel not sent"
              style={{ left: 144, top: 136, right: "auto" }}
            />
          )
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ stats band

function StatsBand() {
  const stats = [
    {
      value: "94%",
      label: "Chats resolved autonomously by AI",
      sub: "Khmer & English natural speech",
      tag: "Autonomous AI",
      icon: Bot,
      pill: "🇰🇭 ខ្មែរ · 🇬🇧 EN",
      gradient: "from-purple-600 via-indigo-600 to-indigo-500 dark:from-purple-400 dark:via-indigo-300 dark:to-white",
      iconBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20",
      badgeClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
      accentBorder: "group-hover:border-purple-400/80 dark:group-hover:border-purple-500/50",
      glowBg: "from-purple-500/10 via-indigo-500/5 to-transparent",
      accentBar: "bg-gradient-to-r from-purple-500 to-indigo-500",
    },
    {
      value: "< 3s",
      label: "Instant first reply, day or night",
      sub: "Never lose nighttime buyers",
      tag: "Real-time AI",
      icon: Zap,
      pill: "24/7 Day & Night",
      gradient: "from-amber-500 via-orange-500 to-amber-600 dark:from-amber-300 dark:via-orange-300 dark:to-yellow-200",
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
      badgeClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
      accentBorder: "group-hover:border-amber-400/80 dark:group-hover:border-amber-500/50",
      glowBg: "from-amber-500/10 via-orange-500/5 to-transparent",
      accentBar: "bg-gradient-to-r from-amber-500 to-orange-500",
      isLive: true,
    },
    {
      value: "4 Apps",
      label: "Telegram · Messenger · IG · TikTok",
      sub: "All in one synchronized inbox",
      tag: "Unified Inbox",
      icon: MessageSquare,
      brands: ["telegram", "messenger", "instagram", "tiktok"],
      gradient: "from-blue-600 via-indigo-600 to-sky-500 dark:from-sky-400 dark:via-indigo-300 dark:to-sky-200",
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
      badgeClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
      accentBorder: "group-hover:border-blue-400/80 dark:group-hover:border-blue-500/50",
      glowBg: "from-blue-500/10 via-sky-500/5 to-transparent",
      accentBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
    {
      value: "0",
      label: "Fake slips to verify by eye",
      sub: "Bank API verifies every transfer",
      tag: "Zero Fraud",
      icon: ShieldCheck,
      brands: ["bakong", "aba", "acleda"],
      gradient: "from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
      accentBorder: "group-hover:border-emerald-400/80 dark:group-hover:border-emerald-500/50",
      glowBg: "from-emerald-500/10 via-teal-500/5 to-transparent",
      accentBar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
  ];

  return (
    <section className="relative border-y border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/90 dark:from-[#060a15] dark:via-[#090e1c] dark:to-[#060a15] py-14 sm:py-20 transition-colors overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 dark:via-indigo-500/30 to-transparent" />

      <Container className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <ScrollReveal key={s.value} delay={i * 90}>
                <div
                  className={clsx(
                    "group relative h-full flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/70 p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:shadow-slate-950/50 overflow-hidden",
                    s.accentBorder
                  )}
                >
                  {/* Ambient hover glow inside card */}
                  <div
                    className={clsx(
                      "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      s.glowBg
                    )}
                  />

                  {/* Top Header: Icon & Category Tag / Brands */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span
                      className={clsx(
                        "flex size-10 items-center justify-center rounded-xl shadow-2xs transition-transform duration-300 group-hover:scale-110",
                        s.iconBg
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    {s.brands ? (
                      <div className="flex items-center -space-x-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                        {s.brands.map((b) => (
                          <BrandLogo
                            key={b}
                            brand={b}
                            size={18}
                            rounded="full"
                            className="ring-2 ring-white dark:ring-slate-900 shrink-0"
                          />
                        ))}
                      </div>
                    ) : (
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-2xs whitespace-nowrap",
                          s.badgeClass
                        )}
                      >
                        {s.isLive && (
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {s.tag}
                      </span>
                    )}
                  </div>

                  {/* Middle: Big Stat & Primary Label */}
                  <div className="relative z-10 mt-6 flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={clsx(
                          "text-4xl sm:text-5xl font-black tracking-tight leading-none bg-gradient-to-br bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform origin-left",
                          s.gradient
                        )}
                      >
                        {s.value}
                      </span>
                      {s.pill && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                          {s.pill}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3.5 text-[15px] font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {s.label}
                    </h3>
                  </div>

                  {/* Bottom: Subtitle / helper note */}
                  <div className="relative z-10 mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-normal">
                      {s.sub}
                    </p>
                    <span className="shrink-0 flex size-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <CheckCircle2 size={12} />
                    </span>
                  </div>

                  {/* Subtle bottom edge accent indicator */}
                  <div
                    className={clsx(
                      "absolute bottom-0 inset-x-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      s.accentBar
                    )}
                  />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ infinite partner marquee

function EcosystemMarquee() {
  const items = [
    { name: "Bakong KHQR", tag: "National Bank", brand: "bakong" },
    { name: "ABA Bank PayWay", tag: "Instant Webhook", brand: "aba" },
    { name: "ACLEDA ToanChet", tag: "Bank API", brand: "acleda" },
    { name: "Wing Bank", tag: "Digital Payroll", brand: "wing" },
    { name: "Telegram Bot API", tag: "Direct Sync", brand: "telegram" },
    { name: "Facebook Messenger", tag: "Meta Verified", brand: "facebook" },
    { name: "Instagram Direct", tag: "Auto-DM", brand: "instagram" },
    { name: "TikTok Live & Shop", tag: "Social Commerce", brand: "tiktok" },
    { name: "J&T Express", tag: "1-Click Waybill", brand: "jnt" },
    { name: "Virak Buntham (VET)", tag: "Provinces", brand: "vet" },
    { name: "Grab Express", tag: "Phnom Penh 1h", brand: "grab" },
  ];

  return (
    <div className="relative border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#050914] py-3.5 overflow-hidden transition-colors">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-slate-100 dark:from-[#050914] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-slate-100 dark:from-[#050914] to-transparent" />
      <div className="animate-marquee flex items-center gap-6">
        {[...items, ...items].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-3.5 py-1.5 text-xs shadow-2xs whitespace-nowrap transition-transform duration-200 hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-500/40"
          >
            <BrandLogo brand={item.brand} size={22} rounded="md" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
            <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ shared section heading

function Heading({
  eyebrow,
  title,
  sub,
  km,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  km?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase shadow-2xs">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {km && <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 sm:text-lg">{km}</p>}
      {sub && <p className="max-w-[720px] text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">{sub}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ problems

function Problems() {
  const cards = [
    {
      icon: Clock,
      title: "Customers wait — then buy elsewhere",
      body: "Replies take hours when staff are busy or asleep. In Cambodia, buyers message 3 shops at once and purchase from whoever answers first.",
      quote: '"Bong, still have stock?" … 3 hours later 😢',
      stat: "68% lost sales at night",
      badge: "Slow Replies",
    },
    {
      icon: ShieldCheck,
      title: "Angry customers get lost in the noise",
      body: '"I paid yesterday, where is my order?" sinks under 200 normal price questions — turning loyal buyers into 1-star reviews on social media.',
      quote: '😡 "ធ្វើការបែបនេះមែន?? ផ្ញើលុយរួចហើយ!"',
      stat: "Top cause of negative reviews",
      badge: "Customer Churn",
    },
    {
      icon: Zap,
      title: "Everything is typed manually twice",
      body: "Copying names, phones, and addresses into J&T or Virak Buntham, checking ABA slip photos by eye, and counting stock in paper notebooks.",
      quote: "2–3 hours wasted on admin every single day",
      stat: "15+ hours lost weekly",
      badge: "Manual Overhead",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-[#030712] transition-colors">
      <Container className="flex flex-col gap-12 sm:gap-16">
        <Heading
          eyebrow="SOUND FAMILIAR?"
          title="Your social inbox is leaking sales"
          km="ការឆ្លើយឆាតយឺត និងការពិនិត្យ slip ដោយដៃ កំពុងធ្វើឱ្យអ្នកបាត់បង់ប្រាក់ចំណេញ"
          sub="Online sellers in Cambodia manage hundreds of messages every day across 4 different apps. Here is where the revenue disappears."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <ScrollReveal key={c.title} delay={i * 120}>
                <div
                  className="group h-full flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 p-7 shadow-xs transition-all duration-300 hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-xl hover:-translate-y-2 dark:shadow-slate-950/40 backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/10 dark:ring-rose-500/20 group-hover:scale-110 transition-transform">
                        <Icon className="size-5" />
                      </span>
                      <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                        {c.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{c.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{c.body}</p>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <p className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 italic">
                      {c.quote}
                    </p>
                    <span className="text-right text-[11px] font-bold text-rose-600 dark:text-rose-400">{c.stat}</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ features bento

function Features() {
  const cards = [
    {
      icon: MessageSquare,
      title: "Unified Social Commerce Inbox",
      body: "Telegram, Messenger, Instagram, and TikTok in one synchronized feed. Every customer conversation tagged with its official platform badge.",
      badge: "Multi-Platform",
      color: "indigo",
      brands: ["telegram", "messenger", "instagram", "tiktok"],
      brandLabel: "Platforms:",
    },
    {
      icon: Bot,
      title: "Bilingual AI Sales Assistant",
      body: "Trained on your real products, pricing, and guidelines. Reads and replies naturally in Khmer and English, suggests products, and generates invoices.",
      badge: "Khmer & English",
      color: "emerald",
    },
    {
      icon: CreditCard,
      title: "Bank-Confirmed Payments",
      body: "Bakong KHQR, ABA PayWay, and ACLEDA Toan Chet Pay. Orders are automatically marked paid via bank API webhooks in under 3 seconds. Zero fake slips.",
      badge: "Auto-Confirm",
      color: "sky",
      brands: ["bakong", "aba", "acleda", "wing"],
      brandLabel: "Gateways:",
    },
    {
      icon: ShieldCheck,
      title: "Smart Priority & Staff Takeover",
      body: "AI sentiment radar automatically flags angry or urgent chats and notifies your team. Staff can take over in 1 click and resume AI when resolved.",
      badge: "Sentiment Radar",
      color: "rose",
    },
    {
      icon: Truck,
      title: "One-Click Logistics Dispatch",
      body: "Send paid orders directly to J&T Express, Virak Buntham, or Grab and print a QR shipping slip immediately with zero re-typing.",
      badge: "Instant Slip",
      color: "amber",
      brands: ["jnt", "vet", "grab"],
      brandLabel: "Couriers:",
    },
    {
      icon: Zap,
      title: "AI Retargeting & Broadcasts",
      body: "Send free promotions directly to past buyers on Telegram and Messenger, personalized by AI according to what they purchased before.",
      badge: "$0 Ad Spend",
      color: "violet",
      brands: ["telegram", "messenger"],
      brandLabel: "Broadcasts:",
    },
  ];

  const chips = [
    "Low-stock Telegram alerts",
    "VIP tags & loyalty points",
    "Staff roles & commissions",
    "Live Khmer & English switching",
    "Catalog Excel import",
    "Custom AI knowledge base",
  ];

  return (
    <section id="features" className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070b16] py-20 sm:py-28 transition-colors">
      <Container className="flex flex-col items-center gap-14 sm:gap-16">
        <Heading
          eyebrow="EVERYTHING IN ONE PLACE"
          title="One AI teammate for chat, payment and delivery"
          km="គ្រប់គ្រងការលក់ ការទូទាត់ និងការដឹកជញ្ជូន ក្នុងប្រព័ន្ធតែមួយ"
          sub="From the first product inquiry to a printed delivery slip — Chhlat AI handles the heavy lifting so your human team can focus on delighting customers."
        />

        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <ScrollReveal key={c.title} delay={i * 80}>
                <div
                  className="group h-full flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 p-7 shadow-xs transition-all duration-300 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-2 dark:shadow-slate-950/40 backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Icon className="size-6" />
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {c.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{c.body}</p>
                  </div>

                  {"brands" in c && c.brands && (
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3.5">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {"brandLabel" in c ? c.brandLabel : "Supported:"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {c.brands.map((b) => (
                          <BrandLogo key={b} brand={b} size={22} rounded="md" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Capabilities Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Also included out of the box:</span>
          {chips.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-transform hover:scale-105"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{label}</span>
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ interactive ROI calculator

function RoiCalculator() {
  const [dailyChats, setDailyChats] = useState(150);

  // Dynamic metrics based on daily volume
  const hoursSavedMonth = Math.round((dailyChats * 2.5 * 30) / 60); // ~2.5 mins per chat saved
  const nightOrdersMonth = Math.round(dailyChats * 0.15 * 30); // ~15% night inquiries closed
  const nightRevenueMonth = Math.round(nightOrdersMonth * 16); // average $16 basket size in Cambodia
  const slipsVerified = Math.round(dailyChats * 0.45 * 30); // 45% of chats lead to payment slip

  return (
    <section className="py-20 sm:py-28 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#030712] transition-colors overflow-hidden relative">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[800px] rounded-full bg-indigo-500/5 dark:bg-indigo-600/15 blur-3xl animate-pulse-subtle" />

      <Container className="relative flex flex-col items-center gap-12 sm:gap-14">
        <Heading
          eyebrow="INTERACTIVE ROI CALCULATOR"
          title="See how much your shop saves every month"
          km="គណនាប្រាក់ចំណេញ និងពេលវេលាដែលអ្នកនឹងសន្សំបាន"
          sub="Adjust your shop's estimated daily customer message volume to calculate time freed, fake slips eliminated, and extra nighttime revenue captured."
        />

        <div className="w-full max-w-[960px] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/60 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 p-6 sm:p-10 shadow-xl shadow-indigo-500/5 backdrop-blur-md">
          {/* Controls */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Daily Customer Messages
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Messages received across all 4 apps
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-2xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 px-5 py-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  {dailyChats}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">chats / day</span>
              </div>
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="30"
                max="600"
                step="10"
                value={dailyChats}
                onChange={(e) => setDailyChats(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>30 chats</span>
                <span>150 chats</span>
                <span>300 chats</span>
                <span>450 chats</span>
                <span>600+ chats</span>
              </div>
            </div>

            {/* Quick preset pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Or choose preset:</span>
              {[
                { label: "Small boutique (50/day)", val: 50 },
                { label: "Active shop (150/day)", val: 150 },
                { label: "Busy retail (300/day)", val: 300 },
                { label: "High-volume brand (500/day)", val: 500 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setDailyChats(p.val)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                    dailyChats === p.val
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-8 h-px bg-slate-200/80 dark:bg-slate-800/80" />

          {/* Result Cards Grid with Animated Values */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/40 p-5 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Staff Time Freed</span>
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                {hoursSavedMonth} hrs
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Saved every month from typing</span>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-emerald-100 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 p-5 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Night Sales Recovered</span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                +${nightRevenueMonth.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">~{nightOrdersMonth} night orders closed</span>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-sky-100 dark:border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/40 p-5 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Bank Slips Verified</span>
              <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
                {slipsVerified.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">0 fake slips by eye</span>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-violet-100 dark:border-violet-500/30 bg-violet-50/60 dark:bg-violet-950/40 p-5 transition-transform hover:-translate-y-1">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Response Speed</span>
              <span className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">
                &lt; 2 sec
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Down from 30+ min delay</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-500/20">
            <div className="flex flex-col">
              <span className="text-base font-bold">Estimated Net Return: 15x – 30x on Pro Plan</span>
              <span className="text-xs text-indigo-100">For $29/mo, save {hoursSavedMonth} hours of human wages and close +${nightRevenueMonth.toLocaleString()} in extra revenue.</span>
            </div>
            <Link
              to="/register"
              className="group relative overflow-hidden flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-600/10 to-transparent group-hover:animate-shimmer" />
              <span>Start Free Trial</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ spotlights

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((b, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Check className="size-3 stroke-[3]" />
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-base">{b}</span>
        </li>
      ))}
    </ul>
  );
}

function Spotlights() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-[#030712] transition-colors">
      <Container className="flex flex-col gap-24 sm:gap-32">
        {/* Spotlight 1: Human + AI */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex w-full max-w-[500px] flex-col gap-5">
            <span className="self-start rounded-full border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
              HUMAN + AI COLLABORATION
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              AI replies instantly. <br />
              <span className="text-indigo-600 dark:text-indigo-400">You stay in total control.</span>
            </h2>
            <p className="text-base font-semibold text-indigo-700 dark:text-indigo-300">AI ឆ្លើយ — អ្នកនៅតែគ្រប់គ្រង</p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              The AI answers pricing inquiries, gives product recommendations, and takes orders on autopilot. When an upset
              customer or custom request arrives, it tags the conversation <strong>[Wait Staff]</strong> and pings your team.
            </p>
            <Bullets
              items={[
                "Real-time sentiment detection: 🟢 Normal · 🟡 Interested · 🔴 Urgent/Upset",
                "Take over any conversation in 1 click via text, voice, or photo",
                "Messages send directly into the customer's native app",
                "Resume AI autopilot whenever your staff is done",
              ]}
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Integrated Inboxes:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="telegram" size={16} rounded="full" />
                  <span>Telegram</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="messenger" size={16} rounded="full" />
                  <span>Messenger</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="instagram" size={16} rounded="full" />
                  <span>Instagram</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="tiktok" size={16} rounded="full" />
                  <span>TikTok</span>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[620px] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-br from-indigo-50/70 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 p-6 shadow-xl shadow-indigo-500/5">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
              <Scaled width={1440} height={900} maxScale={0.42}>
                <DemoScreen variant="st02" />
              </Scaled>
            </div>
          </div>
        </div>

        {/* Spotlight 2: Payments */}
        <div className="flex flex-col-reverse items-center gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="w-full max-w-[620px] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-br from-indigo-50/70 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 p-6 shadow-xl shadow-indigo-500/5 flex flex-col items-center">
            <Scaled width={1200} height={485} maxScale={0.48}>
              <div className="grid h-[485px] grid-cols-3 gap-6 text-left">
                {demoProviders.map((p) => (
                  <ProviderCard key={p.id} p={p} />
                ))}
              </div>
            </Scaled>
            <div className="mt-4 w-full max-w-[440px]">
              <PaidToast title="INV-1187 paid · $15.50" body="Confirmed by Bakong in 3 seconds · Zero slips to check" />
            </div>
          </div>

          <div className="flex w-full max-w-[500px] flex-col gap-5">
            <span className="self-start rounded-full border border-sky-100 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-700 dark:text-sky-300 uppercase">
              AUTOMATED PAYMENTS
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Get paid in seconds — <br />
              <span className="text-sky-600 dark:text-sky-400">confirmed directly by the bank.</span>
            </h2>
            <p className="text-base font-semibold text-sky-700 dark:text-sky-300">បង់ប្រាក់ — បញ្ជាក់ដោយធនាគារ</p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              The AI sends a dynamic Bakong KHQR or ABA PayWay link directly inside the customer's chat. As soon as the customer
              transfers the money, the bank sends an encrypted webhook to mark the order paid automatically.
            </p>
            <Bullets
              items={[
                "National Bakong KHQR, ABA PayWay, and ACLEDA Toan Chet Pay",
                "No more inspecting fake payment slip screenshots by eye",
                "Inventory deducted immediately with low-stock Telegram alerts",
                "One-click printable official invoices with merchant branding",
              ]}
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supported Banks:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="bakong" size={16} rounded="sm" />
                  <span>Bakong KHQR</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="aba" size={16} rounded="sm" />
                  <span>ABA PayWay</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="acleda" size={16} rounded="sm" />
                  <span>ACLEDA</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="wing" size={16} rounded="sm" />
                  <span>Wing</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spotlight 3: Logistics & Delivery */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex w-full max-w-[500px] flex-col gap-5">
            <span className="self-start rounded-full border border-amber-100 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-amber-700 dark:text-amber-300 uppercase">
              DELIVERY &amp; MARKETING
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Ship in one click. <br />
              <span className="text-amber-600 dark:text-amber-400">Re-engage buyers with zero ad spend.</span>
            </h2>
            <p className="text-base font-semibold text-amber-700 dark:text-amber-300">ដឹកជញ្ជូន និងផ្សព្វផ្សាយឡើងវិញ</p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              Verified orders sync directly to J&amp;T Express, Virak Buntham, or Grab without typing phone numbers twice. Then
              bring past customers back with personalized AI broadcast campaigns that cost $0.
            </p>
            <Bullets
              items={[
                "Instant courier booking with printable QR delivery slip",
                "VIP tags, order histories, and automated customer loyalty points",
                "Smart broadcasts sent straight to previous chat threads on Telegram & Messenger",
              ]}
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Integrated Couriers:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="jnt" size={16} rounded="sm" />
                  <span>J&amp;T Express</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="vet" size={16} rounded="sm" />
                  <span>Virak Buntham</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
                  <BrandLogo brand="grab" size={16} rounded="sm" />
                  <span>GrabExpress</span>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[620px] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-br from-amber-50/50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 p-6 shadow-xl shadow-amber-500/5 flex justify-center">
            <Scaled width={420} height={580} maxScale={0.85} clip={false} className="text-left">
              <SendToDelivery order={demoDeliveryOrder} fees={{ phnom_penh: 1.5, province: 2, grab: 2.8 }} />
            </Scaled>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ how it works

function HowItWorks() {
  const steps = [
    {
      time: "⏱ 5 minutes",
      step: "01",
      icon: Zap,
      title: "Connect your social channels",
      body: "Scan a QR code for Telegram and log in with Facebook for Messenger & Instagram. Connect TikTok Live in one click.",
      channels: true,
    },
    {
      time: "⏱ 15 minutes",
      step: "02",
      icon: Bot,
      title: "Teach the AI your shop catalog",
      body: "Import your price list from Excel and upload your guides (skin types, sizes, delivery zones, FAQs). The AI learns instantly.",
      channels: false,
    },
    {
      time: "⏱ Everyday",
      step: "03",
      icon: TrendingUp,
      title: "Let AI sell & close 24/7",
      body: "AI answers customer queries, generates KHQR codes, the bank auto-confirms payment, and you print shipping slips. Your staff only step in when needed.",
      channels: false,
    },
  ];

  return (
    <section id="how" className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070b16] py-20 sm:py-28 transition-colors">
      <Container className="flex flex-col gap-12 sm:gap-16">
        <Heading
          eyebrow="GO LIVE IN 1 DAY"
          title="Start selling with AI in 3 simple steps"
          km="ងាយស្រួលដំឡើង — ចាប់ផ្តើមលក់បានក្នុងរយៈពេល ១ ថ្ងៃ"
          sub="No coding or technical skills required. If you know how to scan a QR code, you can launch Chhlat AI for your business today."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 p-7 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg dark:shadow-slate-950/40 backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-xs transition-transform duration-300 group-hover:scale-110">
                        {s.step}
                      </span>
                      <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {s.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
                </div>

                {s.channels && (
                  <div className="mt-6 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Supports:</span>
                    <div className="flex items-center gap-1.5">
                      <BrandLogo brand="telegram" size={24} rounded="full" />
                      <BrandLogo brand="facebook" size={24} rounded="full" />
                      <BrandLogo brand="instagram" size={24} rounded="full" />
                      <BrandLogo brand="tiktok" size={24} rounded="full" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ pricing

const PLANS = [
  {
    name: "Free",
    sub: "Ideal for testing AI automation",
    price: 0,
    cta: "Start free",
    to: "/register?plan=free",
    featured: false,
    features: [
      "1 channel (Telegram)",
      "500 AI replies / month",
      "1 staff seat",
      "Unified inbox & live chat",
      "Bakong KHQR payment links",
      "Email & community support",
    ],
  },
  {
    name: "Pro",
    sub: "Best for growing online shops",
    price: 29,
    cta: "Start 14-day free trial",
    to: "/register?plan=pro",
    featured: true,
    features: [
      "All 4 channels (Telegram, FB, IG, TikTok)",
      "10,000 AI replies / month",
      "5 staff seats with role controls",
      "Bakong KHQR, ABA PayWay & ACLEDA",
      "AI marketing broadcasts (0 ad cost)",
      "Automated stock alerts & VIP loyalty tags",
      "Priority Telegram support",
    ],
  },
  {
    name: "Enterprise",
    sub: "For multi-branch retail brands",
    price: 99,
    cta: "Talk to sales",
    to: "https://t.me/chhlat_support",
    featured: false,
    features: [
      "Unlimited connected channels",
      "100,000 AI replies / month",
      "Unlimited staff seats & branch stores",
      "Delivery API (J&T, Virak Buntham, Grab)",
      "TikTok Live automated ordering",
      "Dedicated account manager on Telegram",
      "Custom SLA & private onboarding",
    ],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white dark:bg-[#030712] transition-colors">
      <Container className="flex flex-col items-center gap-12 sm:gap-16">
        <Heading
          eyebrow="TRANSPARENT PRICING"
          title="Simple, predictable plans. Start free."
          km="តម្លៃសមរម្យ ច្បាស់លាស់ — អាចចាប់ផ្តើមសាកល្បងដោយឥតគិតថ្លៃ"
          sub="Pay monthly in USD by ABA or Bakong KHQR. Upgrade, downgrade, or cancel anytime with no lock-in contract."
        />

        {/* Monthly / Yearly Toggle */}
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-1 shadow-2xs backdrop-blur-sm">
          <button
            onClick={() => setYearly(false)}
            className={clsx(
              "rounded-full px-5 py-2 text-xs font-semibold transition-all sm:text-sm",
              !yearly
                ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Monthly billing
          </button>
          <button
            onClick={() => setYearly(true)}
            className={clsx(
              "flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all sm:text-sm",
              yearly
                ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span>Annual billing</span>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 animate-pulse-subtle">
              Save 20% + 2 mo free
            </span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p) => {
            const price = yearly ? Math.round((p.price * 10) / 12) : p.price;
            const dark = p.featured;
            const Cta = p.to.startsWith("http") ? "a" : Link;

            return (
              <div
                key={p.name}
                className={clsx(
                  "relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 backdrop-blur-sm hover:-translate-y-1.5",
                  dark
                    ? "bg-slate-950 text-white shadow-2xl shadow-indigo-500/25 ring-2 ring-indigo-500 dark:ring-indigo-400 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 hover:shadow-indigo-500/35"
                    : "border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg dark:shadow-slate-950/40"
                )}
              >
                {dark && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_auto] animate-gradient-x px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-indigo-500/30 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{p.name}</span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        dark ? "bg-indigo-900/60 text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {p.name === "Free" ? "Starter" : p.name === "Pro" ? "Best Value" : "Scale"}
                    </span>
                  </div>

                  <p className={clsx("text-sm", dark ? "text-slate-300" : "text-slate-600 dark:text-slate-400")}>{p.sub}</p>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-extrabold tracking-tight">${price}</span>
                    <span className={clsx("text-sm font-medium", dark ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>
                      / month
                      {yearly && p.price > 0 && " (billed annually)"}
                    </span>
                  </div>

                  <Cta
                    to={p.to}
                    href={p.to}
                    className={clsx(
                      "group relative overflow-hidden flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                      dark
                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-400 hover:to-indigo-500 shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30"
                        : "border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {dark && (
                      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    <span>{p.cta}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Cta>

                  <div className={clsx("my-2 h-px", dark ? "bg-slate-800" : "bg-slate-100 dark:bg-slate-800")} />

                  <ul className="flex flex-col gap-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <span
                          className={clsx(
                            "flex size-4.5 shrink-0 items-center justify-center rounded-full p-0.5",
                            dark ? "bg-indigo-500 text-white" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          <Check className="size-3 stroke-[3]" />
                        </span>
                        <span className={dark ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Accepted Local Payment Methods */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pay subscription locally with:</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
              <BrandLogo brand="bakong" size={16} rounded="sm" />
              <span>Bakong KHQR</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
              <BrandLogo brand="aba" size={16} rounded="sm" />
              <span>ABA Bank</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
              <BrandLogo brand="acleda" size={16} rounded="sm" />
              <span>ACLEDA</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold shadow-2xs">
              <BrandLogo brand="wing" size={16} rounded="sm" />
              <span>Wing Bank</span>
            </span>
          </div>
        </div>

        {/* Security & Bank Protection Note */}
        <div className="flex items-center gap-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>No setup fee · No contracts · Your bank merchant credentials remain AES-256 encrypted &amp; isolated</span>
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ testimonials

function Testimonials() {
  const quotes = [
    {
      quote:
        '"The AI answers skincare questions faster and better than new staff — especially at 2 AM. We completely stopped losing nighttime orders."',
      km: "ឥឡូវភ្ញៀវមិនបាច់រង់ចាំទៀតទេ — បិទការលក់ភ្លាមៗ",
      metric: "+38% sales in 2 months",
      initials: "SC",
      color: "bg-indigo-100 text-indigo-700",
      author: "Sreypov C.",
      business: "Glow Skin Cambodia · Skincare Boutique",
      brands: ["telegram", "facebook"],
    },
    {
      quote:
        '"Farmers send photos of sick crops on Telegram. The AI identifies the issue, suggests the right fertilizer, and our team only packs the big orders."',
      km: "កសិករទទួលបានចម្លើយភ្លាមៗ ២៤ ម៉ោង",
      metric: "4 hours saved every day",
      initials: "DS",
      color: "bg-emerald-100 text-emerald-700",
      author: "Dara S.",
      business: "Kasekor Agri Depot · Agriculture Supplies",
      brands: ["telegram"],
    },
    {
      quote:
        '"Payments confirmed by ABA webhook automatically and orders go straight to J&T delivery. No fake slips, no typing delivery addresses."',
      km: "លែងពិនិត្យ slip ដោយភ្នែក — ធនាគារបញ្ជាក់ដោយស្វ័យប្រវត្តិ",
      metric: "0 fake slip losses",
      initials: "VK",
      color: "bg-amber-100 text-amber-700",
      author: "Visal K.",
      business: "Brown Bean Coffee · Specialty Roastery",
      brands: ["aba", "jnt"],
    },
  ];

  return (
    <section id="customers" className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070b16] py-20 sm:py-28 transition-colors">
      <Container className="flex flex-col gap-12 sm:gap-16">
        <Heading
          eyebrow="PROVEN SUCCESS"
          title="Shops across Cambodia sell more with Chhlat AI"
          km="អាជីវកម្មអនឡាញជាច្រើននៅកម្ពុជា ទទួលបានជោគជ័យជាមួយ Chhlat AI"
          sub="Real feedback from Cambodian store owners automating their social messaging, payments, and fulfillment."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.author}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 p-7 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg dark:shadow-slate-950/40 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-3.5">
                <Stars />
                <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-base">
                  {q.quote}
                </blockquote>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 sm:text-sm">{q.km}</p>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="self-start rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {q.metric}
                </span>
                <figcaption className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={clsx(
                        "flex size-10 items-center justify-center rounded-full text-sm font-bold shrink-0",
                        q.color
                      )}
                    >
                      {q.initials}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{q.author}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{q.business}</span>
                    </div>
                  </div>
                  {"brands" in q && q.brands && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {q.brands.map((b) => (
                        <BrandLogo key={b} brand={b} size={20} rounded="md" />
                      ))}
                    </div>
                  )}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ FAQ

const FAQS = [
  {
    q: "Do I need a developer or technical skills to set it up?",
    a: "No technical knowledge is needed. Connect Telegram by scanning a QR code and Facebook/Instagram by logging into your Meta account. Import your products directly from an Excel spreadsheet and you are live the exact same day.",
  },
  {
    q: "Does the AI really speak natural Khmer?",
    a: "Yes. Chhlat AI is natively optimized for Cambodian social commerce. It understands everyday Khmer slang, numbers, English, and Romanized Khmer (Khmerish). It automatically mirrors whatever language the buyer uses.",
  },
  {
    q: "Which banks and payment gateways are supported?",
    a: "Chhlat AI supports National Bakong KHQR (payable from any Cambodian banking app), ABA PayWay, and ACLEDA Toan Chet Pay. When a customer pays, the bank webhook confirms the transaction in under 3 seconds and marks the order paid.",
    banks: ["bakong", "aba", "acleda", "wing"],
  },
  {
    q: "What happens if the AI encounters an unknown question?",
    a: "The AI strictly quotes products, prices, and policies from your shop catalog. When an inquiry falls outside its knowledge or a customer appears frustrated, it tags the chat [Wait Staff] and notifies your human team immediately. You can take over in 1 click.",
  },
  {
    q: "Are my shop data and bank credentials secure?",
    a: "Yes. Every shop's data is strictly partitioned. Payment API tokens and merchant secrets are encrypted with AES-256 and accessible only to the Shop Owner. They are never exposed to staff or AI prompts.",
  },
  {
    q: "Can I cancel or change plans anytime?",
    a: "Yes. There are no contracts, commitments, or cancellation fees. You can upgrade, downgrade to the Free tier, or cancel directly from your Shop Owner Settings at any time.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white dark:bg-[#030712] transition-colors">
      <Container className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        {/* Left Intro Card */}
        <div className="flex flex-col items-start gap-4 lg:w-[380px] lg:shrink-0">
          <span className="rounded-full border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Have questions about integrations, security, or pricing? Our team replies in Khmer or English within minutes.
          </p>

          <a
            href="https://t.me/chhlat_support"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <BrandLogo brand="telegram" size={20} rounded="full" />
            <span>Chat on Telegram: @chhlat_support</span>
          </a>
        </div>

        {/* Right Accordion */}
        <div className="flex flex-1 flex-col gap-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={clsx(
                  "overflow-hidden rounded-xl border transition-all",
                  isOpen
                    ? "border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-2xs"
                    : "border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/50"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold text-slate-900 dark:text-white sm:text-base"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={clsx(
                      "size-5 shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                      isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-indigo-100/60 dark:border-indigo-900/50 pt-3">
                    <p>{item.a}</p>
                    {"banks" in item && item.banks && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supported Cambodian Gateways:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold shadow-2xs">
                            <BrandLogo brand="bakong" size={15} rounded="sm" />
                            <span>Bakong KHQR</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold shadow-2xs">
                            <BrandLogo brand="aba" size={15} rounded="sm" />
                            <span>ABA PayWay</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold shadow-2xs">
                            <BrandLogo brand="acleda" size={15} rounded="sm" />
                            <span>ACLEDA</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold shadow-2xs">
                            <BrandLogo brand="wing" size={15} rounded="sm" />
                            <span>Wing</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ------------------------------------------------------------------ final cta

function FinalCta() {
  return (
    <Container>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-500/20 dark:shadow-[0_0_80px_-20px_rgba(99,102,241,0.35)] border border-transparent dark:border-indigo-500/20 sm:px-16 sm:py-20">
        {/* Ambient decorative elements */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[350px] w-[500px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl animate-aurora-drift" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[350px] w-[500px] translate-x-1/2 rounded-full bg-violet-400/15 blur-3xl animate-aurora-drift-2" />

        <div className="relative mx-auto flex max-w-[720px] flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 backdrop-blur-md shadow-xs">
            <BrandLogo brand="telegram" size={22} rounded="full" />
            <BrandLogo brand="facebook" size={22} rounded="full" />
            <BrandLogo brand="instagram" size={22} rounded="full" />
            <BrandLogo brand="tiktok" size={22} rounded="full" />
            <span className="ml-1 text-xs font-semibold text-white/90">Instant Multi-Channel Support</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.15]">
            Your next 100 orders are <br />
            waiting in your social inbox
          </h2>

          <p className="text-base font-semibold text-indigo-200 sm:text-xl">
            ចាប់ផ្តើមលក់ជាមួយ Chhlat AI ថ្ងៃនេះ — ឥតគិតថ្លៃ មិនត្រូវការកាត
          </p>

          <p className="text-sm leading-relaxed text-white/80 sm:text-base">
            Join hundreds of forward-thinking Cambodian merchants automating social sales, bank KHQR reconciliations, and
            logistics dispatch today.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3.5">
            <Link
              to="/register"
              className="group relative overflow-hidden flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 shadow-md transition-all duration-200 hover:bg-slate-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
              <Sparkles className="size-4 text-indigo-600 animate-pulse" />
              <span>Start free — no card needed</span>
              <ArrowRight className="size-4 text-slate-600 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="https://t.me/chhlat_support"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50"
            >
              <BrandLogo brand="telegram" size={20} rounded="full" />
              <span>Talk to our team on Telegram</span>
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}

// ------------------------------------------------------------------ footer

function Footer() {
  const cols = [
    {
      title: "PRODUCT",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Bank KHQR", href: "#features" },
        { label: "Integrations", href: "#features" },
        { label: "Staff Panel", href: "/login" },
      ],
    },
    {
      title: "COMPANY",
      links: [
        { label: "About us", href: "#" },
        { label: "Customer Stories", href: "#customers" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "https://t.me/chhlat_support" },
      ],
    },
    {
      title: "RESOURCES",
      links: [
        { label: "Help Center", href: "#faq" },
        { label: "API Docs", href: "/api/docs" },
        { label: "System Status", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-950 py-16 text-slate-400">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          {/* Brand info */}
          <div className="flex flex-col gap-4 lg:w-[380px]">
            <Link to="/" className="inline-flex self-start items-center transition-opacity hover:opacity-90">
              <img src="/logocllhatAI-dark.svg" alt="Chhlat AI" className="h-8 sm:h-9 w-auto object-contain" />
            </Link>

            <p className="text-sm leading-relaxed text-slate-400">
              The intelligent AI social commerce CRM built for Cambodian online merchants. Automated 24/7 replies, instant
              Bakong KHQR reconciliations, and one-click parcel dispatch.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <BrandLogo brand="telegram" size={24} rounded="full" />
              <BrandLogo brand="facebook" size={24} rounded="full" />
              <BrandLogo brand="instagram" size={24} rounded="full" />
              <BrandLogo brand="tiktok" size={24} rounded="full" />
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational · 99.98% Uptime</span>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">{col.title}</span>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar with payment badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-8 text-xs text-slate-500">
          <span>© 2026 Chhlat AI (Cambodia) Co., Ltd. All rights reserved.</span>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Gateways:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="bakong" size={15} rounded="sm" />
                  <span>Bakong KHQR</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="aba" size={15} rounded="sm" />
                  <span>ABA PayWay</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="acleda" size={15} rounded="sm" />
                  <span>ACLEDA</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="wing" size={15} rounded="sm" />
                  <span>Wing</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Logistics:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="jnt" size={15} rounded="sm" />
                  <span>J&amp;T</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="vet" size={15} rounded="sm" />
                  <span>Virak Buntham</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 border border-slate-800 shadow-2xs">
                  <BrandLogo brand="grab" size={15} rounded="sm" />
                  <span>Grab</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
