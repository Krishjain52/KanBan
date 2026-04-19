import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '../services/api';

const useBoardStore = create(
  immer((set, get) => ({
    boards: [],
    currentBoard: null,
    loading: false,
    error: null,

    // ── Boards ──────────────────────────────────────────────
    fetchBoards: async () => {
      set({ loading: true, error: null });
      try {
        const { data } = await api.get('/boards');
        set({ boards: data, loading: false });
      } catch (err) {
        set({ error: err.response?.data?.message || 'Failed to fetch boards', loading: false });
      }
    },

    fetchBoard: async (boardId) => {
      set({ loading: true, error: null });
      try {
        const { data } = await api.get(`/boards/${boardId}`);
        set({ currentBoard: data, loading: false });
      } catch (err) {
        set({ error: err.response?.data?.message || 'Failed to fetch board', loading: false });
      }
    },

    createBoard: async (title) => {
      const { data } = await api.post('/boards', { title });
      set((state) => { state.boards.unshift(data); });
      return data;
    },

    deleteBoard: async (boardId) => {
      await api.delete(`/boards/${boardId}`);
      set((state) => {
        state.boards = state.boards.filter(b => b.id !== boardId);
        if (state.currentBoard?.id === boardId) state.currentBoard = null;
      });
    },

    // ── Columns ─────────────────────────────────────────────
    addColumn: async (boardId, title) => {
      const { data } = await api.post('/columns', { boardId, title });
      set((state) => {
        if (state.currentBoard?.id === boardId) {
          state.currentBoard.columns.push(data);
        }
      });
      return data;
    },

    deleteColumn: async (columnId) => {
      await api.delete(`/columns/${columnId}`);
      set((state) => {
        if (state.currentBoard) {
          state.currentBoard.columns = state.currentBoard.columns.filter(c => c.id !== columnId);
        }
      });
    },

    updateColumn: async (columnId, title) => {
      const { data } = await api.put(`/columns/${columnId}`, { title });
      set((state) => {
        if (state.currentBoard) {
          const col = state.currentBoard.columns.find(c => c.id === columnId);
          if (col) col.title = data.title;
        }
      });
    },

    // ── Tasks ────────────────────────────────────────────────
    createTask: async (columnId, taskData) => {
      const { data } = await api.post('/tasks', { columnId, ...taskData });
      set((state) => {
        if (state.currentBoard) {
          const col = state.currentBoard.columns.find(c => c.id === columnId);
          if (col) col.tasks.push(data);
        }
      });
      return data;
    },

    updateTask: async (taskId, updates) => {
      const { data } = await api.put(`/tasks/${taskId}`, updates);
      set((state) => {
        if (state.currentBoard) {
          for (const col of state.currentBoard.columns) {
            const idx = col.tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) { col.tasks[idx] = data; break; }
          }
        }
      });
      return data;
    },

    deleteTask: async (taskId, columnId) => {
      await api.delete(`/tasks/${taskId}`);
      set((state) => {
        if (state.currentBoard) {
          const col = state.currentBoard.columns.find(c => c.id === columnId);
          if (col) col.tasks = col.tasks.filter(t => t.id !== taskId);
        }
      });
    },

    moveTask: async (taskId, sourceColumnId, targetColumnId, newOrder) => {
      // Optimistic update first
      set((state) => {
        if (!state.currentBoard) return;
        const srcCol = state.currentBoard.columns.find(c => c.id === sourceColumnId);
        const tgtCol = state.currentBoard.columns.find(c => c.id === targetColumnId);
        if (!srcCol || !tgtCol) return;

        const taskIdx = srcCol.tasks.findIndex(t => t.id === taskId);
        if (taskIdx === -1) return;
        const [task] = srcCol.tasks.splice(taskIdx, 1);
        // Re-order source
        srcCol.tasks.forEach((t, i) => t.order = i);

        const insertAt = newOrder ?? tgtCol.tasks.length;
        tgtCol.tasks.splice(insertAt, 0, { ...task, columnId: targetColumnId });
        tgtCol.tasks.forEach((t, i) => t.order = i);
      });

      // Persist to server
      try {
        await api.post(`/tasks/${taskId}/move`, { targetColumnId, newOrder });
      } catch (err) {
        // Revert on failure by refetching
        const boardId = get().currentBoard?.id;
        if (boardId) get().fetchBoard(boardId);
      }
    },

    // ── Socket event handlers ────────────────────────────────
    handleSocketTaskCreated: ({ task, columnId }) => {
      set((state) => {
        if (!state.currentBoard) return;
        const col = state.currentBoard.columns.find(c => c.id === columnId);
        if (col && !col.tasks.find(t => t.id === task.id)) {
          col.tasks.push(task);
        }
      });
    },

    handleSocketTaskDeleted: ({ taskId, columnId }) => {
      set((state) => {
        if (!state.currentBoard) return;
        const col = state.currentBoard.columns.find(c => c.id === columnId);
        if (col) col.tasks = col.tasks.filter(t => t.id !== taskId);
      });
    },

    handleSocketTaskMoved: ({ task, sourceColumnId, targetColumnId, newOrder }) => {
      set((state) => {
        if (!state.currentBoard) return;
        const srcCol = state.currentBoard.columns.find(c => c.id === sourceColumnId);
        const tgtCol = state.currentBoard.columns.find(c => c.id === targetColumnId);
        if (!srcCol || !tgtCol) return;

        srcCol.tasks = srcCol.tasks.filter(t => t.id !== task.id);
        srcCol.tasks.forEach((t, i) => t.order = i);

        const insertAt = newOrder ?? tgtCol.tasks.length;
        const exists = tgtCol.tasks.findIndex(t => t.id === task.id);
        if (exists !== -1) tgtCol.tasks.splice(exists, 1);
        tgtCol.tasks.splice(insertAt, 0, { ...task, columnId: targetColumnId });
        tgtCol.tasks.forEach((t, i) => t.order = i);
      });
    },

    handleSocketTaskUpdated: (task) => {
      set((state) => {
        if (!state.currentBoard) return;
        for (const col of state.currentBoard.columns) {
          const idx = col.tasks.findIndex(t => t.id === task.id);
          if (idx !== -1) { col.tasks[idx] = task; break; }
        }
      });
    },

    handleSocketColumnCreated: (column) => {
      set((state) => {
        if (!state.currentBoard) return;
        if (!state.currentBoard.columns.find(c => c.id === column.id)) {
          state.currentBoard.columns.push({ ...column, tasks: column.tasks || [] });
        }
      });
    },

    handleSocketColumnDeleted: ({ columnId }) => {
      set((state) => {
        if (!state.currentBoard) return;
        state.currentBoard.columns = state.currentBoard.columns.filter(c => c.id !== columnId);
      });
    },
  }))
);

export default useBoardStore;
