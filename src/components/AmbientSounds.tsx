import { useState, useRef, useEffect, useCallback } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, CloudRain, Wind, TreePine, Youtube, X, Link } from "lucide-react";

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
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else {
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface AmbientSoundsProps {
  isPlaying: boolean;
}

export function AmbientSounds({ isPlaying }: AmbientSoundsProps) {
  const { state, updateSettings } = useStudy();
  const { ambientSound, youtubeUrl } = state.settings;
  const [showPicker, setShowPicker] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [ytInput, setYtInput] = useState(youtubeUrl || "");
  const [showYoutube, setShowYoutube] = useState(false);
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
    gainRef.current = node as GainNode;
    (node as GainNode).gain.value = volume;
    node.connect(ctx.destination);
  }, [stopSound, volume]);

  useEffect(() => {
    if (isPlaying && ambientSound !== "none" && ambientSound !== "youtube" as string) {
      startSound(ambientSound as "rain" | "whitenoise" | "forest");
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

  const ytId = extractYouTubeId(youtubeUrl || "");
  const isYoutubeMode = ambientSound === ("youtube" as string);

  const setYoutubeUrl = () => {
    const id = extractYouTubeId(ytInput);
    if (id) {
      updateSettings({ youtubeUrl: ytInput, ambientSound: "youtube" as any });
      setShowYoutube(false);
    }
  };

  const clearYoutube = () => {
    updateSettings({ youtubeUrl: "", ambientSound: "none" });
    setYtInput("");
  };

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
            className="absolute bottom-full mb-2 right-0 glass-card p-3 space-y-3 min-w-[220px] z-50"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ambient Sound</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => updateSettings({ ambientSound: sound.id })}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    ambientSound === sound.id && !isYoutubeMode
                      ? "bg-foreground text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <sound.icon className="w-3.5 h-3.5" />
                  {sound.label}
                </button>
              ))}
            </div>

            {/* YouTube / Custom Audio */}
            <div className="border-t border-border/50 pt-2 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">YouTube / কুরআন</p>

              {ytId && isYoutubeMode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    <span className="text-xs truncate flex-1">{youtubeUrl}</span>
                    <button onClick={clearYoutube} className="p-1 hover:bg-secondary rounded">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ) : showYoutube ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="YouTube link paste করো"
                      value={ytInput}
                      onChange={e => setYtInput(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-secondary text-foreground border-0 outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={setYoutubeUrl}
                      disabled={!extractYouTubeId(ytInput)}
                      className="px-2 py-1.5 rounded-lg bg-foreground text-primary-foreground text-xs font-medium disabled:opacity-40"
                    >
                      <Link className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Music, Quran, Lo-fi ইত্যাদি চালাতে পারো</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowYoutube(true)}
                  className={`flex items-center gap-1.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isYoutubeMode
                      ? "bg-foreground text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5" />
                  YouTube Link দাও
                </button>
              )}
            </div>

            {/* Volume */}
            {(ambientSound !== "none" || isYoutubeMode) && !isYoutubeMode && (
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

      {/* YouTube iframe (hidden audio player) */}
      {isPlaying && isYoutubeMode && ytId && (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}`}
          allow="autoplay"
          className="fixed bottom-20 right-4 w-64 h-36 rounded-xl shadow-lg z-40 md:bottom-4"
          title="YouTube Player"
        />
      )}
    </div>
  );
}
