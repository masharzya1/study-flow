import { useEffect, useRef, useState } from "react";

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

export function YouTubeAudioPlayer({ videoId, isPlaying, repeat, onReady, onEnded }: YouTubeAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoIdRef = useRef(videoId);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (destroyed || !containerRef.current) return;

      // Create a child div for the player
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
        },
        events: {
          onReady: (e: any) => {
            onReady?.();
            if (isPlaying) e.target.playVideo();
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
        },
      });
    };

    init();
    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // Handle video changes
  useEffect(() => {
    if (videoId !== videoIdRef.current) {
      videoIdRef.current = videoId;
      playerRef.current?.loadVideoById(videoId);
      onReady?.(); // Will fire again via onReady event
    }
  }, [videoId]);

  // Handle play/pause
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.getPlayerState) return;
    if (isPlaying) {
      p.playVideo();
    } else {
      p.pauseVideo();
    }
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
