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
  xp: 0,
  level: 1,
  totalTopicsCompleted: 0,
  celebratedMilestones: [],
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
  deleteChapter: (subjectId: string, chapterId: string) => void;
  deleteTopic: (subjectId: string, chapterId: string, topicId: string) => void;
  addSession: (session: StudySession) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => boolean;
  gainXp: (amount: number) => { newLevel: number; isLevelUp: boolean };
  updateTopicNotes: (subjectId: string, chapterId: string, topicId: string, notes: string) => void;
  addStudyPlan: (plan: StudyPlan) => void;
  deleteStudyPlan: (planId: string) => void;
  completePlanTask: (topicId: string) => void;
  incrementSessionsCompleted: () => void;
  celebrateMilestone: (days: number) => void;
  markTopicReviewed: (subjectId: string, chapterId: string, topicId: string) => void;
  getTodayMinutes: () => number;
  getStreak: () => number;
  getHeatmapData: () => Record<string, number>;
  getSubjectProgress: (subjectId: string) => number;
  getTodayPlanTask: () => { planId: string; taskId: string; topicId: string; subjectId: string } | null;
  getTodayPlanTasks: () => { planId: string; taskId: string; topicId: string; subjectId: string; estimatedMinutes: number; type: "study" | "revision"; completed: boolean }[];
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

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

  const deleteChapter = useCallback((subjectId: string, chapterId: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.filter(c => c.id !== chapterId) }
          : s
      ),
    }));
  }, []);

  const deleteTopic = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map(c =>
                c.id === chapterId
                  ? { ...c, topics: c.topics.filter(t => t.id !== topicId) }
                  : c
              ),
            }
          : s
      ),
    }));
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState(prev => {
      let newState = { ...prev, sessions: [...prev.sessions, session] };
      if (session.topicId) {
        newState = {
          ...newState,
          studyPlans: newState.studyPlans.map(plan => ({
            ...plan,
            tasks: plan.tasks.map(t =>
              t.topicId === session.topicId && !t.completed
                ? { ...t, completed: true }
                : t
            ),
          })),
        };
      }
      return newState;
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string): boolean => {
    let willBeCompleted = false;
    setState(prev => {
      let wasCompleted = false;
      for (const s of prev.subjects) {
        if (s.id !== subjectId) continue;
        for (const c of s.chapters) {
          if (c.id !== chapterId) continue;
          const topic = c.topics.find(t => t.id === topicId);
          if (topic) wasCompleted = topic.completed;
        }
      }
      willBeCompleted = !wasCompleted;
      const newSubjects = prev.subjects.map(s =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map(c =>
                c.id === chapterId
                  ? {
                      ...c,
                      topics: c.topics.map(t =>
                        t.id === topicId
                          ? { ...t, completed: willBeCompleted, completedAt: willBeCompleted ? new Date().toISOString() : undefined }
                          : t
                      ),
                    }
                  : c
              ),
            }
          : s
      );
      const newPlans = prev.studyPlans.map(plan => ({
        ...plan,
        tasks: plan.tasks.map(t =>
          t.topicId === topicId && t.subjectId === subjectId
            ? { ...t, completed: willBeCompleted }
            : t
        ),
      }));
      return {
        ...prev,
        subjects: newSubjects,
        studyPlans: newPlans,
        totalTopicsCompleted: willBeCompleted ? prev.totalTopicsCompleted + 1 : Math.max(0, prev.totalTopicsCompleted - 1),
      };
    });
    return willBeCompleted;
  }, []);

  const gainXp = useCallback((amount: number) => {
    let result = { newLevel: 0, isLevelUp: false };
    setState(prev => {
      const newXp = prev.xp + amount;
      const xpPerLevel = (level: number) => level * 100;
      let calcLevel = 1;
      let tempXp = newXp;
      while (tempXp >= xpPerLevel(calcLevel)) {
        tempXp -= xpPerLevel(calcLevel);
        calcLevel++;
      }
      const isLevelUp = calcLevel > prev.level;
      result = { newLevel: calcLevel, isLevelUp };
      return { ...prev, xp: newXp, level: calcLevel };
    });
    return result;
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

  const deleteStudyPlan = useCallback((planId: string) => {
    setState(prev => ({
      ...prev,
      studyPlans: prev.studyPlans.filter(p => p.id !== planId),
    }));
  }, []);

  const completePlanTask = useCallback((topicId: string) => {
    setState(prev => ({
      ...prev,
      studyPlans: prev.studyPlans.map(plan => ({
        ...plan,
        tasks: plan.tasks.map(t =>
          t.topicId === topicId && !t.completed ? { ...t, completed: true } : t
        ),
      })),
    }));
  }, []);

  const markTopicReviewed = useCallback((subjectId: string, chapterId: string, topicId: string) => {
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
                          ? { ...t, revisionDates: [...t.revisionDates, new Date().toISOString()] }
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

  const celebrateMilestone = useCallback((days: number) => {
    setState(prev => ({
      ...prev,
      celebratedMilestones: [...(prev.celebratedMilestones || []), days],
    }));
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

  const getTodayPlanTask = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    for (const plan of state.studyPlans) {
      const task = plan.tasks.find(t => t.date === today && !t.completed);
      if (task) {
        return { planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId };
      }
    }
    return null;
  }, [state.studyPlans]);

  const getTodayPlanTasks = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const tasks: { planId: string; taskId: string; topicId: string; subjectId: string; estimatedMinutes: number; type: "study" | "revision"; completed: boolean }[] = [];
    for (const plan of state.studyPlans) {
      for (const task of plan.tasks) {
        if (task.date === today) {
          tasks.push({ planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId, estimatedMinutes: task.estimatedMinutes, type: task.type, completed: task.completed });
        }
      }
    }
    return tasks;
  }, [state.studyPlans]);

  return (
    <StudyContext.Provider value={{
      state, addSubject, updateSubject, deleteSubject, deleteChapter, deleteTopic,
      addSession, updateSettings,
      toggleTopicComplete, updateTopicNotes, addStudyPlan, deleteStudyPlan, completePlanTask,
      incrementSessionsCompleted, celebrateMilestone, gainXp, markTopicReviewed,
      getTodayMinutes, getStreak, getHeatmapData, getSubjectProgress, getTodayPlanTask, getTodayPlanTasks,
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
