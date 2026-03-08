export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  topics: Topic[];
  priority: "low" | "medium" | "high";
}

export interface Topic {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  notes: string;
  revisionDates: string[];
}

export interface StudySession {
  id: string;
  topicId?: string;
  subjectId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  type: "focus" | "break" | "revision";
  completed: boolean;
}

export interface DailyGoal {
  id: string;
  date: string;
  targetMinutes: number;
  achievedMinutes: number;
  tasksPlanned: number;
  tasksCompleted: number;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  examName: string;
  subjects: string[];
  dailyHours: number;
  createdAt: string;
  tasks: PlannedTask[];
}

export interface PlannedTask {
  id: string;
  date: string;
  topicId: string;
  subjectId: string;
  estimatedMinutes: number;
  completed: boolean;
  type: "study" | "revision";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: string;
}

export interface AppState {
  subjects: Subject[];
  sessions: StudySession[];
  dailyGoals: DailyGoal[];
  studyPlans: StudyPlan[];
  achievements: Achievement[];
  settings: AppSettings;
  streak: number;
  lastStudyDate?: string;
  todaySessionsCompleted: number;
  todaySessionsDate?: string;
}

export interface DifficultyLevel {
  id: number;
  label: string;
  minutes: number;
}

export interface AppSettings {
  pomodoroFocus: number;
  pomodoroBreak: number;
  dailyGoalMinutes: number;
  theme: "dark" | "light";
  soundEnabled: boolean;
  ambientSound: "none" | "rain" | "whitenoise" | "forest";
  youtubeUrl: string;
  difficultyLevels: DifficultyLevel[];
}

export const DEFAULT_DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: 1, label: "Very Easy", minutes: 15 },
  { id: 2, label: "Easy", minutes: 25 },
  { id: 3, label: "Medium", minutes: 35 },
  { id: 4, label: "Hard", minutes: 50 },
  { id: 5, label: "Very Hard", minutes: 60 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  dailyGoalMinutes: 120,
  theme: "light",
  soundEnabled: true,
  ambientSound: "none",
  youtubeUrl: "",
  difficultyLevels: DEFAULT_DIFFICULTY_LEVELS,
};

export const SUBJECT_COLORS = [
  "220 15% 25%",
  "200 60% 45%",
  "152 60% 42%",
  "45 93% 58%",
  "340 60% 55%",
  "270 50% 55%",
  "25 80% 50%",
  "180 50% 45%",
];

// Lucide icon names used for subjects
export const SUBJECT_ICONS = [
  "book-open",
  "calculator",
  "flask-conical",
  "globe",
  "laptop",
  "palette",
  "pen-line",
  "test-tubes",
  "book-text",
  "music",
];
