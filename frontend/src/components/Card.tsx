import { Draggable } from '@hello-pangea/dnd';
import { Card as CardType } from '../api';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface Props {
  card: CardType;
  index: number;
  onClick: (card: CardType) => void;
}

export default function Card({ card, index, onClick }: Props) {
  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
          data-testid={`card-${card.id}`}
          className={`bg-white rounded-lg shadow-sm border border-slate-200 p-3 mb-2 cursor-pointer hover:border-blue-400 transition ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-1' : ''
          }`}
        >
          <p className="text-sm font-medium text-slate-800 break-words">{card.title}</p>

          {card.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap break-words">
              {card.description}
            </p>
          )}

          {card.assignee && (
            <div className="flex items-center gap-2 mt-3">
              <span
                aria-label={`Исполнитель: ${card.assignee}`}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold"
              >
                {initials(card.assignee)}
              </span>
              <span className="text-xs text-slate-600 truncate">{card.assignee}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
