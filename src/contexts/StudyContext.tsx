import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppState, Subject, StudySession, DailyGoal, StudyPlan, AppSettings } from "@/types/study";
import { DEFAULT_SETTINGS } from "@/types/study";

const STORAGE_KEY = "studyforge_data";

const defaultState: AppState = {
  subjects: [],
  sessions: [],
  dailyGoals: [],
  studyPlans: [],
  achievements: [],
  settings: DEFAULT_SETTINGS,
  streak: 0,
  todaySessionsCompleted: 0,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface StudyContextValue {
  state: AppState;
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  addSession: (session: StudySession) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => void;
  updateTopicNotes: (subjectId: string, chapterId: string, topicId: string, notes: string) => void;
  addStudyPlan: (plan: StudyPlan) => void;
  incrementSessionsCompleted: () => void;
  getTodayMinutes: () => number;
  getStreak: () => number;
  getHeatmapData: () => Record<string, number>;
  getSubjectProgress: (subjectId: string) => number;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  // Calculate streak
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = state.sessions.filter(s => s.startTime.startsWith(today) && s.completed);
    if (todaySessions.length > 0 && state.lastStudyDate !== today) {
      setState(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = prev.lastStudyDate === yesterday ? prev.streak + 1 : 1;
        return { ...prev, streak: newStreak, lastStudyDate: today };
      });
    }
  }, [state.sessions]);

  const addSubject = useCallback((subject: Subject) => {
    setState(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subject.id ? subject : s),
    }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== id) }));
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState(prev => ({ ...prev, sessions: [...prev.sessions, session] }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map(c =>
                c.id === chapterId
                  ? {
                      ...c,
                      topics: c.topics.map(t =>
                        t.id === topicId
                          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
                          : t
                      ),
                    }
                  : c
              ),
            }
          : s
      ),
    }));
  }, []);

  const updateTopicNotes = useCallback((subjectId: string, chapterId: string, topicId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map(c =>
                c.id === chapterId
                  ? { ...c, topics: c.topics.map(t => t.id === topicId ? { ...t, notes } : t) }
                  : c
              ),
            }
          : s
      ),
    }));
  }, []);

  const addStudyPlan = useCallback((plan: StudyPlan) => {
    setState(prev => ({ ...prev, studyPlans: [...prev.studyPlans, plan] }));
  }, []);

  const incrementSessionsCompleted = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setState(prev => ({
      ...prev,
      todaySessionsCompleted: prev.todaySessionsDate === today ? prev.todaySessionsCompleted + 1 : 1,
      todaySessionsDate: today,
    }));
  }, []);

  const getTodayMinutes = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.sessions
      .filter(s => s.startTime.startsWith(today) && s.completed)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [state.sessions]);

  const getStreak = useCallback(() => state.streak, [state.streak]);

  const getHeatmapData = useCallback(() => {
    const data: Record<string, number> = {};
    state.sessions.forEach(s => {
      if (!s.completed) return;
      const day = s.startTime.split("T")[0];
      data[day] = (data[day] || 0) + s.durationMinutes;
    });
    return data;
  }, [state.sessions]);

  const getSubjectProgress = useCallback((subjectId: string) => {
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return 0;
    const allTopics = subject.chapters.flatMap(c => c.topics);
    if (allTopics.length === 0) return 0;
    return Math.round((allTopics.filter(t => t.completed).length / allTopics.length) * 100);
  }, [state.subjects]);

  return (
    <StudyContext.Provider value={{
      state, addSubject, updateSubject, deleteSubject, addSession, updateSettings,
      toggleTopicComplete, updateTopicNotes, addStudyPlan, incrementSessionsCompleted,
      getTodayMinutes, getStreak, getHeatmapData, getSubjectProgress,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be inside StudyProvider");
  return ctx;
}
