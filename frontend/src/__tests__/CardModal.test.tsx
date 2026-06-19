import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardModal from '../components/CardModal';
import { Card } from '../api';

const existingCard: Card = {
  id: 5,
  title: 'Старый заголовок',
  description: 'Старое описание',
  assignee: 'Анна',
  status: 'in_progress',
  position: 2,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('CardModal', () => {
  describe('режим создания', () => {
    it('рендерит заголовок "Новая карточка"', () => {
      render(<CardModal card={null} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('Новая карточка')).toBeInTheDocument();
    });

    it('не показывает кнопку "Удалить"', () => {
      render(<CardModal card={null} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.queryByText('Удалить')).not.toBeInTheDocument();
    });

    it('устанавливает defaultStatus в select', () => {
      render(
        <CardModal card={null} defaultStatus="done" onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />
      );
      expect(screen.getByRole('combobox')).toHaveValue('done');
    });

    it('вызывает onSave с введёнными данными', () => {
      const onSave = vi.fn();
      render(<CardModal card={null} defaultStatus="todo" onClose={vi.fn()} onSave={onSave} onDelete={vi.fn()} />);

      fireEvent.change(screen.getByPlaceholderText(/что нужно сделать/i), {
        target: { value: 'Новая задача' },
      });
      fireEvent.change(screen.getByPlaceholderText(/подробности задачи/i), {
        target: { value: 'Детали' },
      });
      fireEvent.change(screen.getByPlaceholderText(/имя исполнителя/i), {
        target: { value: 'Боб' },
      });
      fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

      expect(onSave).toHaveBeenCalledWith({
        title: 'Новая задача',
        description: 'Детали',
        assignee: 'Боб',
        status: 'todo',
      });
    });

    it('показывает ошибку при пустом заголовке', () => {
      render(<CardModal card={null} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));
      expect(screen.getByText(/введите заголовок/i)).toBeInTheDocument();
    });
  });

  describe('режим редактирования', () => {
    it('рендерит заголовок "Редактирование карточки"', () => {
      render(<CardModal card={existingCard} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('Редактирование карточки')).toBeInTheDocument();
    });

    it('предзаполняет поля существующими данными', () => {
      render(<CardModal card={existingCard} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Старое описание')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Анна')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('in_progress');
    });

    it('показывает кнопку "Удалить"', () => {
      render(<CardModal card={existingCard} onClose={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByRole('button', { name: /удалить/i })).toBeInTheDocument();
    });

    it('вызывает onDelete с карточкой при клике "Удалить"', () => {
      const onDelete = vi.fn();
      render(<CardModal card={existingCard} onClose={vi.fn()} onSave={vi.fn()} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /удалить/i }));
      expect(onDelete).toHaveBeenCalledWith(existingCard);
    });
  });

  it('вызывает onClose при клике "Отмена"', () => {
    const onClose = vi.fn();
    render(<CardModal card={null} onClose={onClose} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('вызывает onClose при нажатии Escape', () => {
    const onClose = vi.fn();
    render(<CardModal card={null} onClose={onClose} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
