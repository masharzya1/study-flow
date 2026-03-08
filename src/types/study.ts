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
}

export interface AppSettings {
  pomodoroFocus: number;
  pomodoroBreak: number;
  dailyGoalMinutes: number;
  theme: "dark" | "light";
  soundEnabled: boolean;
  ambientSound: "none" | "rain" | "whitenoise" | "forest";
}

export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  dailyGoalMinutes: 120,
  theme: "dark",
  soundEnabled: true,
  ambientSound: "none",
};

export const SUBJECT_COLORS = [
  "160 84% 45%",
  "200 80% 55%",
  "280 65% 60%",
  "40 90% 55%",
  "340 75% 55%",
  "190 90% 50%",
  "320 70% 55%",
  "25 95% 55%",
];

export const SUBJECT_ICONS = ["📚", "🧮", "🔬", "🌍", "💻", "🎨", "📝", "🧪", "📖", "🎵"];
