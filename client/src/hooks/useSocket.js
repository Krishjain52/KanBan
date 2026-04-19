import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useBoardStore from '../store/boardStore';

let socketInstance = null;

export function useSocket(boardId) {
  const socketRef = useRef(null);
  const {
    handleSocketTaskCreated,
    handleSocketTaskDeleted,
    handleSocketTaskMoved,
    handleSocketTaskUpdated,
    handleSocketColumnCreated,
    handleSocketColumnDeleted,
  } = useBoardStore();

  useEffect(() => {
    const token = localStorage.getItem('kanban_token');
    if (!token || !boardId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    // Reuse existing socket connection
    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    const onConnect = () => {
      console.log('Socket connected:', socket.id);
      socket.emit('board:join', { boardId });
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
    };

    const onError = (err) => {
      console.error('Socket error:', err);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('task:created', handleSocketTaskCreated);
    socket.on('task:deleted', handleSocketTaskDeleted);
    socket.on('task:moved', handleSocketTaskMoved);
    socket.on('task:updated', handleSocketTaskUpdated);
    socket.on('column:created', handleSocketColumnCreated);
    socket.on('column:deleted', handleSocketColumnDeleted);

    // If already connected, join board immediately
    if (socket.connected) {
      socket.emit('board:join', { boardId });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('task:created', handleSocketTaskCreated);
      socket.off('task:deleted', handleSocketTaskDeleted);
      socket.off('task:moved', handleSocketTaskMoved);
      socket.off('task:updated', handleSocketTaskUpdated);
      socket.off('column:created', handleSocketColumnCreated);
      socket.off('column:deleted', handleSocketColumnDeleted);
    };
  }, [boardId]);

  const emitTaskMove = (taskId, targetColumnId, newOrder) => {
    socketRef.current?.emit('task:move', {
      taskId,
      targetColumnId,
      newOrder,
      boardId,
    });
  };

  return { socket: socketRef.current, emitTaskMove };
}
