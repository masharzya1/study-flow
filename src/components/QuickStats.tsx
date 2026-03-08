import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: string;
}

export function QuickStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.04 }}
          className="glass-card p-4 hover-lift cursor-default"
        >
          <stat.icon className="w-4 h-4 text-muted-foreground mb-3" strokeWidth={1.8} />
          <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label} · {stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
