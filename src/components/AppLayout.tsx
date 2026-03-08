import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Timer, BarChart3, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/timer", icon: Timer, label: "Focus" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-card/50 backdrop-blur-xl fixed inset-y-0 left-0 z-40">
        <div className="p-4 lg:px-5">
          <h1 className="font-display font-bold text-lg hidden lg:block gradient-text">StudyForge</h1>
          <span className="lg:hidden text-xl font-display font-bold gradient-text">SF</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2 lg:px-3 mt-4">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 hidden lg:block">
          <p className="text-xs text-muted-foreground">100% Free & Open Source</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-16 lg:ml-56">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
