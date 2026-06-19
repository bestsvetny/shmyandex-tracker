import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthPage from '../components/AuthPage';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../api';

// Тесты не должны делать реальные сетевые запросы
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return {
    ...actual,
    api: {
      ...actual.api,
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn().mockRejectedValue(new Error('no token')),
    },
  };
});

function renderPage() {
  return render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('рендерит форму входа по умолчанию', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument());
    expect(screen.queryByPlaceholderText(/иван иванов/i)).not.toBeInTheDocument();
  });

  it('переключается на форму регистрации', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /зарегистрироваться/i }));
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    expect(screen.getByPlaceholderText(/иван иванов/i)).toBeInTheDocument();
  });

  it('вызывает login с правильными данными', async () => {
    const mockLogin = vi.mocked(apiModule.api.login);
    mockLogin.mockResolvedValue({ token: 'tok', user: { id: 1, email: 'a@b.ru', name: 'Test' } });

    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/you@example.com/i));

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'a@b.ru' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.ru', password: 'secret' }));
  });

  it('вызывает register с именем, email и паролем', async () => {
    const mockRegister = vi.mocked(apiModule.api.register);
    mockRegister.mockResolvedValue({ token: 'tok', user: { id: 1, email: 'a@b.ru', name: 'Test' } });

    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /зарегистрироваться/i }));
    // переключаемся на регистрацию (кликаем по ссылке, не кнопке submit)
    fireEvent.click(screen.getAllByRole('button', { name: /зарегистрироваться/i })[0]);

    fireEvent.change(screen.getByPlaceholderText(/иван иванов/i), { target: { value: 'Алиса' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'a@b.ru' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({ email: 'a@b.ru', name: 'Алиса', password: 'secret' })
    );
  });

  it('показывает сообщение об ошибке при неудачном входе', async () => {
    vi.mocked(apiModule.api.login).mockRejectedValue(new Error('Неверный email или пароль'));

    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/you@example.com/i));

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'x@x.ru' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => expect(screen.getByText(/неверный email или пароль/i)).toBeInTheDocument());
  });
});
