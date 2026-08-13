import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  TrendingUp,
  Bot,
  Wallet,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  Check,
  Plus,
  Menu,
  ChevronDown,
  Star,
  PieChart,
  LineChart,
  Target,
  Zap,
  Globe,
  Users,
  BarChart3,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import FinexaLogo from "../components/FinexaLogo";
import FeatureCard from "../components/FeatureCard";
import ThemeToggleButton from "../components/ThemeToggleButton";

gsap.registerPlugin(ScrollTrigger);

/* ---------- Reusable highlight helpers ---------- */
const SectionBadge = ({ icon, children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-bg border border-accent/20 text-accent text-sm font-semibold mb-6">
    {icon}
    {children}
  </div>
);

const SectionHeading = ({ children }) => (
  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">
    {children}
  </h2>
);

const SectionSub = ({ children }) => (
  <p className="text-lg text-text-secondary max-w-2xl mx-auto">{children}</p>
);

/* ---------- Animated counter ---------- */
const useCountUp = (target, duration = 3000, delay = 0) => {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration: duration / 1000,
      delay: delay / 1000,
      ease: "power1.inOut",
      onUpdate: () => setValue(Math.round(obj.val)),
    });
    return () => tween.kill();
  }, [target, duration, delay]);

  return { ref, value };
};

const Stat = ({ value, suffix, prefix, label, decimals = 0, delay = 0 }) => {
  const { ref, value: current } = useCountUp(value, 3000, delay);
  return (
    <div ref={ref} className="text-center">
      <div className="stat-number text-4xl md:text-5xl font-bold text-text-primary">
        {prefix}
        {current.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-text-secondary">{label}</div>
    </div>
  );
};

/* ---------- Navbar ---------- */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-xl border-b border-border-color shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo: horizontal on larger screens, icon-only on ≤511px */}
        <div className="flex items-center">
          <div className="max-[511px]:hidden">
            <FinexaLogo variant="horizontal" size={72} />
          </div>
          <div className="hidden max-[511px]:block">
            <FinexaLogo variant="icon" size={40} />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-text-secondary hover:text-text-primary transition-colors duration-300 text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          <Link
            to="/login"
            className="hidden sm:inline-flex text-text-secondary hover:text-text-primary transition-colors duration-300 text-sm font-medium"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-accent-hover transition-all duration-300 shadow-lg shadow-accent/20 max-[511px]:px-4 max-[511px]:py-2 max-[511px]:text-xs"
          >
            Sign Up
            <ArrowRight size={16} />
          </Link>
          <button
            className="lg:hidden text-text-primary p-1 rounded-lg hover:bg-surface-alt transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? (
              <Plus size={24} className="rotate-45" />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="lg:hidden bg-surface border-t border-border-color px-6 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-text-secondary hover:text-text-primary transition py-1"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="block text-text-secondary hover:text-text-primary transition py-1"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="block text-text-secondary hover:text-text-primary transition py-1"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
};

