import { useStudy } from "@/contexts/StudyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useMemo } from "react";

export function StudyHeatmap() {
  const { getHeatmapData } = useStudy();
  const { t } = useLanguage();
  const heatmap = getHeatmapData();

  const weeks = useMemo(() => {
    const result: { date: string; minutes: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    let currentWeek: { date: string; minutes: number }[] = [];
    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = d.toISOString().split("T")[0];
      currentWeek.push({ date: dateStr, minutes: heatmap[dateStr] || 0 });
      if (currentWeek.length === 7) { result.push(currentWeek); currentWeek = []; }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [heatmap]);

  const getColor = (minutes: number) => {
    if (minutes === 0) return "bg-secondary/60";
    if (minutes < 30) return "bg-foreground/10";
    if (minutes < 60) return "bg-foreground/25";
    if (minutes < 120) return "bg-foreground/45";
    return "bg-foreground/70";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
      <h2 className="section-header mb-4">{t("comp.activity")}</h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-[3px] min-w-[700px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div key={day.date} className={`w-[10px] h-[10px] rounded-[2px] ${getColor(day.minutes)} transition-colors`} title={`${day.date}: ${day.minutes}m`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>{t("comp.less")}</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-secondary/60" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-foreground/10" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-foreground/25" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-foreground/45" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-foreground/70" />
        <span>{t("comp.more")}</span>
      </div>
    </motion.div>
  );
}
