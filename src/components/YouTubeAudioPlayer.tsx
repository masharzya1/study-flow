import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface YouTubeAudioPlayerProps {
  videoId: string;
  isPlaying: boolean;
  repeat: boolean;
  onReady?: () => void;
  onEnded?: () => void;
  onError?: () => void;
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoaded) return;
    apiLoaded = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    };
  });
}

export function YouTubeAudioPlayer({ videoId, isPlaying, repeat, onReady, onEnded, onError }: YouTubeAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoIdRef = useRef(videoId);
  const isPlayingRef = useRef(isPlaying);
  const playerReadyRef = useRef(false);

  // Keep ref in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (destroyed || !containerRef.current) return;

      const el = document.createElement("div");
      containerRef.current.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            playerReadyRef.current = true;
            onReady?.();
            if (isPlayingRef.current) e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (repeat) {
                e.target.seekTo(0);
                e.target.playVideo();
              } else {
                onEnded?.();
              }
            }
          },
          onError: () => {
            onError?.();
          },
        },
      });
    };

    init();
    return () => {
      destroyed = true;
      playerReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // Handle video changes
  useEffect(() => {
    if (videoId !== videoIdRef.current) {
      videoIdRef.current = videoId;
      if (playerReadyRef.current && playerRef.current?.loadVideoById) {
        playerRef.current.loadVideoById(videoId);
      }
    }
  }, [videoId]);

  // Handle play/pause
  useEffect(() => {
    const p = playerRef.current;
    if (!playerReadyRef.current || !p?.getPlayerState) return;
    if (isPlaying) {
      p.playVideo();
    } else {
      p.pauseVideo();
    }
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 w-px h-px overflow-hidden opacity-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  );
}
