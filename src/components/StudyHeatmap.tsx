import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { useMemo } from "react";

export function StudyHeatmap() {
  const { getHeatmapData } = useStudy();
  const heatmap = getHeatmapData();

  const weeks = useMemo(() => {
    const result: { date: string; minutes: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: string; minutes: number }[] = [];
    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = d.toISOString().split("T")[0];
      currentWeek.push({ date: dateStr, minutes: heatmap[dateStr] || 0 });
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [heatmap]);

  const getColor = (minutes: number) => {
    if (minutes === 0) return "bg-secondary";
    if (minutes < 30) return "bg-primary/25";
    if (minutes < 60) return "bg-primary/50";
    if (minutes < 120) return "bg-primary/75";
    return "bg-primary";
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <h2 className="font-display font-semibold text-lg mb-4">Study Activity</h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-[3px] min-w-[700px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div
                  key={day.date}
                  className={`w-[11px] h-[11px] rounded-[2px] ${getColor(day.minutes)} transition-colors`}
                  title={`${day.date}: ${day.minutes}m`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-[11px] h-[11px] rounded-[2px] bg-secondary" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/25" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/50" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/75" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </motion.div>
  );
}
