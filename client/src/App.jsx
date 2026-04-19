import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import BoardsPage from './components/Board/BoardsPage';
import BoardPage from './components/Board/BoardPage';
import PageTransition from './components/UI/PageTransition';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/boards" replace />;
  return children;
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/boards" replace />} />
        <Route path="/login" element={
          <PublicRoute>
            <PageTransition key="login"><LoginPage /></PageTransition>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <PageTransition key="register"><RegisterPage /></PageTransition>
          </PublicRoute>
        } />
        <Route path="/boards" element={
          <ProtectedRoute>
            <PageTransition key="boards"><BoardsPage /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/board/:boardId" element={
          <ProtectedRoute>
            <PageTransition key="board"><BoardPage /></PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
