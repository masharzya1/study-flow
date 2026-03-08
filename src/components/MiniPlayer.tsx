import { motion } from "framer-motion";
import { Music, BookOpen, Pause, Play, SkipForward } from "lucide-react";

interface MiniPlayerProps {
  trackTitle: string;
  type: "music" | "quran";
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
}

export function MiniPlayer({ trackTitle, type, isPlaying, isLoading, onTogglePlay, onNext }: MiniPlayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-30"
    >
      <div className="glass-card-elevated px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          {type === "quran" ? <BookOpen className="w-4 h-4 text-muted-foreground" /> : <Music className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {isLoading ? "Loading..." : type === "quran" ? "তিলাওয়াত" : "Now Playing"}
          </p>
          <p className="text-xs font-medium truncate">{trackTitle}</p>
          {isLoading && (
            <div className="w-full h-0.5 bg-secondary rounded-full overflow-hidden mt-1">
              <motion.div
                className="h-full bg-foreground rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 3, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-foreground text-primary-foreground flex items-center justify-center flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <button onClick={onNext} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
