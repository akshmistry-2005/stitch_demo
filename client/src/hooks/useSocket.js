import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
});

export function useSocket(onEvent) {
  const socketRef = useRef(null);
  const { user, gym } = useAuth();

  useEffect(() => {
    if (!gym?.id) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      socket.emit('join:gym', gym.id);
    });

    // Song request events
    socket.on('song:new-request', (data) => {
      onEvent?.('song:new-request', data);
    });
    socket.on('song:status-update', (data) => {
      onEvent?.('song:status-update', data);
    });
    socket.on('song:queue-update', (data) => {
      onEvent?.('song:queue-update', data);
    });

    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

    return () => {
      socket.emit('leave:gym', gym.id);
      socket.disconnect();
    };
  }, [gym?.id]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef.current };
}
