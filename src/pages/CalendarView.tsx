import { useState, useMemo } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, BookOpen, RotateCcw } from "lucide-react";

const CalendarView = () => {
  const { state } = useStudy();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Aggregate data for each day
  const dayData = useMemo(() => {
    const data: Record<string, { minutes: number; sessions: number; tasks: { name: string; type: string; subjectColor: string }[] }> = {};

    // Sessions
    state.sessions.forEach(s => {
      if (!s.completed) return;
      const day = s.startTime.split("T")[0];
      if (!data[day]) data[day] = { minutes: 0, sessions: 0, tasks: [] };
      data[day].minutes += s.durationMinutes;
      data[day].sessions++;
    });

    // Planned tasks
    state.studyPlans.forEach(plan => {
      plan.tasks.forEach(task => {
        if (!data[task.date]) data[task.date] = { minutes: 0, sessions: 0, tasks: [] };
        const subject = state.subjects.find(s => s.id === task.subjectId);
        let topicName = "Topic";
        for (const s of state.subjects) {
          for (const c of s.chapters) {
            const t = c.topics.find(t => t.id === task.topicId);
            if (t) { topicName = t.name; break; }
          }
        }
        data[task.date].tasks.push({
          name: topicName,
          type: task.type,
          subjectColor: subject?.color || "220 15% 25%",
        });
      });
    });

    return data;
  }, [state.sessions, state.studyPlans, state.subjects]);

  // Exam dates
  const examDates = useMemo(() => {
    const dates: Record<string, string> = {};
    state.studyPlans.forEach(p => { dates[p.examDate] = p.examName; });
    return dates;
  }, [state.studyPlans]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const selectedDayData = selectedDay ? dayData[selectedDay] : null;

  // Days until next exam
  const nextExam = useMemo(() => {
    const upcoming = state.studyPlans
      .filter(p => new Date(p.examDate) >= new Date())
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    if (upcoming.length === 0) return null;
    const days = Math.ceil((new Date(upcoming[0].examDate).getTime() - Date.now()) / 86400000);
    return { name: upcoming[0].examName, days };
  }, [state.studyPlans]);

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto space-y-6 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your study schedule</p>
      </motion.div>

      {/* Exam Countdown */}
      {nextExam && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm">{nextExam.name}</p>
              <p className="text-xs text-muted-foreground">{nextExam.days} days remaining</p>
            </div>
            <div className="ml-auto text-2xl font-semibold tabular-nums">{nextExam.days}</div>
          </div>
        </motion.div>
      )}

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-sm">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = dayData[dateStr];
            const isToday = dateStr === today;
            const isExam = examDates[dateStr];
            const isSelected = selectedDay === dateStr;
            const hasTasks = data && data.tasks.length > 0;
            const hasActivity = data && data.minutes > 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected ? "bg-foreground text-primary-foreground" :
                  isToday ? "bg-accent/15 text-foreground font-semibold" :
                  isExam ? "bg-destructive/10 text-destructive font-semibold" :
                  "hover:bg-secondary"
                }`}
              >
                <span className="text-xs">{day}</span>
                {(hasTasks || hasActivity) && !isSelected && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasActivity && <div className="w-1 h-1 rounded-full bg-success" />}
                    {hasTasks && <div className="w-1 h-1 rounded-full bg-accent" />}
                  </div>
                )}
                {isExam && !isSelected && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success" /> Studied
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent" /> Planned
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-destructive" /> Exam
          </div>
        </div>
      </motion.div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 space-y-3"
        >
          <p className="font-medium text-sm">
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          {examDates[selectedDay] && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{examDates[selectedDay]}</span>
            </div>
          )}

          {selectedDayData ? (
            <>
              {selectedDayData.minutes > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedDayData.minutes} min studied · {selectedDayData.sessions} sessions</span>
                </div>
              )}
              {selectedDayData.tasks.length > 0 && (
                <div className="space-y-1">
                  {selectedDayData.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(${task.subjectColor})` }} />
                      <span className="flex-1 truncate">{task.name}</span>
                      {task.type === "revision" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent flex items-center gap-0.5">
                          <RotateCcw className="w-2.5 h-2.5" /> Review
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No activity</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CalendarView;
