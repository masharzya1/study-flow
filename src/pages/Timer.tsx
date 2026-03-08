import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, ChevronDown, Check } from "lucide-react";
import { AmbientSounds, type AudioState } from "@/components/AmbientSounds";
import { NetworkIndicator } from "@/components/NetworkIndicator";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SubjectIcon } from "@/components/SubjectIcon";
import { fireSessionComplete, fireStreakCelebration } from "@/lib/confetti";
import { notifyTimerComplete, notifyStreak, requestNotificationPermission } from "@/lib/notifications";
import type { StudySession } from "@/types/study";

const Timer = () => {
  const { state, addSession, updateSettings, incrementSessionsCompleted, getTodayPlanTasks, getStreak } = useStudy();
  const { pomodoroFocus, pomodoroBreak } = state.settings;
  const today = new Date().toISOString().split("T")[0];
  const sessionsCompleted = state.todaySessionsDate === today ? state.todaySessionsCompleted : 0;

  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pomodoroFocus * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMin, setFocusMin] = useState(pomodoroFocus);
  const [breakMin, setBreakMin] = useState(pomodoroBreak);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [useTopicTime, setUseTopicTime] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  const todayTasks = getTodayPlanTasks();
  const incompleteTasks = todayTasks.filter(t => !t.completed);

  const resolvedTasks = useMemo(() => {
    return todayTasks.map(task => {
      const subject = state.subjects.find(s => s.id === task.subjectId);
      let topicName = "Topic";
      for (const c of subject?.chapters || []) {
        const t = c.topics.find(tp => tp.id === task.topicId);
        if (t) { topicName = t.name; break; }
      }
      return {
        ...task,
        topicName,
        subjectName: subject?.name || "Unknown",
        subjectColor: subject?.color || "0 0% 50%",
        subjectIcon: subject?.icon || "book-open",
      };
    });
  }, [todayTasks, state.subjects]);

  useEffect(() => {
    if (!selectedTaskId && incompleteTasks.length > 0) {
      setSelectedTaskId(incompleteTasks[0].taskId);
    }
  }, [incompleteTasks, selectedTaskId]);

  const selectedTask = resolvedTasks.find(t => t.taskId === selectedTaskId);
  const focusDuration = useTopicTime && selectedTask ? selectedTask.estimatedMinutes : pomodoroFocus;
  const totalTime = mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const reset = useCallback(() => {
    setIsRunning(false);
    const dur = mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60;
    setTimeLeft(dur);
    sessionStartRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, focusDuration, pomodoroBreak]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60);
    }
  }, [mode, focusDuration, pomodoroBreak, isRunning]);

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
                durationMinutes: focusDuration,
                type: selectedTask?.type === "revision" ? "revision" : "focus",
                completed: true,
                ...(selectedTask ? { topicId: selectedTask.topicId, subjectId: selectedTask.subjectId } : {}),
              };
              addSession(session);
              incrementSessionsCompleted();
              sessionStartRef.current = null;

              // 🎉 Celebration!
              fireSessionComplete();
              notifyTimerComplete("focus");
              const currentStreak = getStreak();
              if (currentStreak > 0 && currentStreak % 3 === 0) {
                setTimeout(() => fireStreakCelebration(currentStreak), 800);
                notifyStreak(currentStreak);
              }
              setCelebrationStreak(currentStreak);
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3000);

              const nextTask = incompleteTasks.find(t => t.taskId !== selectedTaskId);
              if (nextTask) setSelectedTaskId(nextTask.taskId);
              setMode("break");
              return pomodoroBreak * 60;
            } else {
              setMode("focus");
              sessionStartRef.current = null;
              return focusDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, focusDuration, pomodoroBreak, addSession, selectedTask, incompleteTasks, selectedTaskId, incrementSessionsCompleted, getStreak]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const applySettings = () => {
    updateSettings({ pomodoroFocus: focusMin, pomodoroBreak: breakMin });
    setShowSettings(false);
    reset();
  };

  const selectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTopicSelector(false);
    if (!isRunning) {
      const task = resolvedTasks.find(t => t.taskId === taskId);
      if (task && useTopicTime) setTimeLeft(task.estimatedMinutes * 60);
    }
  };

  const circumference = 2 * Math.PI * 120;
  const needsInternet = isRunning;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-5 pb-28 md:pb-8">
      {/* Network Status */}
      <div className="fixed top-3 right-3 z-50 md:top-4 md:right-4">
        <NetworkIndicator needsInternet={needsInternet} />
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="glass-card-elevated p-6 text-center space-y-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-4xl"
              >
                🎉
              </motion.div>
              <p className="text-lg font-semibold">Session Complete!</p>
              {celebrationStreak > 0 && (
                <p className="text-sm text-[hsl(var(--warning))]">
                  🔥 {celebrationStreak} day streak!
                </p>
              )}
              <p className="text-xs text-muted-foreground">Break time — তুমি দারুণ করছো!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        {/* Today's Topic Selector */}
        {resolvedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              আজকের রুটিন · {incompleteTasks.length} বাকি আছে
            </p>

            {selectedTask && (
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !isRunning && setShowTopicSelector(!showTopicSelector)}
                className="glass-card p-3.5 flex items-center gap-3 text-left w-full group"
                disabled={isRunning}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `hsl(${selectedTask.subjectColor} / 0.12)` }}
                >
                  <SubjectIcon name={selectedTask.subjectIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {isRunning ? "Studying" : selectedTask.type === "revision" ? "Review" : "Study"}
                  </p>
                  <p className="text-sm font-medium truncate">{selectedTask.topicName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedTask.subjectName} · {selectedTask.estimatedMinutes}m
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip-accent">{selectedTask.type === "revision" ? "Review" : "Planned"}</span>
                  {!isRunning && (
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTopicSelector ? "rotate-180" : ""}`} />
                  )}
                </div>
              </motion.button>
            )}

            <AnimatePresence>
              {showTopicSelector && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-2 space-y-0.5 max-h-52 overflow-y-auto">
                    {resolvedTasks.map(task => (
                      <button
                        key={task.taskId}
                        onClick={() => selectTask(task.taskId)}
                        disabled={task.completed}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                          task.taskId === selectedTaskId ? "bg-secondary" : "hover:bg-secondary/50"
                        } ${task.completed ? "opacity-40" : ""}`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(${task.subjectColor} / 0.12)` }}
                        >
                          {task.completed ? (
                            <Check className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <SubjectIcon name={task.subjectIcon} className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${task.completed ? "line-through" : "font-medium"}`}>
                            {task.topicName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {task.subjectName} · {task.estimatedMinutes}m · {task.type === "revision" ? "Review" : "Study"}
                          </p>
                        </div>
                        {task.taskId === selectedTaskId && !task.completed && (
                          <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setUseTopicTime(!useTopicTime)}
                    className="flex items-center gap-2 mt-2 px-3 py-2 w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      useTopicTime ? "bg-foreground border-foreground" : "border-border"
                    }`}>
                      {useTopicTime && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    Topic এর সময় অনুযায়ী timer সেট করো
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <AmbientSounds isPlaying={isRunning} currentMode={mode} onAudioStateChange={setAudioState} />
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
            {selectedTask && useTopicTime && mode === "focus" && (
              <span className="text-[10px] text-muted-foreground mt-1">{selectedTask.estimatedMinutes}m estimated</span>
            )}
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
          <span>{useTopicTime && selectedTask ? `${selectedTask.estimatedMinutes}m topic` : `${pomodoroFocus}m focus`} / {pomodoroBreak}m break</span>
        </div>
      </motion.div>

      {/* Mini Now Playing Bar */}
      <AnimatePresence>
        {audioState && (
          <MiniPlayer
            trackTitle={audioState.trackTitle}
            type={audioState.type}
            isPlaying={audioState.isPlaying}
            isLoading={audioState.isLoading}
            shuffle={audioState.shuffle}
            repeat={audioState.repeat}
            onTogglePlay={audioState.onTogglePlay}
            onNext={audioState.onNext}
            onPrev={audioState.onPrev}
            onToggleShuffle={audioState.onToggleShuffle}
            onToggleRepeat={audioState.onToggleRepeat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timer;
