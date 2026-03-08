import { useState } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Volume2, VolumeX, Clock, Target, Github, Heart, ExternalLink, Layers, Plus, Trash2, Check } from "lucide-react";
import type { DifficultyLevel } from "@/types/study";
import { DEFAULT_DIFFICULTY_LEVELS } from "@/types/study";

const SettingsPage = () => {
  const { state, updateSettings } = useStudy();
  const { settings } = state;
  const levels = settings.difficultyLevels || DEFAULT_DIFFICULTY_LEVELS;

  const [newLevelLabel, setNewLevelLabel] = useState("");
  const [newLevelMinutes, setNewLevelMinutes] = useState(30);
  const [showAddLevel, setShowAddLevel] = useState(false);

  const updateLevel = (id: number, field: "label" | "minutes", value: string | number) => {
    const updated = levels.map(l =>
      l.id === id ? { ...l, [field]: field === "minutes" ? Math.max(1, Math.min(300, Number(value))) : value } : l
    );
    updateSettings({ difficultyLevels: updated });
  };

  const addLevel = () => {
    if (!newLevelLabel.trim()) return;
    const newId = Math.max(...levels.map(l => l.id), 0) + 1;
    const newLevel: DifficultyLevel = {
      id: newId,
      label: newLevelLabel.trim(),
      minutes: Math.max(1, Math.min(300, newLevelMinutes)),
    };
    updateSettings({ difficultyLevels: [...levels, newLevel] });
    setNewLevelLabel("");
    setNewLevelMinutes(30);
    setShowAddLevel(false);
  };

  const removeLevel = (id: number) => {
    if (levels.length <= 2) return; // Keep at least 2 levels
    updateSettings({ difficultyLevels: levels.filter(l => l.id !== id) });
  };

  const resetLevels = () => {
    updateSettings({ difficultyLevels: DEFAULT_DIFFICULTY_LEVELS });
  };

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-5 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Customize your experience</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="glass-card p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Appearance</h2>
        <div className="flex gap-2">
          <button
            onClick={() => updateSettings({ theme: "light" })}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
              settings.theme === "light" ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button
            onClick={() => updateSettings({ theme: "dark" })}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
              settings.theme === "dark" ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Focus Timer
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Focus (min)</label>
            <input
              type="number"
              value={settings.pomodoroFocus}
              onChange={e => updateSettings({ pomodoroFocus: Math.max(1, Math.min(120, Number(e.target.value))) })}
              className="w-20 px-2 py-1.5 text-sm rounded-lg bg-secondary text-foreground text-center border-0 outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Break (min)</label>
            <input
              type="number"
              value={settings.pomodoroBreak}
              onChange={e => updateSettings({ pomodoroBreak: Math.max(1, Math.min(30, Number(e.target.value))) })}
              className="w-20 px-2 py-1.5 text-sm rounded-lg bg-secondary text-foreground text-center border-0 outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Difficulty Levels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Difficulty Levels
          </h2>
          <button onClick={resetLevels} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Reset
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Set default time for each difficulty level. Topics will use this as their estimated duration.
        </p>

        <div className="space-y-2">
          {levels.map((level, index) => (
            <div key={level.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
              <input
                type="text"
                value={level.label}
                onChange={e => updateLevel(level.id, "label", e.target.value)}
                className="flex-1 px-2.5 py-2 text-sm rounded-lg bg-secondary text-foreground border-0 outline-none"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={level.minutes}
                  onChange={e => updateLevel(level.id, "minutes", Number(e.target.value))}
                  className="w-16 px-2 py-2 text-sm rounded-lg bg-secondary text-foreground text-center border-0 outline-none"
                />
                <span className="text-[10px] text-muted-foreground">min</span>
              </div>
              {levels.length > 2 && (
                <button
                  onClick={() => removeLevel(level.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new level */}
        <AnimatePresence>
          {showAddLevel ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Level name"
                  value={newLevelLabel}
                  onChange={e => setNewLevelLabel(e.target.value)}
                  className="flex-1 px-2.5 py-2 text-sm rounded-lg bg-secondary text-foreground border-0 outline-none placeholder:text-muted-foreground"
                />
                <input
                  type="number"
                  value={newLevelMinutes}
                  onChange={e => setNewLevelMinutes(Number(e.target.value))}
                  className="w-16 px-2 py-2 text-sm rounded-lg bg-secondary text-foreground text-center border-0 outline-none"
                />
                <span className="text-[10px] text-muted-foreground">min</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addLevel}
                  className="flex-1 py-2 rounded-xl bg-foreground text-primary-foreground text-xs font-medium"
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" /> Add
                </button>
                <button
                  onClick={() => setShowAddLevel(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAddLevel(true)}
              className="flex items-center gap-2 w-full py-2.5 rounded-xl bg-secondary/50 text-muted-foreground text-xs font-medium hover:bg-secondary transition-colors justify-center"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন Level যোগ করো
            </button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" /> Daily Goal
        </h2>
        <div className="flex items-center justify-between">
          <label className="text-sm">Target minutes</label>
          <input
            type="number"
            value={settings.dailyGoalMinutes}
            onChange={e => updateSettings({ dailyGoalMinutes: Math.max(10, Math.min(600, Number(e.target.value))) })}
            className="w-20 px-2 py-1.5 text-sm rounded-lg bg-secondary text-foreground text-center border-0 outline-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm">Sound</label>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-lg transition-colors ${settings.soundEnabled ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Open Source */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass-card p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Github className="w-3.5 h-3.5" /> Open Source
        </h2>
        <p className="text-sm text-muted-foreground">
          StudyForge is 100% free and open source. No premium features, no locked content.
        </p>
        <div className="flex gap-2 flex-wrap">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm hover-lift font-medium">
            <Github className="w-4 h-4" /> GitHub
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm hover-lift font-medium">
            <Heart className="w-4 h-4" /> Donate
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="text-center text-[11px] text-muted-foreground py-4">
        <p>StudyForge v1.0.0 · Made for students everywhere</p>
        <p className="mt-0.5">PWA · Works offline · 100% free</p>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
