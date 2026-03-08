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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className="glass-card p-4 hover-lift cursor-default"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label} · {stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
