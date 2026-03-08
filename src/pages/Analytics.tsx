import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { BarChart3, Clock, TrendingUp, Target } from "lucide-react";
import { useMemo } from "react";

const Analytics = () => {
  const { state } = useStudy();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const weekSessions = state.sessions.filter(s => s.completed && new Date(s.startTime) >= weekAgo);
    const monthSessions = state.sessions.filter(s => s.completed && new Date(s.startTime) >= monthAgo);
    const allSessions = state.sessions.filter(s => s.completed);

    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    // Daily breakdown for the week
    const dailyData: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en", { weekday: "short" });
      const mins = weekSessions.filter(s => s.startTime.startsWith(dateStr)).reduce((sum, s) => sum + s.durationMinutes, 0);
      dailyData.push({ day: dayName, minutes: mins });
    }

    const maxDaily = Math.max(...dailyData.map(d => d.minutes), 1);

    // Subject distribution
    const subjectMinutes: Record<string, number> = {};
    allSessions.forEach(s => {
      if (s.subjectId) {
        subjectMinutes[s.subjectId] = (subjectMinutes[s.subjectId] || 0) + s.durationMinutes;
      }
    });

    // Consistency score
    const last30Days = new Set<string>();
    monthSessions.forEach(s => last30Days.add(s.startTime.split("T")[0]));
    const consistencyScore = Math.round((last30Days.size / 30) * 100);

    // All topics
    const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics));
    const completedTopics = allTopics.filter(t => t.completed).length;

    return {
      weekMinutes,
      monthMinutes,
      totalMinutes,
      totalSessions: allSessions.length,
      dailyData,
      maxDaily,
      consistencyScore,
      completedTopics,
      totalTopics: allTopics.length,
    };
  }, [state.sessions, state.subjects]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Track your study progress and consistency</p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "This Week", value: `${Math.round(stats.weekMinutes / 60 * 10) / 10}h`, icon: Clock },
          { label: "This Month", value: `${Math.round(stats.monthMinutes / 60 * 10) / 10}h`, icon: BarChart3 },
          { label: "Consistency", value: `${stats.consistencyScore}%`, icon: TrendingUp },
          { label: "Topics Done", value: `${stats.completedTopics}/${stats.totalTopics}`, icon: Target },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <stat.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h2 className="font-display font-semibold text-lg mb-4">Weekly Study Hours</h2>
        <div className="flex items-end gap-2 h-40">
          {stats.dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{d.minutes > 0 ? `${d.minutes}m` : ""}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.minutes / stats.maxDaily) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                className="w-full rounded-t-md gradient-primary min-h-[4px]"
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subject Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <h2 className="font-display font-semibold text-lg mb-4">Subject Progress</h2>
        {state.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Add subjects to see progress</p>
        ) : (
          <div className="space-y-4">
            {state.subjects.map(subject => {
              const allTopics = subject.chapters.flatMap(c => c.topics);
              const completed = allTopics.filter(t => t.completed).length;
              const total = allTopics.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={subject.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span>{subject.icon}</span> {subject.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{completed}/{total} topics · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: `hsl(${subject.color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Burnout Detection */}
      {stats.weekMinutes > 25 * 60 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border-warning/30"
        >
          <h2 className="font-display font-semibold text-lg mb-2 text-warning">⚠️ Burnout Alert</h2>
          <p className="text-sm text-muted-foreground">
            You've studied over 25 hours this week. Consider taking a break to maintain long-term productivity.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
