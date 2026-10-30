import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import TasksPage from './pages/TasksPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <TasksPage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
