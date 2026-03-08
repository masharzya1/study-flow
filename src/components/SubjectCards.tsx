import { useStudy } from "@/contexts/StudyContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export function SubjectCards() {
  const { state, getSubjectProgress } = useStudy();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg">Subjects</h2>
        <button
          onClick={() => navigate("/subjects")}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {state.subjects.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No subjects yet. Create your first subject!
        </p>
      ) : (
        <div className="space-y-3">
          {state.subjects.map(subject => {
            const progress = getSubjectProgress(subject.id);
            return (
              <button
                key={subject.id}
                onClick={() => navigate("/subjects")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="text-xl">{subject.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{subject.name}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: `hsl(${subject.color})`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
