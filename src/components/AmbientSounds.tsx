import { useState, useRef, useEffect, useCallback } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, CloudRain, Wind, TreePine, Music, BookOpen, Play, Pause, SkipForward, ChevronDown, Loader2 } from "lucide-react";
import { FOCUS_MUSIC, QURAN_TILAWAT, type MusicTrack } from "@/data/focusMusic";

// Generate ambient sound using Web Audio API oscillators
function createAmbientNode(ctx: AudioContext, type: "rain" | "whitenoise" | "forest"): AudioNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "whitenoise") {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
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

interface AmbientSoundsProps {
  isPlaying: boolean;
  currentMode: "focus" | "break";
}

type AudioSource = "none" | "rain" | "whitenoise" | "forest" | "music" | "quran";

export function AmbientSounds({ isPlaying, currentMode }: AmbientSoundsProps) {
  const { state } = useStudy();
  const [showPicker, setShowPicker] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [audioSource, setAudioSource] = useState<AudioSource>("none");
  const [activeTab, setActiveTab] = useState<"sounds" | "music" | "quran">("sounds");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const [musicCategory, setMusicCategory] = useState<"focus" | "break">("focus");
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Sync music category with timer mode
  useEffect(() => {
    setMusicCategory(currentMode);
  }, [currentMode]);

  const filteredMusic = FOCUS_MUSIC.filter(t => t.category === musicCategory);
  const currentMusicTrack = audioSource === "music" ? filteredMusic[currentTrackIndex % filteredMusic.length] : null;
  const currentQuranTrack = audioSource === "quran" ? QURAN_TILAWAT[currentTrackIndex % QURAN_TILAWAT.length] : null;
  const activeTrack = currentMusicTrack || currentQuranTrack;

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
    if (isPlaying && ["rain", "whitenoise", "forest"].includes(audioSource)) {
      startSound(audioSource as "rain" | "whitenoise" | "forest");
    } else {
      stopSound();
    }
    return stopSound;
  }, [isPlaying, audioSource]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // Auto-play/pause YouTube track with timer
  useEffect(() => {
    if (isPlaying && (audioSource === "music" || audioSource === "quran")) {
      setIsTrackPlaying(true);
    } else if (!isPlaying) {
      setIsTrackPlaying(false);
    }
  }, [isPlaying, audioSource]);

  const selectSource = (src: AudioSource) => {
    setAudioSource(src);
    setCurrentTrackIndex(0);
    if (src === "music" || src === "quran") {
      setIsTrackPlaying(isPlaying);
    }
  };

  const nextTrack = () => {
    const list = audioSource === "quran" ? QURAN_TILAWAT : filteredMusic;
    setCurrentTrackIndex(prev => (prev + 1) % list.length);
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsTrackPlaying(isPlaying);
  };

  const sounds = [
    { id: "none" as const, label: "Off", icon: VolumeX },
    { id: "rain" as const, label: "Rain", icon: CloudRain },
    { id: "whitenoise" as const, label: "Noise", icon: Wind },
    { id: "forest" as const, label: "Forest", icon: TreePine },
  ];

  const isYoutubeActive = (audioSource === "music" || audioSource === "quran") && isTrackPlaying && activeTrack;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`p-2 rounded-lg transition-colors ${
          audioSource !== "none" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
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
            className="absolute top-full mt-2 right-0 glass-card p-3 space-y-3 min-w-[280px] max-w-[320px] z-50 max-h-[70vh] overflow-y-auto scrollbar-hide"
          >
            {/* Tabs */}
            <div className="flex gap-1 bg-secondary/80 rounded-xl p-1">
              {(["sounds", "music", "quran"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === tab ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "sounds" && <Wind className="w-3 h-3" />}
                  {tab === "music" && <Music className="w-3 h-3" />}
                  {tab === "quran" && <BookOpen className="w-3 h-3" />}
                  {tab === "sounds" ? "Sounds" : tab === "music" ? "Music" : "Quran"}
                </button>
              ))}
            </div>

            {/* SOUNDS TAB */}
            {activeTab === "sounds" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {sounds.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => selectSource(sound.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        audioSource === sound.id
                          ? "bg-foreground text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <sound.icon className="w-3.5 h-3.5" />
                      {sound.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MUSIC TAB */}
            {activeTab === "music" && (
              <div className="space-y-2">
                {/* Focus / Break category toggle */}
                <div className="flex gap-1 bg-secondary/60 rounded-lg p-0.5">
                  <button
                    onClick={() => { setMusicCategory("focus"); setCurrentTrackIndex(0); }}
                    className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      musicCategory === "focus" ? "bg-foreground text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    🧠 Focus
                  </button>
                  <button
                    onClick={() => { setMusicCategory("break"); setCurrentTrackIndex(0); }}
                    className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      musicCategory === "break" ? "bg-foreground text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    ☕ Break
                  </button>
                </div>

                {/* Now Playing */}
                {audioSource === "music" && currentMusicTrack && (
                  <div className="bg-secondary/60 rounded-xl p-2.5 flex items-center gap-2">
                    <button
                      onClick={() => setIsTrackPlaying(!isTrackPlaying)}
                      className="w-7 h-7 rounded-full bg-foreground text-primary-foreground flex items-center justify-center flex-shrink-0"
                    >
                      {isTrackPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">Now Playing</p>
                      <p className="text-xs font-medium truncate">{currentMusicTrack.title}</p>
                    </div>
                    <button onClick={nextTrack} className="p-1 hover:bg-secondary rounded">
                      <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Track List */}
                <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-hide">
                  {filteredMusic.map((track, i) => (
                    <button
                      key={track.id}
                      onClick={() => { selectSource("music"); selectTrack(i); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors text-xs ${
                        audioSource === "music" && currentTrackIndex === i
                          ? "bg-secondary font-medium"
                          : "hover:bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <Music className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{track.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QURAN TAB */}
            {activeTab === "quran" && (
              <div className="space-y-2">
                {/* Now Playing */}
                {audioSource === "quran" && currentQuranTrack && (
                  <div className="bg-secondary/60 rounded-xl p-2.5 flex items-center gap-2">
                    <button
                      onClick={() => setIsTrackPlaying(!isTrackPlaying)}
                      className="w-7 h-7 rounded-full bg-foreground text-primary-foreground flex items-center justify-center flex-shrink-0"
                    >
                      {isTrackPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">তিলাওয়াত চলছে</p>
                      <p className="text-xs font-medium truncate">{currentQuranTrack.title}</p>
                    </div>
                    <button onClick={nextTrack} className="p-1 hover:bg-secondary rounded">
                      <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Quran List */}
                <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-hide">
                  {QURAN_TILAWAT.map((track, i) => (
                    <button
                      key={track.id}
                      onClick={() => { selectSource("quran"); selectTrack(i); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors text-xs ${
                        audioSource === "quran" && currentTrackIndex === i
                          ? "bg-secondary font-medium"
                          : "hover:bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <BookOpen className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{track.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Volume — for ambient sounds only */}
            {["rain", "whitenoise", "forest"].includes(audioSource) && (
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

      {/* Hidden YouTube audio player — NO video shown */}
      {isYoutubeActive && activeTrack && (
        <iframe
          src={`https://www.youtube.com/embed/${activeTrack.youtubeId}?autoplay=1&loop=1&playlist=${activeTrack.youtubeId}`}
          allow="autoplay"
          className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none"
          title="Audio Player"
        />
      )}
    </div>
  );
}
