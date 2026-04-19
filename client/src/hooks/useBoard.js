import { useEffect } from 'react';
import useBoardStore from '../store/boardStore';

export function useBoard(boardId) {
  const {
    currentBoard,
    loading,
    error,
    fetchBoard,
    addColumn,
    deleteColumn,
    updateColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useBoardStore();

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId]);

  return {
    board: currentBoard,
    loading,
    error,
    addColumn: (title) => addColumn(boardId, title),
    deleteColumn,
    updateColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch: () => fetchBoard(boardId),
  };
}
