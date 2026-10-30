import { useEffect, useRef, useState } from 'react';

function buildSocketUrl(token) {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  const fallbackUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  const url = new URL(configuredUrl || fallbackUrl, window.location.origin);

  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  url.searchParams.set('token', token);

  return url.toString();
}

export function useTaskSocket({ token, onEvent, onOpen, onAuthError }) {
  const [status, setStatus] = useState('connecting');
  const callbacksRef = useRef({ onEvent, onOpen, onAuthError });

  useEffect(() => {
    callbacksRef.current = { onEvent, onOpen, onAuthError };
  }, [onAuthError, onEvent, onOpen]);

  useEffect(() => {
    if (!token) {
      setStatus('offline');
      return undefined;
    }

    let disposed = false;
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;

    const scheduleReconnect = () => {
      if (disposed) return;

      const delay = Math.min(1000 * 2 ** reconnectAttempts, 10000);
      reconnectAttempts += 1;
      setStatus('reconnecting');
      reconnectTimer = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;

      setStatus('connecting');
      socket = new WebSocket(buildSocketUrl(token));

      socket.onopen = () => {
        if (disposed) return;
        reconnectAttempts = 0;
        setStatus('open');
        callbacksRef.current.onOpen?.();
      };

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data);
          if (event?.type) {
            callbacksRef.current.onEvent?.(event);
          }
        } catch {
          return;
        }
      };

      socket.onclose = (event) => {
        socket = null;
        if (disposed) return;

        if (event.code === 1008) {
          setStatus('unauthorized');
          callbacksRef.current.onAuthError?.();
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      socket?.close(1000, 'Component unmounted');
    };
  }, [token]);

  return status;
}
