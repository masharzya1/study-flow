import { useState } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar as CalendarIcon, Clock, BookOpen, ChevronRight, Check, RotateCcw, Zap, Trash2 } from "lucide-react";
import { SubjectIcon } from "@/components/SubjectIcon";
import type { StudyPlan, PlannedTask } from "@/types/study";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StudyPlanPage = () => {
  const { state, addStudyPlan, deleteStudyPlan } = useStudy();
  const [step, setStep] = useState(0);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(3);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const generatePlan = () => {
    if (!examDate || selectedSubjects.length === 0) return;
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / 86400000));
    const dailyMinutes = dailyHours * 60;

    const allTopics: { topicId: string; subjectId: string; difficulty: number; estimatedMinutes: number; name: string }[] = [];
    state.subjects.filter(s => selectedSubjects.includes(s.id)).forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics.filter(t => !t.completed).forEach(topic => {
          allTopics.push({ topicId: topic.id, subjectId: subject.id, difficulty: topic.difficulty, estimatedMinutes: topic.estimatedMinutes, name: topic.name });
        });
      });
    });

    allTopics.sort((a, b) => b.difficulty - a.difficulty);
    const studyDays = Math.ceil(daysUntilExam * 0.8);
    const revisionDays = daysUntilExam - studyDays;
    const tasks: PlannedTask[] = [];
    let currentDay = 0;
    let dayMinutesUsed = 0;

    for (const topic of allTopics) {
      if (currentDay >= studyDays) break;
      if (dayMinutesUsed + topic.estimatedMinutes > dailyMinutes && dayMinutesUsed > 0) { currentDay++; dayMinutesUsed = 0; }
      if (currentDay >= studyDays) break;
      const taskDate = new Date(today);
      taskDate.setDate(taskDate.getDate() + currentDay);
      tasks.push({ id: crypto.randomUUID(), date: taskDate.toISOString().split("T")[0], topicId: topic.topicId, subjectId: topic.subjectId, estimatedMinutes: topic.estimatedMinutes, completed: false, type: "study" });
      dayMinutesUsed += topic.estimatedMinutes;
    }

    const revisionTopics = allTopics.filter(t => t.difficulty >= 3);
    for (let i = 0; i < revisionDays; i++) {
      const revDate = new Date(exam);
      revDate.setDate(revDate.getDate() - i - 1);
      const dayTopics = revisionTopics.slice(i * Math.ceil(revisionTopics.length / revisionDays), (i + 1) * Math.ceil(revisionTopics.length / revisionDays));
      for (const topic of dayTopics) {
        tasks.push({ id: crypto.randomUUID(), date: revDate.toISOString().split("T")[0], topicId: topic.topicId, subjectId: topic.subjectId, estimatedMinutes: Math.ceil(topic.estimatedMinutes * 0.5), completed: false, type: "revision" });
      }
    }

    const plan: StudyPlan = { id: crypto.randomUUID(), examDate, examName: examName || "Exam", subjects: selectedSubjects, dailyHours, createdAt: new Date().toISOString(), tasks };
    addStudyPlan(plan);
    setGeneratedPlan(plan);
    setStep(3);
  };

  const resetWizard = () => {
    setStep(0); setExamName(""); setExamDate(""); setDailyHours(3); setSelectedSubjects([]); setGeneratedPlan(null);
  };

  const handleDeletePlan = () => {
    if (!deletingPlanId) return;
    deleteStudyPlan(deletingPlanId);
    if (viewingPlanId === deletingPlanId) {
      setViewingPlanId(null); setGeneratedPlan(null); setStep(0);
    }
    setDeletingPlanId(null);
  };

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
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlanId} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete study plan?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this plan and all its scheduled tasks. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <div key={plan.id} className="glass-card hover-lift overflow-hidden">
                <button
                  onClick={() => { setGeneratedPlan(plan); setViewingPlanId(plan.id); setStep(3); }}
                  className="w-full p-4 text-left"
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
                    <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${plan.tasks.length > 0 ? (completed / plan.tasks.length) * 100 : 0}%` }} />
                  </div>
                </button>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingPlanId(plan.id); }}
                    className="flex items-center gap-1 text-[11px] text-destructive/50 hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.button key="start" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            onClick={() => setStep(1)} className="w-full glass-card p-6 text-left hover-lift group">
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
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Exam Details</h3>
            </div>
            <div className="space-y-3">
              <input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Exam name (e.g. Final Exam)"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-foreground/20" autoFocus />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exam Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl bg-secondary border-0 h-auto px-3 py-2.5 text-sm hover:bg-secondary/80", !examDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {examDate ? format(new Date(examDate + "T00:00:00"), "PPP") : <span>Pick exam date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={examDate ? new Date(examDate + "T00:00:00") : undefined}
                      onSelect={(date) => setExamDate(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => date < new Date(new Date().toDateString())} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Daily Study Hours</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDailyHours(Math.max(0.5, dailyHours - 0.5))} className="w-10 h-10 rounded-xl bg-secondary text-foreground font-medium text-lg flex items-center justify-center hover:bg-secondary/80 transition-all">−</button>
                  <div className="flex-1 text-center">
                    <input type="number" value={dailyHours} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val >= 0.5 && val <= 16) setDailyHours(val); }}
                      min={0.5} max={16} step={0.5}
                      className="w-20 text-center px-2 py-2 rounded-xl bg-secondary text-foreground text-lg font-semibold border-0 outline-none focus:ring-2 focus:ring-foreground/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">hours/day</p>
                  </div>
                  <button onClick={() => setDailyHours(Math.min(16, dailyHours + 0.5))} className="w-10 h-10 rounded-xl bg-secondary text-foreground font-medium text-lg flex items-center justify-center hover:bg-secondary/80 transition-all">+</button>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!examDate} className="w-full py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-40">Next</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Select Subjects</h3>
            </div>
            {state.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No subjects yet. Create subjects first in the Subjects tab.</p>
            ) : (
              <div className="space-y-2">
                {state.subjects.map(subject => {
                  const selected = selectedSubjects.includes(subject.id);
                  const topicCount = subject.chapters.flatMap(c => c.topics).filter(t => !t.completed).length;
                  return (
                    <button key={subject.id} onClick={() => toggleSubject(subject.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selected ? "bg-foreground text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}>
                      <SubjectIcon name={subject.icon} className="w-4 h-4" />
                      <span className="flex-1 text-sm font-medium">{subject.name}</span>
                      <span className={`text-xs ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{topicCount} topics</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm">Back</button>
              <button onClick={generatePlan} disabled={selectedSubjects.length === 0} className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-40">Generate</button>
            </div>
          </motion.div>
        )}

        {step === 3 && generatedPlan && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-base">{generatedPlan.examName}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.max(0, Math.ceil((new Date(generatedPlan.examDate).getTime() - Date.now()) / 86400000))} days until exam
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-medium text-accent">{generatedPlan.dailyHours}h/day</span>
                  </div>
                  <button onClick={() => setDeletingPlanId(generatedPlan.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <p className="text-lg font-semibold">{generatedPlan.tasks.filter(t => t.type === "study").length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Study</p>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <p className="text-lg font-semibold">{generatedPlan.tasks.filter(t => t.type === "revision").length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Revision</p>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <p className="text-lg font-semibold">{Object.keys(tasksByDate).length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Days</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0 max-h-[55vh] overflow-y-auto scrollbar-hide pr-1">
              {Object.entries(tasksByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, tasks], idx) => {
                  const isToday = date === new Date().toISOString().split("T")[0];
                  return (
                    <div key={date} className="relative flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 z-10", isToday ? "bg-accent ring-4 ring-accent/20" : "bg-muted-foreground/30")} />
                        {idx < Object.keys(tasksByDate).length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-5">
                        <p className={cn("text-xs font-semibold mb-2", isToday ? "text-accent" : "text-muted-foreground")}>
                          {isToday ? "Today" : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <div className="space-y-1.5">
                          {tasks.map(task => (
                            <motion.div key={task.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(${getSubjectColor(task.subjectId)})` }} />
                              <span className="flex-1 text-sm truncate">{getTopicName(task.topicId)}</span>
                              {task.type === "revision" ? (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">Review</span>
                              ) : (
                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{task.estimatedMinutes}m</span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => { setViewingPlanId(null); setGeneratedPlan(null); setStep(0); }}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">← Back</button>
              <button onClick={resetWizard} className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">Create New</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyPlanPage;
