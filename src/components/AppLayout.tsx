import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Timer, BarChart3, Settings, CalendarDays, Sparkles, RotateCcw } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/timer", icon: Timer, label: "Focus" },
  { to: "/plan", icon: Sparkles, label: "Plan" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/revision", icon: RotateCcw, label: "Revision" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-40">
        <div className="p-4 lg:px-5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">SF</span>
          </div>
          <h1 className="font-semibold text-base hidden lg:block tracking-tight">StudyForge</h1>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-2 lg:px-3 mt-2">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-foreground text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 hidden lg:block">
          <p className="text-[11px] text-muted-foreground">Free & Open Source</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-16 lg:ml-56">
        {children}
      </main>

      {/* Mobile Bottom Nav — iOS style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-[22px] h-[22px] ${active ? "text-foreground" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
