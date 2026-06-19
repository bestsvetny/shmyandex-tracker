import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { api, Card } from '../api';
import { useAuth } from '../context/AuthContext';
import CardItem from './Card';
import CardModal from './CardModal';

const COLUMNS = [
  { status: 'todo', title: 'К выполнению', accent: 'bg-slate-400' },
  { status: 'in_progress', title: 'В работе', accent: 'bg-amber-400' },
  { status: 'done', title: 'Готово', accent: 'bg-emerald-400' },
] as const;

type ModalState =
  | { type: 'edit'; card: Card }
  | { type: 'create'; defaultStatus: string }
  | null;

export default function Board() {
  const { user, logout } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    api
      .listCards()
      .then(setCards)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, Card[]> = { todo: [], in_progress: [], done: [] };
    for (const c of cards) (map[c.status] ??= []).push(c);
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position || a.id - b.id);
    }
    return map;
  }, [cards]);

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const id = Number(draggableId);
    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    const snapshot = cards;

    const cols: Record<string, Card[]> = { todo: [], in_progress: [], done: [] };
    for (const c of cards) cols[c.status].push({ ...c });
    for (const key of Object.keys(cols)) cols[key].sort((a, b) => a.position - b.position || a.id - b.id);

    const [moved] = cols[fromStatus].splice(source.index, 1);
    moved.status = toStatus;
    cols[toStatus].splice(destination.index, 0, moved);

    const affected = new Set([fromStatus, toStatus]);
    for (const status of affected) cols[status].forEach((c, i) => { c.position = i + 1; });

    const updated = Object.values(cols).flat();
    setCards(updated);

    try {
      const toPersist: Card[] = [];
      for (const status of affected) {
        for (const c of cols[status]) {
          const orig = snapshot.find((o) => o.id === c.id);
          if (!orig || orig.status !== c.status || orig.position !== c.position) toPersist.push(c);
        }
      }
      await Promise.all(
        toPersist.map((c) =>
          api.updateCard(c.id, {
            title: c.title,
            description: c.description,
            assignee: c.assignee,
            status: c.status,
            position: c.position,
          })
        )
      );
    } catch (e) {
      setError((e as Error).message);
      setCards(snapshot);
    }
  }

  async function handleSave(values: Parameters<typeof api.createCard>[0]) {
    try {
      if (modal?.type === 'edit') {
        const updated = await api.updateCard(modal.card.id, values);
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await api.createCard(values);
        setCards((prev) => [...prev, created]);
      }
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(card: Card) {
    try {
      await api.deleteCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📋 Shmyandex Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 rounded-lg px-3 py-1"
          >
            Выйти
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-6 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-medium">закрыть</button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Загрузка…</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-4 items-start min-w-max">
              {COLUMNS.map((col) => (
                <div key={col.status} className="w-80 bg-slate-200/60 rounded-xl flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
                    <h2 className="font-semibold text-slate-700">{col.title}</h2>
                    <span className="text-xs text-slate-500 bg-slate-300/70 rounded-full px-2 py-0.5">
                      {byStatus[col.status]?.length ?? 0}
                    </span>
                  </div>

                  <Droppable droppableId={col.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`px-3 pb-2 min-h-[60px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-100/50' : ''
                        }`}
                      >
                        {byStatus[col.status]?.map((card, index) => (
                          <CardItem
                            key={card.id}
                            card={card}
                            index={index}
                            onClick={(c) => setModal({ type: 'edit', card: c })}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <button
                    onClick={() => setModal({ type: 'create', defaultStatus: col.status })}
                    className="text-left text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 rounded-lg px-4 py-2 m-2 transition"
                  >
                    + Добавить карточку
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}

      {modal && (
        <CardModal
          card={modal.type === 'edit' ? modal.card : null}
          defaultStatus={modal.type === 'create' ? modal.defaultStatus : undefined}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
