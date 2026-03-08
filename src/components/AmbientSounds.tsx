import { useState, useRef, useEffect, useCallback } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, CloudRain, Wind, TreePine } from "lucide-react";

// Generate ambient sound using Web Audio API oscillators
function createAmbientNode(ctx: AudioContext, type: "rain" | "whitenoise" | "forest"): AudioNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "whitenoise") {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === "rain") {
    // Brown noise (low-frequency rumble like rain)
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else {
    // Pink-ish noise (nature/forest feel)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  source.connect(gain);
  source.start();

  return gain;
}

interface AmbientSoundsProps {
  isPlaying: boolean;
}

export function AmbientSounds({ isPlaying }: AmbientSoundsProps) {
  const { state, updateSettings } = useStudy();
  const { ambientSound } = state.settings;
  const [showPicker, setShowPicker] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopSound = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
      nodeRef.current = null;
      gainRef.current = null;
    }
  }, []);

  const startSound = useCallback((type: "rain" | "whitenoise" | "forest") => {
    stopSound();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const node = createAmbientNode(ctx, type);
    nodeRef.current = node;
    // node is already a GainNode
    gainRef.current = node as GainNode;
    (node as GainNode).gain.value = volume;
    node.connect(ctx.destination);
  }, [stopSound, volume]);

  useEffect(() => {
    if (isPlaying && ambientSound !== "none") {
      startSound(ambientSound);
    } else {
      stopSound();
    }
    return stopSound;
  }, [isPlaying, ambientSound]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  const sounds = [
    { id: "none" as const, label: "Off", icon: VolumeX },
    { id: "rain" as const, label: "Rain", icon: CloudRain },
    { id: "whitenoise" as const, label: "Noise", icon: Wind },
    { id: "forest" as const, label: "Forest", icon: TreePine },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`p-2 rounded-lg transition-colors ${
          ambientSound !== "none" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Volume2 className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-full mb-2 right-0 glass-card p-3 space-y-3 min-w-[180px] z-50"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ambient Sound</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => updateSettings({ ambientSound: sound.id })}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    ambientSound === sound.id
                      ? "bg-foreground text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <sound.icon className="w-3.5 h-3.5" />
                  {sound.label}
                </button>
              ))}
            </div>
            {ambientSound !== "none" && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Volume</p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full h-1 accent-foreground"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
