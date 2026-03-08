import { useState } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar as CalendarIcon, Clock, BookOpen, ChevronRight, Check, RotateCcw, Zap } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";
import type { StudyPlan, PlannedTask } from "@/types/study";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const StudyPlanPage = () => {
  const { state, addStudyPlan } = useStudy();
  const [step, setStep] = useState(0);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(3);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const generatePlan = () => {
    if (!examDate || selectedSubjects.length === 0) return;

    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / 86400000));
    const dailyMinutes = dailyHours * 60;

    // Gather all incomplete topics from selected subjects
    const allTopics: { topicId: string; subjectId: string; difficulty: number; estimatedMinutes: number; name: string }[] = [];
    state.subjects
      .filter(s => selectedSubjects.includes(s.id))
      .forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.topics
            .filter(t => !t.completed)
            .forEach(topic => {
              allTopics.push({
                topicId: topic.id,
                subjectId: subject.id,
                difficulty: topic.difficulty,
                estimatedMinutes: topic.estimatedMinutes,
                name: topic.name,
              });
            });
        });
      });

    // Sort by difficulty (hardest first for better retention)
    allTopics.sort((a, b) => b.difficulty - a.difficulty);

    // Reserve last 20% of days for revision
    const studyDays = Math.ceil(daysUntilExam * 0.8);
    const revisionDays = daysUntilExam - studyDays;

    const tasks: PlannedTask[] = [];
    let currentDay = 0;
    let dayMinutesUsed = 0;

    // Distribute study topics across days
    for (const topic of allTopics) {
      if (currentDay >= studyDays) break;

      if (dayMinutesUsed + topic.estimatedMinutes > dailyMinutes && dayMinutesUsed > 0) {
        currentDay++;
        dayMinutesUsed = 0;
      }
      if (currentDay >= studyDays) break;

      const taskDate = new Date(today);
      taskDate.setDate(taskDate.getDate() + currentDay);

      tasks.push({
        id: crypto.randomUUID(),
        date: taskDate.toISOString().split("T")[0],
        topicId: topic.topicId,
        subjectId: topic.subjectId,
        estimatedMinutes: topic.estimatedMinutes,
        completed: false,
        type: "study",
      });

      dayMinutesUsed += topic.estimatedMinutes;
    }

    // Add revision tasks (spaced repetition)
    const revisionTopics = allTopics.filter(t => t.difficulty >= 3);
    for (let i = 0; i < revisionDays; i++) {
      const revDate = new Date(exam);
      revDate.setDate(revDate.getDate() - i - 1);
      const dayTopics = revisionTopics.slice(
        (i * Math.ceil(revisionTopics.length / revisionDays)),
        ((i + 1) * Math.ceil(revisionTopics.length / revisionDays))
      );

      for (const topic of dayTopics) {
        tasks.push({
          id: crypto.randomUUID(),
          date: revDate.toISOString().split("T")[0],
          topicId: topic.topicId,
          subjectId: topic.subjectId,
          estimatedMinutes: Math.ceil(topic.estimatedMinutes * 0.5),
          completed: false,
          type: "revision",
        });
      }
    }

    const plan: StudyPlan = {
      id: crypto.randomUUID(),
      examDate,
      examName: examName || "Exam",
      subjects: selectedSubjects,
      dailyHours,
      createdAt: new Date().toISOString(),
      tasks,
    };

    // Auto-save immediately so plan persists across navigation
    addStudyPlan(plan);
    setGeneratedPlan(plan);
    setStep(3);
  };

  const resetWizard = () => {
    setStep(0);
    setExamName("");
    setExamDate("");
    setDailyHours(3);
    setSelectedSubjects([]);
    setGeneratedPlan(null);
  };

  // Group tasks by date for preview
  const tasksByDate = generatedPlan?.tasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, PlannedTask[]>) || {};

  const getSubjectName = (id: string) => state.subjects.find(s => s.id === id)?.name || "";
  const getSubjectColor = (id: string) => state.subjects.find(s => s.id === id)?.color || "220 15% 25%";
  const getTopicName = (topicId: string) => {
    for (const s of state.subjects) {
      for (const c of s.chapters) {
        const t = c.topics.find(t => t.id === topicId);
        if (t) return t.name;
      }
    }
    return "Topic";
  };

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Study Plan</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Generate an optimized schedule</p>
      </motion.div>

      {/* Existing Plans */}
      {state.studyPlans.length > 0 && step === 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Plans</p>
          {state.studyPlans.map(plan => {
            const daysLeft = Math.max(0, Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / 86400000));
            const completed = plan.tasks.filter(t => t.completed).length;
            return (
              <button
                key={plan.id}
                onClick={() => { setGeneratedPlan(plan); setViewingPlanId(plan.id); setStep(3); }}
                className="w-full glass-card p-4 text-left hover-lift"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{plan.examName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{daysLeft} days left · {completed}/{plan.tasks.length} tasks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{plan.dailyHours}h/day</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${plan.tasks.length > 0 ? (completed / plan.tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Wizard */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.button
            key="start"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => setStep(1)}
            className="w-full glass-card p-6 text-left hover-lift group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Generate New Plan</p>
                <p className="text-xs text-muted-foreground mt-0.5">AI-powered study schedule</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.button>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Exam Details</h3>
            </div>
            <div className="space-y-3">
              <input
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="Exam name (e.g. Final Exam)"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-foreground/20"
                autoFocus
              />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Daily Study Hours</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5, 6].map(h => (
                    <button
                      key={h}
                      onClick={() => setDailyHours(h)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        dailyHours === h ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!examDate}
              className="w-full py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-40"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Select Subjects</h3>
            </div>
            {state.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No subjects yet. Create subjects first in the Subjects tab.
              </p>
            ) : (
              <div className="space-y-2">
                {state.subjects.map(subject => {
                  const selected = selectedSubjects.includes(subject.id);
                  const topicCount = subject.chapters.flatMap(c => c.topics).filter(t => !t.completed).length;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selected ? "bg-foreground text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <SubjectIcon name={subject.icon} className="w-4 h-4" />
                      <span className="flex-1 text-sm font-medium">{subject.name}</span>
                      <span className={`text-xs ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {topicCount} topics
                      </span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm">
                Back
              </button>
              <button
                onClick={generatePlan}
                disabled={selectedSubjects.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-40"
              >
                Generate
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && generatedPlan && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">Plan Generated!</p>
                  <p className="text-xs text-muted-foreground">
                    {generatedPlan.tasks.filter(t => t.type === "study").length} study +{" "}
                    {generatedPlan.tasks.filter(t => t.type === "revision").length} revision tasks
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {Object.entries(tasksByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 10)
                .map(([date, tasks]) => (
                  <div key={date} className="glass-card p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <div className="space-y-1">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `hsl(${getSubjectColor(task.subjectId)})` }}
                          />
                          <span className="flex-1 truncate">{getTopicName(task.topicId)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            task.type === "revision" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
                          }`}>
                            {task.type === "revision" ? "Review" : `${task.estimatedMinutes}m`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {Object.keys(tasksByDate).length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{Object.keys(tasksByDate).length - 10} more days...
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setViewingPlanId(null); setGeneratedPlan(null); setStep(0); }} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm">
                ← Back
              </button>
              <button onClick={resetWizard} className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm">
                Create New
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Plan saved automatically</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default StudyPlanPage;
