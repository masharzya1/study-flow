import { useState, useEffect, useRef, useCallback } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2 } from "lucide-react";
import type { StudySession } from "@/types/study";

const Timer = () => {
  const { state, addSession, updateSettings } = useStudy();
  const { pomodoroFocus, pomodoroBreak } = state.settings;

  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pomodoroFocus * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMin, setFocusMin] = useState(pomodoroFocus);
  const [breakMin, setBreakMin] = useState(pomodoroBreak);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  const totalTime = mode === "focus" ? pomodoroFocus * 60 : pomodoroBreak * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

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
            // Session complete
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
              setSessionsCompleted(p => p + 1);
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

  const circumference = 2 * Math.PI * 140;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => { setMode("focus"); setIsRunning(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "focus" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Brain className="w-4 h-4" /> Focus
          </button>
          <button
            onClick={() => { setMode("break"); setIsRunning(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "break" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Coffee className="w-4 h-4" /> Break
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
                  className="w-20 px-2 py-1 text-sm rounded bg-secondary text-foreground text-center border-0 outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">Break (min)</label>
                <input
                  type="number"
                  value={breakMin}
                  onChange={e => setBreakMin(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-20 px-2 py-1 text-sm rounded bg-secondary text-foreground text-center border-0 outline-none"
                />
              </div>
              <button onClick={applySettings} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
                Apply
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Circle */}
        <div className="relative w-72 h-72 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="140" stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
            <circle
              cx="150" cy="150" r="140"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-display font-bold tracking-tight tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">
              {mode === "focus" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover-lift">
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-full flex items-center justify-center hover-lift ${
              isRunning ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"
            } ${isRunning ? "" : "animate-pulse-glow"}`}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-display font-bold">{sessionsCompleted}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {sessionsCompleted} focus sessions completed today
        </p>
      </motion.div>
    </div>
  );
};

export default Timer;
