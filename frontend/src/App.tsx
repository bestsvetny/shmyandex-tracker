import { useAuth } from "./context/AuthContext";
import AuthPage from "./components/AuthPage";
import Board from "./components/Board";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-1c-bg text-1c-text-muted font-1c text-1c-base">
        Загрузка. Пожалуйста, подождите...
      </div>
    );
  }

  return user ? <Board /> : <AuthPage />;
}
