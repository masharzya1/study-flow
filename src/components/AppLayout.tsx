import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Timer, BarChart3, Settings, CalendarDays, Sparkles, RotateCcw, MoreHorizontal, FolderOpen, LogOut, Shield, Bell } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFCM } from "@/hooks/useFCM";
import { HeaderControls } from "@/components/HeaderControls";
import penzoLogo from "@/assets/penzo-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const { permission, requestPermission } = useFCM();

  const baseNavItems = [
    { to: "/", icon: LayoutDashboard, labelKey: "nav.home", tourId: undefined },
    { to: "/subjects", icon: BookOpen, labelKey: "nav.subjects", tourId: "nav-subjects" },
    { to: "/timer", icon: Timer, labelKey: "nav.focus", tourId: "nav-focus" },
    { to: "/plan", icon: Sparkles, labelKey: "nav.plan", tourId: "nav-plan" },
    { to: "/calendar", icon: CalendarDays, labelKey: "nav.calendar", tourId: undefined },
    { to: "/revision", icon: RotateCcw, labelKey: "nav.revision", tourId: undefined },
    { to: "/analytics", icon: BarChart3, labelKey: "nav.stats", tourId: "nav-analytics" },
    { to: "/files", icon: FolderOpen, labelKey: "nav.files", tourId: undefined },
    { to: "/settings", icon: Settings, labelKey: "nav.settings", tourId: undefined },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, { to: "/admin", icon: Shield, labelKey: "nav.admin", tourId: undefined }]
    : baseNavItems;

  const mobileMainItems = navItems.slice(0, 4);
  const mobileMoreItems = navItems.slice(4);
  const isMoreActive = mobileMoreItems.some(item => item.to === location.pathname);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-40">
        <div className="p-4 lg:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center overflow-hidden">
              <img src={penzoLogo} alt="Penzó" className="w-5 h-5 object-contain invert dark:invert-0" />
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

        {/* User section at bottom */}
        <div className="p-3 border-t border-border space-y-1">
          {permission === "default" && (
            <button
              onClick={requestPermission}
              data-testid="button-enable-notifications"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-all"
              title={t("notif.enable")}
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:block">{t("notif.enable")}</span>
            </button>
          )}
          {permission === "granted" && (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Bell className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
              <span className="hidden lg:block text-[10px] text-green-500">{t("notif.enabled")}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-1 px-1">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ""} className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-[10px] font-semibold">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className="text-xs font-medium truncate">{user.displayName || user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            data-testid="button-sign-out"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden lg:block">{t("auth.signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center overflow-hidden">
            <img src={penzoLogo} alt="Penzó" className="w-4 h-4 object-contain invert dark:invert-0" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Penzó</span>
        </div>
        <div className="flex items-center gap-2">
          {permission === "default" && (
            <button
              onClick={requestPermission}
              data-testid="button-enable-notifications-mobile"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
              title={t("notif.enable")}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold">{t("notif.enable")}</span>
            </button>
          )}
          <HeaderControls compact />
          {user.photoURL ? (
            <button onClick={logout} data-testid="button-sign-out-mobile" title={t("auth.signOut")}>
              <img src={user.photoURL} alt={user.displayName || ""} className="w-7 h-7 rounded-full" />
            </button>
          ) : (
            <button
              onClick={logout}
              data-testid="button-sign-out-mobile"
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold"
              title={t("auth.signOut")}
            >
              {user.displayName?.[0] || user.email?.[0] || "U"}
            </button>
          )}
        </div>
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
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-all"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>{t("auth.signOut")}</span>
              </button>
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
