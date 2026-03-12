import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: "bg-blue-500/5 border-blue-500/10", text: "text-blue-500", iconBg: "bg-blue-500/12" },
  streak: { bg: "bg-orange-500/5 border-orange-500/10", text: "text-orange-500", iconBg: "bg-orange-500/12" },
  success: { bg: "bg-emerald-500/5 border-emerald-500/10", text: "text-emerald-500", iconBg: "bg-emerald-500/12" },
  "chart-2": { bg: "bg-violet-500/5 border-violet-500/10", text: "text-violet-500", iconBg: "bg-violet-500/12" },
};

export function QuickStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const colors = COLOR_MAP[stat.color] || COLOR_MAP.primary;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className={`rounded-2xl border p-4 ${colors.bg} hover-lift cursor-default`}
          >
            <div className={`w-8 h-8 rounded-xl ${colors.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${colors.text}`} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label} <span className="opacity-60">· {stat.sub}</span></p>
          </motion.div>
        );
      })}
    </div>
  );
}
