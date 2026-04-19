import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import styles from './Column.module.css';

const columnVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -20, scale: 0.96, transition: { duration: 0.2 } },
};

export default function Column({ column, onDeleteColumn, onUpdateColumn, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const titleInputRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = column.tasks.map(t => t.id);

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== column.title) {
      await onUpdateColumn(column.id, titleValue.trim());
    } else {
      setTitleValue(column.title);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await onCreateTask(column.id, { title: newTaskTitle.trim(), priority: 'MEDIUM' });
    setNewTaskTitle('');
    setAddingTask(false);
  };

  return (
    <motion.div
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
      variants={columnVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      {/* Column header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className={styles.titleInput}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') titleInputRef.current?.blur();
                if (e.key === 'Escape') { setTitleValue(column.title); setEditingTitle(false); }
              }}
              autoFocus
            />
          ) : (
            <h2
              className={styles.title}
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
            >
              {column.title}
            </h2>
          )}
          <span className={styles.count}>{column.tasks.length}</span>
        </div>
        <button
          className={styles.deleteColBtn}
          onClick={() => {
            if (confirm(`Delete "${column.title}"? All tasks will be lost.`)) {
              onDeleteColumn(column.id);
            }
          }}
          title="Delete column"
        >
          ×
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={styles.taskList}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onDelete={() => onDeleteTask(task.id, column.id)}
                onEdit={() => setEditingTask(task)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className={styles.emptyCol}>
            Drop tasks here
          </div>
        )}
      </div>

      {/* Add task */}
      <div className={styles.footer}>
        <AnimatePresence mode="wait">
          {addingTask ? (
            <motion.form
              key="form"
              onSubmit={handleAddTask}
              className={styles.addForm}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <textarea
                className={styles.addInput}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title…"
                autoFocus
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(e); }
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); }
                }}
              />
              <div className={styles.addActions}>
                <button className={styles.addSubmit} type="submit">Add task</button>
                <button
                  className={styles.addCancel}
                  type="button"
                  onClick={() => { setAddingTask(false); setNewTaskTitle(''); }}
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="btn"
              className={styles.addBtn}
              onClick={() => setAddingTask(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className={styles.addBtnPlus}>+</span> Add task
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Task edit modal */}
      <AnimatePresence>
        {editingTask && (
          <TaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={async (updates) => {
              await onUpdateTask(editingTask.id, updates);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