/* ---------- Professional Dashboard Mockup ---------- */
const DashboardMock = () => {
  const areaPath =
    "M0,70 C20,60 40,68 60,50 C80,34 100,52 120,40 C140,30 160,42 180,28 C200,16 220,34 240,20 C260,10 280,22 300,14";
  const areaFill =
    "M0,70 C20,60 40,68 60,50 C80,34 100,52 120,40 C140,30 160,42 180,28 C200,16 220,34 240,20 C260,10 280,22 300,14 L300,80 L0,80 Z";

  return (
    <div className="relative text-left">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-color bg-surface-alt/60 rounded-t-2xl">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <div className="ml-4 flex-1 max-w-xs px-4 py-1.5 rounded-lg bg-surface border border-border-color text-xs text-text-secondary">
          app.Finexa.finance/dashboard
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[64px_1fr] md:grid-cols-[180px_1fr]">
        {/* Sidebar */}
        <div className="border-r border-border-color bg-surface-alt/40 p-3 md:p-4 space-y-1.5">
          {[
            { label: "Dashboard", active: true, icon: "▦" },
            { label: "Transactions", icon: "⇄" },
            { label: "Budgets", icon: "◎" },
            { label: "Cards", icon: "▣" },
            { label: "Insights", icon: "✦" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                item.active ? "bg-accent text-white" : "text-text-secondary"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="p-4 md:p-6 space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-alt border border-border-color">
              <div className="text-[10px] text-text-secondary mb-1">
                Balance
              </div>
              <div className="text-sm md:text-base font-bold text-text-primary">
                $12,547
              </div>
              <div className="text-[10px] font-semibold text-emerald-500">
                ↑ 8.2%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border-color">
              <div className="text-[10px] text-text-secondary mb-1">Income</div>
              <div className="text-sm md:text-base font-bold text-emerald-500">
                $6,300
              </div>
              <div className="text-[10px] text-text-secondary">this month</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border-color">
              <div className="text-[10px] text-text-secondary mb-1">
                Expenses
              </div>
              <div className="text-sm md:text-base font-bold text-amber-500">
                $2,400
              </div>
              <div className="text-[10px] text-text-secondary">this month</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-alt border border-border-color">
              <div className="text-[10px] text-text-secondary mb-1">
                Savings
              </div>
              <div className="text-sm md:text-base font-bold text-accent">
                $3,936
              </div>
              <div className="text-[10px] text-text-secondary">65% goal</div>
            </div>
          </div>

          {/* Chart + donut */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 p-4 rounded-xl bg-surface-alt border border-border-color">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-text-primary">
                  Cash Flow
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={11} /> +12.4%
                </div>
              </div>
              <svg viewBox="0 0 300 80" className="w-full h-24">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path d={areaFill} fill="url(#areaGrad)" />
                <path
                  d={areaPath}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="14" r="4" fill="var(--accent)" />
              </svg>
            </div>
            <div className="p-4 rounded-xl bg-surface-alt border border-border-color">
              <div className="text-xs font-semibold text-text-primary mb-3">
                Categories
              </div>
              <div className="relative h-20 w-20 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="6"
                    strokeDasharray="35 88"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="6"
                    strokeDasharray="22 88"
                    strokeDashoffset="-37"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="6"
                    strokeDasharray="16 88"
                    strokeDashoffset="-61"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  { name: "Food", value: "$320", color: "bg-blue-500" },
                  { name: "Rent", value: "$1.8k", color: "bg-amber-500" },
                  { name: "Travel", value: "$240", color: "bg-emerald-500" },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
                      <span className="text-text-secondary">{c.name}</span>
                    </div>
                    <span className="font-semibold text-text-primary">
                      {c.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="p-4 rounded-xl bg-surface-alt border border-border-color">
            <div className="text-xs font-semibold text-text-primary mb-3">
              Recent Transactions
            </div>
            <div className="space-y-2">
              {[
                {
                  name: "Whole Foods",
                  amount: "-$87.00",
                  color: "bg-blue-500/10 text-blue-500",
                  icon: "🛒",
                },
                {
                  name: "Starbucks",
                  amount: "-$6.45",
                  color: "bg-amber-500/10 text-amber-500",
                  icon: "☕",
                },
                {
                  name: "Salary",
                  amount: "+$5,500",
                  color: "bg-emerald-500/10 text-emerald-500",
                  icon: "💼",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-lg ${t.color} flex items-center justify-center text-xs`}
                    >
                      {t.icon}
                    </div>
                    <span className="text-xs font-medium text-text-primary">
                      {t.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      t.amount.startsWith("+")
                        ? "text-emerald-500"
                        : "text-text-secondary"
                    }`}
                  >
                    {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Hero ---------- */
const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".hero-badge",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
      )
        .fromTo(
          ".hero-word",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.8 },
          "-=0.2",
        )
        .fromTo(
          ".hero-sub",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.4",
        )
        .fromTo(
          ".hero-cta",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.15, duration: 0.6 },
          "-=0.4",
        )
        .fromTo(
          ".hero-stats",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.3",
        )
        .fromTo(
          ".hero-mock",
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1 },
          "-=0.3",
        );

      // Reveal floating ornaments as the user scrolls into the mock
      gsap.fromTo(
        ".hero-notif",
        { x: -60, opacity: 0, rotate: -4 },
        {
          x: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
      gsap.fromTo(
        ".hero-insight",
        { x: 60, opacity: 0, rotate: 4 },
        {
          x: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
      gsap.fromTo(
        ".hero-goal",
        { y: -50, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
      // Grow the goal progress bar
      gsap.fromTo(
        ".hero-goal-fill",
        { width: "0%" },
        {
          width: "65%",
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
      // Fade in the glow ring
      gsap.fromTo(
        ".hero-glow-ring",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
      // Stagger in the orbiting particles
      gsap.fromTo(
        ".hero-particle",
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: ".hero-mock",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative pt-36 pb-20 overflow-hidden text-center"
    >
      {/* Background mesh */}
      <div className="absolute inset-0 landing-mesh -z-10" />
      <div className="aurora-blob h-96 w-96 bg-accent/30 top-10 -left-20" />
      <div
        className="aurora-blob h-80 w-80 bg-cyan-400/20 bottom-0 -right-10"
        style={{ animationDelay: "-4s" }}
      />

      <div className="container mx-auto px-6 relative">
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-bg border border-accent/20 text-accent text-sm font-semibold mb-8">
          <Sparkles size={16} />
          Invest in your financial future
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-text-primary max-w-4xl mx-auto">
          {"Financial Clarity, Redefined.".split(" ").map((word, i) => (
            <span key={i} className="hero-word inline-block mr-3">
              {i === 2 ? (
                <span className="bg-gradient-to-r from-[#0F3D91] via-[#1D6CF2] to-[#27D7F8] bg-clip-text text-transparent">
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
          ))}
        </h1>

        <p className="hero-sub text-lg md:text-xl text-text-secondary mt-6 max-w-2xl mx-auto leading-relaxed">
          Finexa is your all-in-one platform for intelligent wealth management.
          Track, budget, and grow your finances with unparalleled ease and
          precision.
        </p>

        <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-accent text-white font-semibold py-4 px-10 rounded-xl transition-all duration-300 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-[1.02]"
          >
            Start Your Journey
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 border border-border-color text-text-primary font-semibold py-4 px-10 rounded-xl hover:bg-surface-alt transition-all duration-300"
          >
            Explore Features
          </a>
        </div>

        {/* Stats — count up on load, visible without scrolling */}
        <div className="hero-stats mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value={50} suffix="k+" label="Active users" delay={1200} />
          <Stat
            value={120}
            suffix="k+"
            label="Transactions tracked"
            delay={1400}
          />
          <Stat
            value={99.9}
            suffix="%"
            decimals={1}
            label="Uptime guarantee"
            delay={1600}
          />
          <Stat
            value={4.9}
            suffix="/5"
            decimals={1}
            label="Average rating"
            delay={1800}
          />
        </div>

        {/* Floating dashboard mockup */}
        <div className="hero-mock relative mt-20 max-w-5xl mx-auto">
          {/* Animated glow ring behind the mock */}
          <div className="hero-glow-ring absolute inset-0 -m-6 rounded-[2rem] pointer-events-none -z-10" />

          <div className="float-y">
            <div className="gradient-border rounded-2xl overflow-hidden shadow-strong">
              <DashboardMock />
            </div>
          </div>

          {/* Floating ornament — live transaction notification */}
          <div className="hero-notif absolute -left-4 md:-left-14 top-12 p-4 rounded-2xl bg-surface border border-border-color shadow-strong">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-500" />
                <span className="hero-ping absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Salary received
                </div>
                <div className="text-[11px] text-emerald-500 font-semibold">
                  +$5,500.00
                </div>
              </div>
            </div>
          </div>

          {/* Floating ornament — smart insight card */}
          <div className="hero-insight absolute -right-4 md:-right-14 bottom-24 p-4 rounded-2xl bg-surface border border-border-color shadow-strong">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-bg flex items-center justify-center">
                <Sparkles size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  AI Insight
                </div>
                <div className="text-[11px] text-text-secondary">
                  You can save $32/mo
                </div>
              </div>
            </div>
          </div>

          {/* Floating ornament — savings progress */}
          <div className="hero-goal absolute -top-8 left-10 p-4 rounded-2xl bg-surface border border-border-color shadow-strong">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <PiggyBank size={18} className="text-amber-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">
                  Vacation goal
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-20 bg-surface-alt rounded-full overflow-hidden">
                    <div className="hero-goal-fill h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                  </div>
                  <span className="text-[11px] font-semibold text-amber-500">
                    65%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Orbiting particles */}
          <div className="hero-particle hero-p1 absolute top-1/4 left-[8%] h-2 w-2 rounded-full bg-accent" />
          <div className="hero-particle hero-p2 absolute top-1/2 right-[6%] h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <div className="hero-particle hero-p3 absolute bottom-1/4 left-[12%] h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <div className="hero-particle hero-p4 absolute top-1/3 right-[10%] h-2 w-2 rounded-full bg-amber-400" />
        </div>
      </div>
    </section>
  );
};

/* ---------- Features ---------- */
const Features = () => (
  <section id="features" className="py-24 md:py-32">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 animated-section">
        <SectionBadge icon={<LayoutGrid size={16} />}>Features</SectionBadge>
        <SectionHeading>Everything You Need, Nothing You Don't</SectionHeading>
        <SectionSub>
          Powerful tools to unify and simplify your financial life.
        </SectionSub>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 feature-grid">
        <FeatureCard
          icon={<LayoutGrid className="text-accent" size={32} />}
          title="Unified Dashboard"
        >
          Connect all your accounts in one place for a complete financial
          overview. From banks to credit cards, see the full picture.
        </FeatureCard>
        <FeatureCard
          icon={<TrendingUp className="text-accent" size={32} />}
          title="Smart Budgeting"
        >
          Create, manage, and stick to your budget effortlessly. Our intuitive
          tools help you stay on track and achieve your goals.
        </FeatureCard>
        <FeatureCard
          icon={<Bot className="text-accent" size={32} />}
          title="AI-Powered Insights"
        >
          Receive personalized insights and recommendations powered by AI.
          Understand your spending habits and uncover new opportunities.
        </FeatureCard>
        <FeatureCard
          icon={<Wallet className="text-accent" size={32} />}
          title="Transaction Management"
        >
          Automatically categorize transactions, add notes, and search with
          ease. Say goodbye to manual data entry.
        </FeatureCard>
        <FeatureCard
          icon={<ShieldCheck className="text-accent" size={32} />}
          title="Bank-Level Security"
        >
          Your data is protected with end-to-end encryption and the latest
          security standards. Your privacy is our priority.
        </FeatureCard>
        <FeatureCard
          icon={<PieChart className="text-accent" size={32} />}
          title="Smart Analytics"
        >
          Visualize your spending with interactive charts and reports. Spot
          trends, set goals, and take control of your money.
        </FeatureCard>
      </div>
    </div>
  </section>
);

/* ---------- How It Works ---------- */
const steps = [
  {
    icon: <PiggyBank size={24} />,
    title: "Create your account",
    desc: "Sign up in minutes and secure your financial data with bank-level encryption.",
  },
  {
    icon: <Wallet size={24} />,
    title: "Connect your accounts",
    desc: "Link your bank accounts, cards, and budgets in one unified dashboard.",
  },
  {
    icon: <Bot size={24} />,
    title: "Get AI insights",
    desc: "Let our AI analyze your spending and recommend smarter financial decisions.",
  },
  {
    icon: <Target size={24} />,
    title: "Grow your wealth",
    desc: "Track your goals, monitor progress, and watch your savings grow over time.",
  },
];

const HowItWorks = () => (
  <section
    id="how"
    className="py-24 md:py-32 bg-surface/50 border-y border-border-color"
  >
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 animated-section">
        <SectionBadge icon={<Zap size={16} />}>How it works</SectionBadge>
        <SectionHeading>Get Started in 4 Simple Steps</SectionHeading>
        <SectionSub>
          From sign-up to financial clarity in just minutes.
        </SectionSub>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="relative text-center p-6 animated-section">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-accent-bg border border-accent/20 text-accent flex items-center justify-center">
              {step.icon}
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-4xl font-bold text-border-hover">
              {i + 1}
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2 mt-4">
              {step.title}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------- Main Component export ---------- */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans antialiased">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
    </div>
  );
}
