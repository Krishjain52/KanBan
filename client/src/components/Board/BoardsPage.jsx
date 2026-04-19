import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useBoardStore from '../../store/boardStore';
import { useAuth } from '../../context/AuthContext';
import styles from './BoardsPage.module.css';

export default function BoardsPage() {
  const { boards, loading, fetchBoards, createBoard, deleteBoard } = useBoardStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => { fetchBoards(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateLoading(true);
    try {
      const board = await createBoard(newTitle.trim());
      setNewTitle('');
      setCreating(false);
      navigate(`/board/${board.id}`);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>K</span>
          <span className={styles.logoText}>KANBAN</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{user?.name || user?.email}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Boards</h1>
            <p className={styles.subtitle}>{boards.length} workspace{boards.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            className={styles.newBoardBtn}
            onClick={() => setCreating(true)}
          >
            <span>+</span> New board
          </button>
        </div>

        {/* Create board form */}
        <AnimatePresence>
          {creating && (
            <motion.form
              className={styles.createForm}
              onSubmit={handleCreate}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                className={styles.createInput}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Board name…"
                autoFocus
              />
              <div className={styles.createActions}>
                <button className={styles.createSubmit} type="submit" disabled={createLoading}>
                  {createLoading ? 'Creating…' : 'Create board'}
                </button>
                <button
                  className={styles.createCancel}
                  type="button"
                  onClick={() => { setCreating(false); setNewTitle(''); }}
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          <div className={styles.loading}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : (
          <motion.div className={styles.grid}>
            <AnimatePresence>
              {boards.map((board, i) => (
                <motion.div
                  key={board.id}
                  className={styles.boardCard}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  layout
                >
                  <Link to={`/board/${board.id}`} className={styles.boardLink}>
                    <div className={styles.boardColorBar} style={{
                      background: `hsl(${(board.id.charCodeAt(0) * 37) % 360}, 50%, 40%)`
                    }} />
                    <div className={styles.boardContent}>
                      <h2 className={styles.boardTitle}>{board.title}</h2>
                      <p className={styles.boardMeta}>
                        {board._count?.columns ?? 0} column{board._count?.columns !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={styles.boardArrow}>→</span>
                  </Link>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm('Delete this board?')) deleteBoard(board.id);
                    }}
                    title="Delete board"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {boards.length === 0 && !loading && (
              <motion.div
                className={styles.empty}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className={styles.emptyText}>No boards yet.</p>
                <p className={styles.emptyHint}>Create one to get started.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
