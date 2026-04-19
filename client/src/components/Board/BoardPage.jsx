import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoard } from '../../hooks/useBoard';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import useBoardStore from '../../store/boardStore';
import Column from './Column';
import TaskCard from './TaskCard';
import styles from './BoardPage.module.css';

export default function BoardPage() {
  const { boardId } = useParams();
  const { board, loading, error, addColumn, deleteColumn, updateColumn, createTask, updateTask, deleteTask } = useBoard(boardId);
  const { moveTask } = useBoardStore();
  const { user, logout } = useAuth();
  const { emitTaskMove } = useSocket(boardId);

  const [activeTask, setActiveTask] = useState(null);
  const [activeSourceColumnId, setActiveSourceColumnId] = useState(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    if (!board) return;
    for (const col of board.columns) {
      const task = col.tasks.find(t => t.id === active.id);
      if (task) {
        setActiveTask(task);
        setActiveSourceColumnId(col.id);
        break;
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveSourceColumnId(null);
    if (!over || !board) return;

    const taskId = active.id;
    let targetColumnId = null;
    let newOrder = null;

    // Check if dropped on a column
    const targetCol = board.columns.find(c => c.id === over.id);
    if (targetCol) {
      targetColumnId = targetCol.id;
      newOrder = targetCol.tasks.length;
    } else {
      // Dropped on a task — find which column it belongs to
      for (const col of board.columns) {
        const taskIdx = col.tasks.findIndex(t => t.id === over.id);
        if (taskIdx !== -1) {
          targetColumnId = col.id;
          newOrder = taskIdx;
          break;
        }
      }
    }

    if (!targetColumnId) return;

    const sourceCol = board.columns.find(c => c.tasks.find(t => t.id === taskId));
    if (!sourceCol) return;

    moveTask(taskId, sourceCol.id, targetColumnId, newOrder);
    emitTaskMove(taskId, targetColumnId, newOrder);
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await addColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setAddingColumn(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingText}>Loading board…</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className={styles.errorPage}>
        <p>{error || 'Board not found'}</p>
        <Link to="/boards">← Back to boards</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/boards" className={styles.backBtn}>
            <span>←</span>
          </Link>
          <div className={styles.logoMark}>K</div>
          <h1 className={styles.boardTitle}>{board.title}</h1>
          <span className={styles.colCount}>{board.columns.length} columns</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userChip}>{user?.name?.[0] || user?.email?.[0] || '?'}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          <AnimatePresence>
            {board.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onDeleteColumn={deleteColumn}
                onUpdateColumn={updateColumn}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            ))}
          </AnimatePresence>

          {/* Add Column */}
          <div className={styles.addColumnWrapper}>
            <AnimatePresence mode="wait">
              {addingColumn ? (
                <motion.form
                  key="form"
                  className={styles.addColumnForm}
                  onSubmit={handleAddColumn}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    className={styles.addColumnInput}
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Column name…"
                    autoFocus
                  />
                  <div className={styles.addColumnActions}>
                    <button className={styles.addColSubmit} type="submit">Add</button>
                    <button
                      className={styles.addColCancel}
                      type="button"
                      onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                    >
                      ×
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.button
                  key="btn"
                  className={styles.addColumnBtn}
                  onClick={() => setAddingColumn(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>+</span> Add column
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Drag overlay — shows dragged card floating */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              columnId={activeSourceColumnId}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
