import { useState, useEffect, useRef, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  ping: number | null;
  checking: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    ping: null,
    checking: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkPing = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus(prev => ({ ...prev, isOnline: false, ping: null }));
      return;
    }
    setStatus(prev => ({ ...prev, checking: true }));
    try {
      const start = performance.now();
      await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-store",
      });
      const ping = Math.round(performance.now() - start);
      setStatus({ isOnline: true, ping, checking: false });
    } catch {
      setStatus({ isOnline: false, ping: null, checking: false });
    }
  }, []);

  useEffect(() => {
    const onOnline = () => { setStatus(prev => ({ ...prev, isOnline: true })); checkPing(); };
    const onOffline = () => setStatus({ isOnline: false, ping: null, checking: false });

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    checkPing();
    intervalRef.current = setInterval(checkPing, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkPing]);

  return status;
}
