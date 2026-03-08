import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { BookOpen, Clock, Flame, Target, TrendingUp, Plus } from "lucide-react";
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
    { label: "Completed", value: `${completedTopics}`, sub: `/ ${totalTopics.length} topics`, icon: Target, color: "success" },
    { label: "Subjects", value: `${state.subjects.length}`, sub: "active", icon: BookOpen, color: "chart-2" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
        </h1>
        <p className="text-muted-foreground">
          {streak > 0
            ? `You're on a ${streak}-day streak! Keep it up.`
            : "Start studying today to build your streak!"}
        </p>
      </motion.div>

      {/* Daily Progress Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 flex items-center gap-6"
      >
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
            <circle
              cx="40" cy="40" r="34"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-display">
            {progress}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Daily Goal Progress</p>
          <p className="text-2xl font-display font-bold">{todayMinutes} minutes studied</p>
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        <button
          onClick={() => navigate("/timer")}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium hover-lift"
        >
          <TrendingUp className="w-4 h-4" /> Start Focus
        </button>
      </motion.div>

      {/* Stats Grid */}
      <QuickStats stats={stats} />

      {/* Subject Progress + Today Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasks />
        <SubjectCards />
      </div>

      {/* Heatmap */}
      <StudyHeatmap />

      {/* FAB for mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={() => navigate("/timer")}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full gradient-primary text-primary-foreground shadow-lg flex items-center justify-center z-50 animate-pulse-glow"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Dashboard;
