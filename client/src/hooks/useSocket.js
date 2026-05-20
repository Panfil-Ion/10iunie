import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room') || 'sync-protocol';
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [slot, setSlot] = useState(null);
  const [state, setState] = useState(null);
  const [peerTyping, setPeerTyping] = useState({ name: '', date: '' });
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', { roomId: getRoomId() });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('joined', ({ slot: s }) => setSlot(s));

    socket.on('state', (s) => setState(s));

    socket.on('peer-typing', ({ field, value }) => {
      setPeerTyping((prev) => ({ ...prev, [field]: value }));
    });

    socket.on('error', ({ message }) => setError(message));

    return () => socket.disconnect();
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, slot, state, peerTyping, error, emit };
}
