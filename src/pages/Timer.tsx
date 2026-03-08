import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, BookOpen, ArrowRight } from "lucide-react";
import { AmbientSounds } from "@/components/AmbientSounds";
import { SubjectIcon } from "@/components/SubjectIcon";
import { useNavigate } from "react-router-dom";
import type { StudySession } from "@/types/study";

const Timer = () => {
  const { state, addSession, updateSettings, incrementSessionsCompleted } = useStudy();
  const { pomodoroFocus, pomodoroBreak } = state.settings;
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const sessionsCompleted = state.todaySessionsDate === today ? state.todaySessionsCompleted : 0;

  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pomodoroFocus * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMin, setFocusMin] = useState(pomodoroFocus);
  const [breakMin, setBreakMin] = useState(pomodoroBreak);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  const totalTime = mode === "focus" ? pomodoroFocus * 60 : pomodoroBreak * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Get suggested topic from today's plan
  const suggestedTopic = useMemo(() => {
    for (const plan of state.studyPlans) {
      const todayTask = plan.tasks.find(t => t.date === today && !t.completed);
      if (todayTask) {
        const subject = state.subjects.find(s => s.id === todayTask.subjectId);
        let topicName = "Topic";
        for (const s of state.subjects) {
          for (const c of s.chapters) {
            const t = c.topics.find(tp => tp.id === todayTask.topicId);
            if (t) { topicName = t.name; break; }
          }
        }
        return {
          topicName,
          subjectName: subject?.name || "",
          subjectColor: subject?.color || "220 15% 25%",
          subjectIcon: subject?.icon || "book-open",
          type: todayTask.type,
          minutes: todayTask.estimatedMinutes,
        };
      }
    }
    return null;
  }, [state.studyPlans, state.subjects, today]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? pomodoroFocus * 60 : pomodoroBreak * 60);
    sessionStartRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, pomodoroFocus, pomodoroBreak]);

  useEffect(() => {
    if (isRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date().toISOString();
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "focus") {
              const session: StudySession = {
                id: crypto.randomUUID(),
                startTime: sessionStartRef.current!,
                endTime: new Date().toISOString(),
                durationMinutes: pomodoroFocus,
                type: "focus",
                completed: true,
              };
              addSession(session);
              incrementSessionsCompleted();
              setMode("break");
              return pomodoroBreak * 60;
            } else {
              setMode("focus");
              return pomodoroFocus * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, pomodoroFocus, pomodoroBreak, addSession]);

  useEffect(() => {
    if (!isRunning) setTimeLeft(mode === "focus" ? pomodoroFocus * 60 : pomodoroBreak * 60);
  }, [mode, pomodoroFocus, pomodoroBreak]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const applySettings = () => {
    updateSettings({ pomodoroFocus: focusMin, pomodoroBreak: breakMin });
    setShowSettings(false);
    reset();
  };

  const circumference = 2 * Math.PI * 120;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-5 pb-28 md:pb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        {/* Suggested Topic Banner */}
        {suggestedTopic && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-3.5 flex items-center gap-3 text-left"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `hsl(${suggestedTopic.subjectColor} / 0.12)` }}
            >
              <SubjectIcon name={suggestedTopic.subjectIcon} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {suggestedTopic.type === "revision" ? "Review" : "Up next"}
              </p>
              <p className="text-sm font-medium truncate">{suggestedTopic.topicName}</p>
              <p className="text-[10px] text-muted-foreground">{suggestedTopic.subjectName} · {suggestedTopic.minutes}m</p>
            </div>
            <button
              onClick={() => navigate("/plan")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-1.5 bg-secondary/80 rounded-2xl p-1.5">
          <button
            onClick={() => { setMode("focus"); setIsRunning(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
              mode === "focus" ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Brain className="w-4 h-4" /> Focus
          </button>
          <button
            onClick={() => { setMode("break"); setIsRunning(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
              mode === "break" ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Coffee className="w-4 h-4" /> Break
          </button>
          <AmbientSounds isPlaying={isRunning} />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-4 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm">Focus (min)</label>
                <input
                  type="number"
                  value={focusMin}
                  onChange={e => setFocusMin(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-20 px-2 py-1.5 text-sm rounded-xl bg-secondary text-foreground text-center border-0 outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">Break (min)</label>
                <input
                  type="number"
                  value={breakMin}
                  onChange={e => setBreakMin(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-20 px-2 py-1.5 text-sm rounded-xl bg-secondary text-foreground text-center border-0 outline-none"
                />
              </div>
              <button onClick={applySettings} className="w-full py-2.5 rounded-xl bg-foreground text-primary-foreground text-sm font-medium">
                Apply
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Circle */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
            <motion.circle
              cx="130" cy="130" r="120"
              stroke={mode === "focus" ? "hsl(var(--foreground))" : "hsl(var(--accent))"}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className={`text-xs mt-2 uppercase tracking-widest ${
              mode === "focus" ? "text-muted-foreground" : "text-accent"
            }`}>
              {mode === "focus" ? "Focus" : "Break"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          <button onClick={reset} className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover-lift">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-full flex items-center justify-center hover-lift shadow-md transition-colors ${
              isRunning ? "bg-destructive text-destructive-foreground" : "bg-foreground text-primary-foreground"
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <div className="w-12 h-12 rounded-full bg-secondary flex flex-col items-center justify-center">
            <span className="text-sm font-bold">{sessionsCompleted}</span>
          </div>
        </div>

        {/* Session Info */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span>{sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} today</span>
          <span>·</span>
          <span>{pomodoroFocus}m focus / {pomodoroBreak}m break</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Timer;
