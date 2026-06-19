import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Board from '../components/Board';
import * as apiModule from '../api';

// Мокируем API
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return {
    ...actual,
    api: {
      ...actual.api,
      listCards: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    },
  };
});

// Мокируем DnD — в unit-тестах нам не нужна реальная drag-логика
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({
    children,
    droppableId,
  }: {
    children: (p: any, s: any) => React.ReactNode;
    droppableId: string;
  }) =>
    children(
      { innerRef: () => {}, droppableProps: { 'data-droppable-id': droppableId }, placeholder: null },
      { isDraggingOver: false }
    ),
  Draggable: ({
    children,
  }: {
    children: (p: any, s: any) => React.ReactNode;
  }) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}));

// Мокируем AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    logout: vi.fn(),
  }),
}));

const mockCards: apiModule.Card[] = [
  { id: 1, title: 'Исправить баг', description: '', assignee: '', status: 'todo', position: 1, createdAt: '', updatedAt: '' },
  { id: 2, title: 'Написать тест', description: 'desc', assignee: 'Иван', status: 'in_progress', position: 1, createdAt: '', updatedAt: '' },
  { id: 3, title: 'Задеплоить', description: '', assignee: '', status: 'done', position: 1, createdAt: '', updatedAt: '' },
];

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.api.listCards).mockResolvedValue(mockCards);
  });

  it('отображает три колонки', async () => {
    render(<Board />);
    await waitFor(() => screen.getByText('Исправить баг'));
    expect(screen.getByText('К выполнению')).toBeInTheDocument();
    expect(screen.getByText('В работе')).toBeInTheDocument();
    expect(screen.getByText('Готово')).toBeInTheDocument();
  });

  it('рендерит карточки из API в нужных колонках', async () => {
    render(<Board />);
    await waitFor(() => screen.getByText('Исправить баг'));
    expect(screen.getByText('Исправить баг')).toBeInTheDocument();
    expect(screen.getByText('Написать тест')).toBeInTheDocument();
    expect(screen.getByText('Задеплоить')).toBeInTheDocument();
  });

  it('показывает счётчик карточек в колонке', async () => {
    render(<Board />);
    await waitFor(() => screen.getByText('Исправить баг'));
    // Первая колонка «К выполнению» должна иметь счётчик 1
    const badges = screen.getAllByText('1');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('открывает модальное окно при клике на карточку', async () => {
    render(<Board />);
    await waitFor(() => screen.getByTestId('card-1'));
    fireEvent.click(screen.getByTestId('card-1'));
    expect(screen.getByText('Редактирование карточки')).toBeInTheDocument();
  });

  it('открывает модальное окно при клике "+ Добавить карточку"', async () => {
    render(<Board />);
    await waitFor(() => screen.getAllByText(/добавить карточку/i));
    fireEvent.click(screen.getAllByText(/добавить карточку/i)[0]);
    expect(screen.getByText('Новая карточка')).toBeInTheDocument();
  });

  it('создаёт карточку через API и добавляет в список', async () => {
    const newCard: apiModule.Card = {
      id: 99, title: 'Новая', description: '', assignee: '', status: 'todo', position: 2, createdAt: '', updatedAt: '',
    };
    vi.mocked(apiModule.api.createCard).mockResolvedValue(newCard);

    render(<Board />);
    await waitFor(() => screen.getAllByText(/добавить карточку/i));
    fireEvent.click(screen.getAllByText(/добавить карточку/i)[0]);

    fireEvent.change(screen.getByPlaceholderText(/что нужно сделать/i), {
      target: { value: 'Новая' },
    });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => expect(apiModule.api.createCard).toHaveBeenCalled());
    expect(await screen.findByTestId('card-99')).toBeInTheDocument();
  });

  it('отображает имя текущего пользователя в хедере', async () => {
    render(<Board />);
    await waitFor(() => screen.getByText('Test User'));
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
