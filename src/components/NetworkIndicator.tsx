import { Wifi, WifiOff, Signal } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { motion, AnimatePresence } from "framer-motion";

interface NetworkIndicatorProps {
  needsInternet?: boolean;
}

export function NetworkIndicator({ needsInternet = false }: NetworkIndicatorProps) {
  const { isOnline, ping } = useNetworkStatus();

  const getPingColor = () => {
    if (!ping) return "text-muted-foreground";
    if (ping < 100) return "text-[hsl(var(--success))]";
    if (ping < 300) return "text-[hsl(var(--warning))]";
    return "text-[hsl(var(--destructive))]";
  };

  const getPingDot = () => {
    if (!ping) return "bg-muted-foreground";
    if (ping < 100) return "bg-[hsl(var(--success))]";
    if (ping < 300) return "bg-[hsl(var(--warning))]";
    return "bg-[hsl(var(--destructive))]";
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? getPingDot() : "bg-[hsl(var(--destructive))]"} ${isOnline ? "" : "animate-pulse"}`} />
        {isOnline ? (
          <Wifi className={`w-3.5 h-3.5 ${getPingColor()}`} />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-[hsl(var(--destructive))]" />
        )}
        {isOnline && ping && (
          <span className={`text-[10px] font-medium tabular-nums ${getPingColor()}`}>{ping}ms</span>
        )}
      </div>

      <AnimatePresence>
        {!isOnline && needsInternet && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="text-[10px] text-[hsl(var(--destructive))] font-medium"
          >
            Offline — audio needs internet
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
