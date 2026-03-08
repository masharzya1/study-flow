import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Timer, BarChart3, Settings, CalendarDays, Sparkles, RotateCcw, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { HeaderControls } from "@/components/HeaderControls";
import penzoLogo from "@/assets/penzo-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { to: "/", icon: LayoutDashboard, labelKey: "nav.home", tourId: undefined },
    { to: "/subjects", icon: BookOpen, labelKey: "nav.subjects", tourId: "nav-subjects" },
    { to: "/timer", icon: Timer, labelKey: "nav.focus", tourId: "nav-focus" },
    { to: "/plan", icon: Sparkles, labelKey: "nav.plan", tourId: "nav-plan" },
    { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar", tourId: undefined },
    { to: "/revision", icon: RotateCcw, labelKey: "nav.revision", tourId: undefined },
    { to: "/analytics", icon: BarChart3, labelKey: "nav.stats", tourId: "nav-analytics" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings", tourId: undefined },
  ];

  const mobileMainItems = navItems.slice(0, 4);
  const mobileMoreItems = navItems.slice(4);
  const isMoreActive = mobileMoreItems.some(item => item.to === location.pathname);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-40">
        <div className="p-4 lg:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">P</span>
          </div>
            <h1 className="font-semibold text-base hidden lg:block tracking-tight">Penzó</h1>
          </div>
          <div className="hidden lg:flex">
            <HeaderControls />
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-2 lg:px-3 mt-2">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={item.tourId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-foreground text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="hidden lg:block">{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 hidden lg:block">
          <p className="text-[11px] text-muted-foreground">{t("nav.freeOpenSource")}</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-primary-foreground text-[10px] font-bold">P</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Penzó</span>
        </div>
        <HeaderControls compact />
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-16 lg:ml-56">
        {children}
      </main>

      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="md:hidden fixed bottom-[68px] right-3 z-50 glass-card-elevated p-2 min-w-[160px] safe-area-bottom"
            >
              {mobileMoreItems.map(item => {
                const active = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    data-tour={item.tourId}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {mobileMainItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                data-tour={item.tourId}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-[22px] h-[22px] ${active ? "text-foreground" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowMore(prev => !prev)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
              isMoreActive || showMore ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={isMoreActive || showMore ? 2.2 : 1.8} />
            <span>{t("nav.more")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
