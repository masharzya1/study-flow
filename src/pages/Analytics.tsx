import { useStudy } from "@/contexts/StudyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Clock, BarChart3, TrendingUp, Target, Flame, ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SubjectIcon } from "@/components/SubjectIcon";

const Analytics = () => {
  const { state, getStreak } = useStudy();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const streak = getStreak();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const weekSessions = state.sessions.filter(s => s.completed && new Date(s.startTime) >= weekAgo);
    const monthSessions = state.sessions.filter(s => s.completed && new Date(s.startTime) >= monthAgo);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const dailyData: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en", { weekday: "short" });
      const mins = weekSessions.filter(s => s.startTime.startsWith(dateStr)).reduce((sum, s) => sum + s.durationMinutes, 0);
      dailyData.push({ day: dayName, minutes: mins });
    }
    const maxDaily = Math.max(...dailyData.map(d => d.minutes), 1);
    const last30Days = new Set<string>();
    monthSessions.forEach(s => last30Days.add(s.startTime.split("T")[0]));
    const consistencyScore = Math.round((last30Days.size / 30) * 100);
    const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics));
    const completedTopics = allTopics.filter(t => t.completed).length;
    return { weekMinutes, dailyData, maxDaily, consistencyScore, completedTopics, totalTopics: allTopics.length };
  }, [state.sessions, state.subjects]);

  const focusStats = useMemo(() => {
    const focusSessions = state.sessions.filter(s => s.completed && s.type === "focus" && s.focusScore !== undefined);
    if (focusSessions.length === 0) return null;
    const avgScore = Math.round(focusSessions.reduce((sum, s) => sum + (s.focusScore ?? 0), 0) / focusSessions.length);
    const totalDistractions = focusSessions.reduce((sum, s) => sum + (s.distractionCount ?? 0), 0);
    let bestStreak = 0;
    let currentStreak = 0;
    focusSessions.forEach(s => {
      if (s.focusScore === 100) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
      else { currentStreak = 0; }
    });
    const last7 = focusSessions.slice(-7).map(s => ({
      score: s.focusScore ?? 0,
      date: new Date(s.startTime).toLocaleDateString("en", { weekday: "short" }),
    }));
    return { avgScore, totalDistractions, bestStreak, last7, totalSessions: focusSessions.length };
  }, [state.sessions]);

  const planStats = useMemo(() => {
    const activePlans = state.studyPlans.filter(p => new Date(p.examDate) >= new Date());
    const totalTasks = activePlans.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = activePlans.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
    return { activePlans: activePlans.length, totalTasks, completedTasks };
  }, [state.studyPlans]);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">{t("analytics.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("analytics.subtitle")}</p>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("analytics.thisWeek"), value: `${Math.round(stats.weekMinutes / 60 * 10) / 10}h`, icon: Clock, action: () => navigate("/calendar") },
          { label: t("analytics.streak"), value: `${streak}d`, icon: Flame, action: () => {} },
          { label: t("analytics.consistency"), value: `${stats.consistencyScore}%`, icon: TrendingUp, action: () => {} },
          { label: t("analytics.topicsDone"), value: `${stats.completedTopics}/${stats.totalTopics}`, icon: Target, action: () => navigate("/subjects") },
        ].map((stat, i) => (
          <motion.button key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={stat.action} className="glass-card p-4 text-left hover-lift">
            <stat.icon className="w-4 h-4 text-muted-foreground mb-3" strokeWidth={1.8} />
            <p className="stat-value">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
        <h2 className="section-header mb-5">{t("analytics.weeklyHours")}</h2>
        <div className="flex items-end gap-2 h-36">
          {stats.dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.minutes > 0 ? `${d.minutes}m` : ""}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.minutes / stats.maxDaily) * 100, 3)}%` }} transition={{ delay: 0.2 + i * 0.04, duration: 0.5 }} className="w-full rounded-lg bg-foreground/80 min-h-[3px]" />
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </motion.div>
      {planStats.activePlans > 0 && (
        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} onClick={() => navigate("/plan")} className="glass-card p-5 w-full text-left hover-lift">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-header">{t("analytics.studyPlans")}</h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span>{planStats.activePlans} {t("analytics.active")}</span><ArrowRight className="w-3 h-3" /></div>
          </div>
          <div className="flex items-center gap-4">
            <div><p className="stat-value">{planStats.completedTasks}/{planStats.totalTasks}</p><p className="text-[10px] text-muted-foreground mt-0.5">{t("analytics.tasksCompleted")}</p></div>
            <div className="flex-1"><div className="h-2 rounded-full bg-secondary overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${planStats.totalTasks > 0 ? (planStats.completedTasks / planStats.totalTasks) * 100 : 0}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full rounded-full bg-accent" /></div></div>
          </div>
        </motion.button>
      )}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h2 className="section-header mb-4">{t("analytics.subjectProgress")}</h2>
        {state.subjects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{t("analytics.addSubjects")}</p>
            <button onClick={() => navigate("/subjects")} className="text-xs text-accent hover:underline mt-1">{t("analytics.goToSubjects")}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {state.subjects.map(subject => {
              const allTopics = subject.chapters.flatMap(c => c.topics);
              const completed = allTopics.filter(t => t.completed).length;
              const total = allTopics.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <button key={subject.id} onClick={() => navigate("/subjects")} className="w-full space-y-1.5 text-left hover:opacity-80 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><SubjectIcon name={subject.icon} className="w-3.5 h-3.5 text-muted-foreground" /> {subject.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{completed}/{total} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full rounded-full" style={{ backgroundColor: `hsl(${subject.color})` }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
      {/* Focus Quality */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-card p-5">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" /> {t("focus.focusQuality")}
        </h2>
        {focusStats ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold" data-testid="text-avg-focus-score" style={{
                  color: focusStats.avgScore >= 80 ? "hsl(152 60% 42%)" : focusStats.avgScore >= 50 ? "hsl(45 93% 58%)" : "hsl(0 70% 60%)",
                }}>{focusStats.avgScore}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("focus.avgScore")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{focusStats.bestStreak}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("focus.perfectStreak")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{focusStats.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("focus.sessions")}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{t("focus.scoreLabel")}</p>
              <div className="flex items-end gap-1.5 h-20">
                {focusStats.last7.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(s.score, 5)}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      className="w-full rounded-md min-h-[3px]"
                      style={{
                        backgroundColor: s.score === 100 ? "hsl(152 60% 42%)" : s.score >= 70 ? "hsl(45 93% 58%)" : "hsl(0 70% 60%)",
                      }}
                    />
                    <span className="text-[9px] text-muted-foreground">{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t("focus.noData")}</p>
        )}
      </motion.div>

      {stats.weekMinutes > 25 * 60 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border-accent/40">
          <h2 className="font-semibold text-sm text-accent mb-1">{t("analytics.burnoutAlert")}</h2>
          <p className="text-sm text-muted-foreground">{t("analytics.burnoutMsg")}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
