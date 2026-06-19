import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import CardItem from '../components/Card';
import { Card } from '../api';

// DnD требует обёртки для рендера
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

const baseCard: Card = {
  id: 1,
  title: 'Написать тест',
  description: 'Покрыть все сценарии',
  assignee: 'Иван Петров',
  status: 'todo',
  position: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('Card component', () => {
  it('отображает заголовок карточки', () => {
    render(
      <Wrapper>
        <CardItem card={baseCard} index={0} onClick={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Написать тест')).toBeInTheDocument();
  });

  it('отображает описание', () => {
    render(
      <Wrapper>
        <CardItem card={baseCard} index={0} onClick={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Покрыть все сценарии')).toBeInTheDocument();
  });

  it('отображает инициалы и имя исполнителя', () => {
    render(
      <Wrapper>
        <CardItem card={baseCard} index={0} onClick={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByLabelText(/исполнитель/i).textContent).toBe('ИП');
  });

  it('не показывает блок исполнителя, если поле пустое', () => {
    render(
      <Wrapper>
        <CardItem card={{ ...baseCard, assignee: '' }} index={0} onClick={vi.fn()} />
      </Wrapper>
    );
    expect(screen.queryByLabelText(/исполнитель/i)).not.toBeInTheDocument();
  });

  it('вызывает onClick при клике', () => {
    const onClick = vi.fn();
    render(
      <Wrapper>
        <CardItem card={baseCard} index={0} onClick={onClick} />
      </Wrapper>
    );
    fireEvent.click(screen.getByTestId('card-1'));
    expect(onClick).toHaveBeenCalledWith(baseCard);
  });
});
