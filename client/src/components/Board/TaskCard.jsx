import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './TaskCard.module.css';

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Med',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// Card animations
const cardVariants = {
  initial: { opacity: 0, y: -12, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' }
  },
};

export default function TaskCard({ task, columnId, onDelete, onEdit, isDragOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const content = (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isDragOverlay ? styles.overlay : ''}`}
      data-priority={task.priority}
    >
      {/* Priority stripe */}
      <div className={`${styles.priorityStripe} ${styles[`priority_${task.priority}`]}`} />

      <div className={styles.body}>
        <p className={styles.title}>{task.title}</p>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}

        <div className={styles.meta}>
          <span className={`${styles.priorityBadge} ${styles[`badge_${task.priority}`]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.assignee && (
            <span className={styles.assignee} title={task.assignee.email}>
              {(task.assignee.name || task.assignee.email)[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Actions — shown on hover */}
      {!isDragOverlay && (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={onEdit} title="Edit task">
            ✎
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => {
              if (confirm('Delete this task?')) onDelete();
            }}
            title="Delete task"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );

  if (isDragOverlay) {
    return (
      <motion.div
        style={{
          rotate: 1.5,
          scale: 1.04,
          boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
          borderRadius: 'var(--radius-md)',
          cursor: 'grabbing',
        }}
        animate={{ rotate: 1.5, scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      layoutId={task.id}
      {...attributes}
      {...listeners}
    >
      {content}
    </motion.div>
  );
}
