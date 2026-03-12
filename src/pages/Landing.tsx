import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { SiGoogle } from "react-icons/si";
import {
  BookOpen, Timer, BarChart3, Sparkles, RotateCcw, CalendarDays,
  Brain, Target, Flame, Trophy, Bell, Smartphone, ArrowRight,
  ChevronDown, Check, Star, Zap, Shield, CloudOff, Menu, X
} from "lucide-react";
import penzoLogo from "@/assets/penzo-logo.png";
import { useState, useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
  })
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Smart Subjects",
    desc: "Organize your syllabus into subjects, chapters, and topics. Track completion progress visually.",
    color: "from-blue-500/20 to-blue-600/5"
  },
  {
    icon: Sparkles,
    title: "AI Study Plans",
    desc: "Generate personalized study plans based on your exam dates. Daily tasks scheduled automatically.",
    color: "from-violet-500/20 to-violet-600/5"
  },
  {
    icon: Timer,
    title: "Focus Timer",
    desc: "Pomodoro-style focus sessions with ambient sounds. Track distraction count and focus scores.",
    color: "from-green-500/20 to-green-600/5"
  },
  {
    icon: RotateCcw,
    title: "Spaced Repetition",
    desc: "Never forget what you learned. Smart revision reminders based on scientifically proven intervals.",
    color: "from-orange-500/20 to-orange-600/5"
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    desc: "Heatmaps, streaks, session history, focus scores. Understand your study patterns in detail.",
    color: "from-cyan-500/20 to-cyan-600/5"
  },
  {
    icon: CalendarDays,
    title: "Exam Calendar",
    desc: "See all your upcoming exams at a glance. Countdown timers and study plan integration.",
    color: "from-pink-500/20 to-pink-600/5"
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Add Your Subjects", desc: "Create subjects with chapters and topics. Import your syllabus in seconds.", icon: BookOpen },
  { step: "2", title: "Generate a Plan", desc: "Set your exam date and let Penzó create a daily study schedule.", icon: Sparkles },
  { step: "3", title: "Start Studying", desc: "Use the focus timer with ambient sounds. Complete topics and earn XP.", icon: Timer },
  { step: "4", title: "Track & Improve", desc: "Review analytics, maintain your streak, and watch your progress grow.", icon: Trophy },
];

const STATS = [
  { value: "100%", label: "Free Forever" },
  { value: "PWA", label: "Works Offline" },
  { value: "∞", label: "Subjects & Plans" },
  { value: "24/7", label: "Cloud Synced" },
];

