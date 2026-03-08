import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { Clock, Flame, Target, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StudyHeatmap } from "@/components/StudyHeatmap";
import { QuickStats } from "@/components/QuickStats";
import { TodayTasks } from "@/components/TodayTasks";
import { SubjectCards } from "@/components/SubjectCards";

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
    { label: "Today", value: `${todayMinutes}m`, sub: `/ ${dailyGoal}m goal`, icon: Clock, color: "primary" },
    { label: "Streak", value: `${streak}`, sub: streak === 1 ? "day" : "days", icon: Flame, color: "streak" },
    { label: "Done", value: `${completedTopics}`, sub: `/ ${totalTopics.length}`, icon: Target, color: "success" },
    { label: "Subjects", value: `${state.subjects.length}`, sub: "active", icon: BookOpen, color: "chart-2" },
  ];

  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-8 pb-28 md:pb-8">
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

      {/* Daily Progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 flex items-center gap-5"
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
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
        <button
          onClick={() => navigate("/timer")}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover-lift"
        >
          Start Focus <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Stats */}
      <QuickStats stats={stats} />

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
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-foreground text-primary-foreground shadow-lg flex items-center justify-center z-50"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default Dashboard;
