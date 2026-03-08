import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, ChevronDown, Check, BookOpen, List } from "lucide-react";
import { AmbientSounds, type AudioState } from "@/components/AmbientSounds";
import { NetworkIndicator } from "@/components/NetworkIndicator";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SubjectIcon } from "@/components/SubjectIcon";
import { VictoryScreen } from "@/components/VictoryScreen";
import { fireSessionComplete, fireStreakCelebration } from "@/lib/confetti";
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
  const [victoryData, setVictoryData] = useState<{ show: boolean; topicName: string; xpGained: number; newLevel?: number; isLevelUp: boolean }>({ show: false, topicName: "", xpGained: 0, isLevelUp: false });
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  // Source mode: "plan" (from study plan) or "free" (any subject/topic)
  const [sourceMode, setSourceMode] = useState<"plan" | "free">("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [freeTopicId, setFreeTopicId] = useState<string | null>(null);
  const [showFreePicker, setShowFreePicker] = useState(false);

  // Auto-select first plan
  useEffect(() => {
    if (!selectedPlanId && state.studyPlans.length > 0) {
      setSelectedPlanId(state.studyPlans[0].id);
    }
  }, [state.studyPlans, selectedPlanId]);

  // Get tasks for selected plan
  const todayTasks = useMemo(() => {
    if (sourceMode === "plan" && selectedPlanId) {
      const plan = state.studyPlans.find(p => p.id === selectedPlanId);
      if (!plan) return [];
      return plan.tasks
        .filter(t => t.date === today)
        .map(t => ({ planId: plan.id, taskId: t.id, topicId: t.topicId, subjectId: t.subjectId, estimatedMinutes: t.estimatedMinutes, type: t.type, completed: t.completed }));
    }
    return getTodayPlanTasks();
  }, [sourceMode, selectedPlanId, state.studyPlans, today, getTodayPlanTasks]);
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

  // Free topic: resolve selected free topic info
  const freeTopicInfo = useMemo(() => {
    if (!freeTopicId) return null;
    for (const s of state.subjects) {
      for (const c of s.chapters) {
        const t = c.topics.find(tp => tp.id === freeTopicId);
        if (t) return { topicName: t.name, subjectName: s.name, subjectColor: s.color, subjectIcon: s.icon, estimatedMinutes: t.estimatedMinutes, topicId: t.id, subjectId: s.id };
      }
    }
    return null;
  }, [freeTopicId, state.subjects]);

  useEffect(() => {
    if (!selectedTaskId && incompleteTasks.length > 0) {
      setSelectedTaskId(incompleteTasks[0].taskId);
    }
  }, [incompleteTasks, selectedTaskId]);

  const selectedTask = resolvedTasks.find(t => t.taskId === selectedTaskId);
  
  // Calculate focus duration based on source mode
  const focusDuration = useMemo(() => {
    if (sourceMode === "free" && freeTopicInfo && useTopicTime) return freeTopicInfo.estimatedMinutes;
    if (sourceMode === "plan" && selectedTask && useTopicTime) return selectedTask.estimatedMinutes;
    return pomodoroFocus;
  }, [sourceMode, freeTopicInfo, selectedTask, useTopicTime, pomodoroFocus]);
  
  const totalTime = mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const reset = useCallback(() => {
    setIsRunning(false);
    const dur = mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60;
    setTimeLeft(dur);
    sessionStartRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, focusDuration, pomodoroBreak]);

  // Only reset timeLeft when mode or duration settings change, NOT when pausing
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === "focus" ? focusDuration * 60 : pomodoroBreak * 60);
    }
  }, [mode, focusDuration, pomodoroBreak]);

  useEffect(() => {
    if (isRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date().toISOString();
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "focus") {
              const topicInfo = sourceMode === "free" ? freeTopicInfo : selectedTask;
              const session: StudySession = {
                id: crypto.randomUUID(),
                startTime: sessionStartRef.current!,
                endTime: new Date().toISOString(),
                durationMinutes: focusDuration,
                type: selectedTask?.type === "revision" ? "revision" : "focus",
                completed: true,
                ...(topicInfo ? { topicId: topicInfo.topicId, subjectId: topicInfo.subjectId } : {}),
              };
              addSession(session);
              incrementSessionsCompleted();
              sessionStartRef.current = null;

              // 🎮 Gaming Victory Screen!
              const topicDisplayName = sourceMode === "free" && freeTopicInfo
                ? freeTopicInfo.topicName
                : (selectedTask ? selectedTask.topicName : "Focus Session");
              const currentStreak = getStreak();
              setCelebrationStreak(currentStreak);
              setVictoryData({
                show: true,
                topicName: topicDisplayName,
                xpGained: Math.round(focusDuration * 2),
                newLevel: undefined,
                isLevelUp: false,
              });

              const nextTask = incompleteTasks.find(t => t.taskId !== selectedTaskId);
              if (nextTask) setSelectedTaskId(nextTask.taskId);
              setMode("break");
              return pomodoroBreak * 60;
            } else {
              // Break complete
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
      <div className="fixed top-3 right-3 z-50 md:top-4 md:right-4">
        <NetworkIndicator needsInternet={needsInternet} />
      </div>

      {/* Gaming Victory Screen */}
      <VictoryScreen
        show={victoryData.show}
        onClose={() => setVictoryData(prev => ({ ...prev, show: false }))}
        topicName={victoryData.topicName}
        xpGained={victoryData.xpGained}
        newLevel={victoryData.newLevel}
        isLevelUp={victoryData.isLevelUp}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        {/* Source Mode Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1 bg-secondary/60 rounded-xl p-1">
            <button
              onClick={() => { setSourceMode("plan"); setShowFreePicker(false); }}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                sourceMode === "plan" ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <List className="w-3 h-3" /> Routine
            </button>
            <button
              onClick={() => { setSourceMode("free"); setShowTopicSelector(false); }}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                sourceMode === "free" ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <BookOpen className="w-3 h-3" /> Free Topic
            </button>
          </div>

          {/* Plan Selector (when multiple plans exist) */}
          {sourceMode === "plan" && state.studyPlans.length > 1 && !isRunning && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1">
              {state.studyPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => { setSelectedPlanId(plan.id); setSelectedTaskId(null); }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedPlanId === plan.id ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {plan.examName}
                </button>
              ))}
            </div>
          )}

          {/* Plan Topic Selector */}
          {sourceMode === "plan" && resolvedTasks.length > 0 && (
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

          {sourceMode === "plan" && resolvedTasks.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">আজকের জন্য কোনো plan task নেই। Free Topic mode ব্যবহার করো!</p>
          )}

          {/* Free Topic Picker */}
          {sourceMode === "free" && (
            <div className="space-y-2">
              {freeTopicInfo ? (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !isRunning && setShowFreePicker(!showFreePicker)}
                  className="glass-card p-3.5 flex items-center gap-3 text-left w-full"
                  disabled={isRunning}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `hsl(${freeTopicInfo.subjectColor} / 0.12)` }}
                  >
                    <SubjectIcon name={freeTopicInfo.subjectIcon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Free Study</p>
                    <p className="text-sm font-medium truncate">{freeTopicInfo.topicName}</p>
                    <p className="text-[10px] text-muted-foreground">{freeTopicInfo.subjectName} · {freeTopicInfo.estimatedMinutes}m</p>
                  </div>
                  {!isRunning && <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showFreePicker ? "rotate-180" : ""}`} />}
                </motion.button>
              ) : (
                <button
                  onClick={() => setShowFreePicker(!showFreePicker)}
                  disabled={isRunning}
                  className="glass-card p-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                  Topic বেছে নাও
                </button>
              )}

              <AnimatePresence>
                {showFreePicker && !isRunning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-2 max-h-60 overflow-y-auto space-y-1">
                      {state.subjects.map(subject => (
                        <div key={subject.id}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5 font-medium flex items-center gap-1.5">
                            <SubjectIcon name={subject.icon} className="w-3 h-3" />
                            {subject.name}
                          </p>
                          {subject.chapters.flatMap(c => c.topics).filter(t => !t.completed).map(topic => (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setFreeTopicId(topic.id);
                                setShowFreePicker(false);
                                if (useTopicTime) setTimeLeft(topic.estimatedMinutes * 60);
                              }}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                                freeTopicId === topic.id ? "bg-secondary" : "hover:bg-secondary/50"
                              }`}
                            >
                              <span className="flex-1 truncate">{topic.name}</span>
                              <span className="text-[10px] text-muted-foreground">{topic.estimatedMinutes}m</span>
                            </button>
                          ))}
                        </div>
                      ))}
                      {state.subjects.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">আগে Subjects page এ subject যোগ করো</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

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
            {useTopicTime && mode === "focus" && (
              (sourceMode === "plan" && selectedTask) ? (
                <span className="text-[10px] text-muted-foreground mt-1">{selectedTask.estimatedMinutes}m estimated</span>
              ) : (sourceMode === "free" && freeTopicInfo) ? (
                <span className="text-[10px] text-muted-foreground mt-1">{freeTopicInfo.estimatedMinutes}m estimated</span>
              ) : null
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