export default function Landing() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center overflow-hidden">
              <img src={penzoLogo} alt="Penzó" className="w-5 h-5 object-contain invert dark:invert-0" />
            </div>
            <span className="font-bold text-lg tracking-tight">Penzó</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-features">Features</button>
            <button onClick={() => scrollTo(howRef)} className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-how">How It Works</button>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              data-testid="button-nav-signin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <SiGoogle className="w-3.5 h-3.5" />
              Sign In
            </button>
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            data-testid="button-mobile-menu"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-2"
          >
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">Features</button>
            <button onClick={() => scrollTo(howRef)} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">How It Works</button>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-foreground text-primary-foreground text-sm font-medium"
            >
              <SiGoogle className="w-3.5 h-3.5" />
              {loading ? "Signing in..." : "Sign In with Google"}
            </button>
          </motion.div>
        )}
      </nav>

      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-xs font-medium text-muted-foreground mb-6">
            <Zap className="w-3 h-3 text-accent" />
            Smart Study Companion for Students
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Study Smarter,{" "}
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              Not Harder
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
            Penzó helps you organize subjects, create study plans, track focus sessions, 
            and maintain streaks — all in one beautiful app. Built for students who want to 
            ace their exams.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              data-testid="button-hero-signin"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-foreground text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <SiGoogle className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Get Started — It's Free"}
            </button>
            <button
              onClick={() => scrollTo(featuresRef)}
              data-testid="button-hero-learn"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              Learn More <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>

          {error && (
            <p className="text-xs text-destructive mt-3">{error}</p>
          )}

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={featuresRef} className="py-20 sm:py-28 px-4 sm:px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground mb-4">
              <Star className="w-3 h-3" /> Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              From organizing your syllabus to tracking your progress — Penzó has every tool a student needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-2xl p-6 bg-gradient-to-br ${f.color} border border-border/40 hover:border-border/80 transition-colors`}
              >
                <f.icon className="w-8 h-8 mb-4 text-foreground/80" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Study Streaks</h3>
                  <p className="text-xs text-muted-foreground">Stay consistent, earn rewards</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build a daily study habit with streak tracking. Hit milestone streaks (3, 7, 14, 30 days) 
                and celebrate with animated achievements. Never break the chain!
              </p>
              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <div key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${d <= 5 ? "bg-green-500/15 text-green-500" : "bg-secondary text-muted-foreground"}`}>
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold">XP & Leveling</h3>
                  <p className="text-xs text-muted-foreground">Gamified learning experience</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Earn XP for completing focus sessions and topics. Level up as you study more. 
                A fun gamification system that makes studying feel rewarding.
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold">Level 5</span>
                  <span className="text-muted-foreground">320 / 500 XP</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 w-[64%]" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Spaced Repetition</h3>
                  <p className="text-xs text-muted-foreground">Science-backed revision</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on the Ebbinghaus forgetting curve, Penzó reminds you to revise topics at 
                optimal intervals: Day 1, 3, 7, 14, and 30 after learning.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"].map((d, i) => (
                  <span key={d} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${i < 3 ? "bg-blue-500/10 text-blue-500" : "bg-secondary text-muted-foreground"}`}>
                    {d} {i < 3 && <Check className="w-3 h-3 inline ml-0.5" />}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Works Everywhere</h3>
                  <p className="text-xs text-muted-foreground">PWA — install on any device</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Penzó is a Progressive Web App. Install it on your phone, tablet, or laptop. 
                Works offline, syncs to cloud, and gets push notifications — like a native app.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {[
                  { icon: Bell, label: "Push Notifs" },
                  { icon: CloudOff, label: "Offline Mode" },
                  { icon: Shield, label: "Cloud Sync" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section ref={howRef} className="py-20 sm:py-28 px-4 sm:px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground mb-4">
              <Target className="w-3 h-3" /> How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Get Started in Minutes</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Four simple steps to transform how you study.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="glass-card p-6 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center overflow-hidden mx-auto mb-6 shadow-lg">
              <img src={penzoLogo} alt="Penzó" className="w-10 h-10 object-contain invert dark:invert-0" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to Ace Your Exams?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Join Penzó today — completely free, no credit card needed. Your study data syncs across all devices.
            </p>

            <div className="mt-8 max-w-sm mx-auto">
              {error && (
                <p className="text-xs text-destructive mb-3">{error}</p>
              )}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                data-testid="button-cta-signin"
                className="w-full flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-foreground text-primary-foreground font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <SiGoogle className="w-4 h-4" />
                )}
                {loading ? "Signing in..." : "Start Studying for Free"}
              </button>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Free forever • No ads • No limits
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
              {[
                { icon: Check, text: "Subject & chapter organization" },
                { icon: Check, text: "Auto-generated study plans" },
                { icon: Check, text: "Focus timer with ambient sounds" },
                { icon: Check, text: "Spaced repetition reminders" },
                { icon: Check, text: "XP, levels & streak system" },
                { icon: Check, text: "Cross-device cloud sync" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-left text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-foreground flex items-center justify-center overflow-hidden">
              <img src={penzoLogo} alt="Penzó" className="w-4 h-4 object-contain invert dark:invert-0" />
            </div>
            <span className="font-semibold text-sm">Penzó</span>
            <span className="text-xs text-muted-foreground">— Your Smart Study Companion</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Penzó. Made with ❤️ for students.
          </p>
        </div>
      </footer>
    </div>
  );
}
