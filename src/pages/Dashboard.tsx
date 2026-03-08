import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { Clock, Flame, Target, BookOpen, ArrowRight, Sparkles, RotateCcw, AlertTriangle, CalendarDays, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StudyHeatmap } from "@/components/StudyHeatmap";
import { QuickStats } from "@/components/QuickStats";
import { TodayTasks } from "@/components/TodayTasks";
import { SubjectCards } from "@/components/SubjectCards";
import { useMemo } from "react";

const Dashboard = () => {
  const { state, getTodayMinutes, getStreak } = useStudy();
  const navigate = useNavigate();
  const todayMinutes = getTodayMinutes();
  const streak = getStreak();
  const dailyGoal = state.settings.dailyGoalMinutes;
  const progress = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const totalTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics));
  const completedTopics = totalTopics.filter(t => t.completed).length;

  const stats = [
    { label: "Today", value: `${todayMinutes}m`, sub: `/ ${dailyGoal}m`, icon: Clock, color: "primary" },
    { label: "Streak", value: `${streak}`, sub: streak === 1 ? "day" : "days", icon: Flame, color: "streak" },
    { label: "Done", value: `${completedTopics}`, sub: `/ ${totalTopics.length}`, icon: Target, color: "success" },
    { label: "Subjects", value: `${state.subjects.length}`, sub: "active", icon: BookOpen, color: "chart-2" },
  ];

  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  // Revision items due today or overdue
  const revisionDue = useMemo(() => {
    const INTERVALS = [1, 3, 7, 14, 30];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;

    state.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics
          .filter(t => t.completed && t.completedAt)
          .forEach(topic => {
            const completedDate = new Date(topic.completedAt!);
            const revisionsDone = topic.revisionDates.length;
            if (revisionsDone >= INTERVALS.length) return;
            const nextInterval = INTERVALS[Math.min(revisionsDone, INTERVALS.length - 1)];
            const nextReviewDate = new Date(completedDate);
            if (revisionsDone > 0) {
              const lastRevision = new Date(topic.revisionDates[topic.revisionDates.length - 1]);
              nextReviewDate.setTime(lastRevision.getTime() + nextInterval * 86400000);
            } else {
              nextReviewDate.setDate(completedDate.getDate() + nextInterval);
            }
            if (nextReviewDate <= today) count++;
          });
      });
    });
    return count;
  }, [state.subjects]);

  // Next exam
  const nextExam = useMemo(() => {
    const upcoming = state.studyPlans
      .filter(p => new Date(p.examDate) >= new Date())
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    if (upcoming.length === 0) return null;
    const days = Math.ceil((new Date(upcoming[0].examDate).getTime() - Date.now()) / 86400000);
    return { name: upcoming[0].examName, days };
  }, [state.studyPlans]);

  // Today's focus sessions
  const today = new Date().toISOString().split("T")[0];
  const todaySessions = state.todaySessionsDate === today ? state.todaySessionsCompleted : 0;

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6 pb-28 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Good {greeting}
        </h1>
        <p className="text-muted-foreground text-sm">
          {streak > 0
            ? `${streak}-day streak. Keep going.`
            : "Start studying to build your streak."}
        </p>
      </motion.div>

      {/* Daily Progress + Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card-elevated p-5"
      >
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="hsl(var(--border))" strokeWidth="3.5" fill="none" />
              <circle
                cx="32" cy="32" r="28"
                stroke="hsl(var(--foreground))"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {progress}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Daily Progress</p>
            <p className="text-xl font-semibold mt-0.5">{todayMinutes} min</p>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Quick Action Row */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
          <button
            onClick={() => navigate("/timer")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-foreground text-primary-foreground text-xs font-medium hover-lift"
          >
            <Sparkles className="w-3.5 h-3.5" /> Start Focus
          </button>
          {revisionDue > 0 && (
            <button
              onClick={() => navigate("/revision")}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover-lift"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {revisionDue} due
            </button>
          )}
          {nextExam && (
            <button
              onClick={() => navigate("/calendar")}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent/10 text-accent-foreground text-xs font-medium hover-lift"
            >
              <CalendarDays className="w-3.5 h-3.5" /> {nextExam.days}d
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <QuickStats stats={stats} />

      {/* Alerts Row */}
      {(revisionDue > 0 || nextExam) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {revisionDue > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              onClick={() => navigate("/revision")}
              className="glass-card p-4 flex items-center gap-3 hover-lift text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{revisionDue} reviews due</p>
                <p className="text-[10px] text-muted-foreground">Spaced repetition</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
          {nextExam && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              onClick={() => navigate("/calendar")}
              className="glass-card p-4 flex items-center gap-3 hover-lift text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/12 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{nextExam.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextExam.days} days left</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      )}

      {/* Tasks + Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodayTasks />
        <SubjectCards />
      </div>

      {/* Heatmap */}
      <StudyHeatmap />

      {/* Mobile FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        onClick={() => navigate("/timer")}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-foreground text-primary-foreground shadow-lg flex items-center justify-center z-50 active:scale-90 transition-transform"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default Dashboard;
