import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Board from './components/Board';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-100 text-slate-400">
        Загрузка…
      </div>
    );
  }

  return user ? <Board /> : <AuthPage />;
}
