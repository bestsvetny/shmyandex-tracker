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
          className={`bg-1c-input-bg border border-1c-border-light p-2 mb-1 cursor-pointer text-1c-sm hover:bg-[#FFFFEE] ${
            snapshot.isDragging ? 'shadow-1c-raised bg-[#FFFFF0]' : 'shadow-1c-sunken'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-1c-xs text-1c-text-muted whitespace-nowrap mt-0.5">#{card.id}</span>
            <p className="font-bold text-1c-text break-words flex-1">{card.title}</p>
          </div>

          {card.description && (
            <p className="text-1c-xs text-1c-text-secondary mt-1 line-clamp-2 whitespace-pre-wrap break-words pl-6">
              {card.description}
            </p>
          )}

          {card.assignee && (
            <div className="flex items-center gap-1.5 mt-2 pl-6">
              <span
                aria-label={`Исполнитель: ${card.assignee}`}
                className="inline-flex items-center justify-center w-5 h-5 bg-1c-accent text-white text-[9px] font-bold"
              >
                {initials(card.assignee)}
              </span>
              <span className="text-1c-xs text-1c-text-secondary truncate">{card.assignee}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
