import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export function TodayTasks() {
  const { state, toggleTopicComplete } = useStudy();

  const allTopics = state.subjects.flatMap(s =>
    s.chapters.flatMap(c =>
      c.topics.map(t => ({ ...t, subjectName: s.name, subjectColor: s.color, subjectId: s.id, chapterId: c.id }))
    )
  );

  const incomplete = allTopics.filter(t => !t.completed).slice(0, 5);
  const recentComplete = allTopics.filter(t => t.completed).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5"
    >
      <h2 className="font-display font-semibold text-lg mb-4">Today's Tasks</h2>
      {incomplete.length === 0 && recentComplete.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Add subjects and topics to see your tasks here.
        </p>
      ) : (
        <div className="space-y-2">
          {incomplete.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopicComplete(topic.subjectId, topic.chapterId, topic.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
            >
              <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{topic.name}</p>
                <p className="text-xs text-muted-foreground">{topic.subjectName}</p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {topic.estimatedMinutes}m
              </span>
            </button>
          ))}
          {recentComplete.slice(0, 2).map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopicComplete(topic.subjectId, topic.chapterId, topic.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg opacity-50 text-left"
            >
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm line-through truncate">{topic.name}</p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
