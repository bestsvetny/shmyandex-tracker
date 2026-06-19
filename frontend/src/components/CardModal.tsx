import { FormEvent, useEffect, useState } from 'react';
import { Card, CardPayload } from '../api';

const STATUS_LABELS: Record<string, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнено',
};

interface Props {
  card: Card | null;
  defaultStatus?: string;
  onClose: () => void;
  onSave: (values: CardPayload) => void;
  onDelete: (card: Card) => void;
}

export default function CardModal({ card, defaultStatus = 'todo', onClose, onSave, onDelete }: Props) {
  const isEdit = card !== null;
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [assignee, setAssignee] = useState(card?.assignee ?? '');
  const [status, setStatus] = useState(card?.status ?? defaultStatus);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Поле "Наименование" обязательно для заполнения');
      return;
    }
    onSave({ title: title.trim(), description, assignee, status });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 font-1c"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg bg-1c-bg shadow-1c-raised"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="titlebar-1c flex items-center justify-between">
          <span>{isEdit ? `Задача №${card.id} — Редактирование` : 'Задача (создание)'}</span>
          <button
            aria-label="Закрыть"
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm leading-none"
          >
            &#10005;
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-1c-toolbar-bg border-b border-1c-border-light px-1 py-1 flex items-center gap-0.5">
          <button type="button" onClick={handleSubmit as any} className="btn-1c flex items-center gap-1">
            &#128190; Записать
          </button>
          <button
            type="button"
            onClick={() => { handleSubmit({ preventDefault: () => {} } as any); }}
            className="btn-1c flex items-center gap-1"
          >
            &#9989; Записать и закрыть
          </button>
          {isEdit && (
            <>
              <div className="toolbar-separator" />
              <button
                type="button"
                onClick={() => onDelete(card)}
                className="btn-1c flex items-center gap-1 text-1c-danger"
              >
                &#128465; Пометить на удаление
              </button>
            </>
          )}
        </div>

        {/* Form body */}
        <div className="p-3 bg-1c-surface">
          <form onSubmit={handleSubmit}>
            <table className="w-full text-1c-base">
              <tbody>
                <tr>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap text-1c-text-secondary align-top w-[130px]">
                    Наименование:
                  </td>
                  <td className="py-1.5">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      className="input-1c w-full"
                      placeholder="Введите наименование задачи"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap text-1c-text-secondary align-top">
                    Описание:
                  </td>
                  <td className="py-1.5">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="input-1c w-full resize-none"
                      placeholder="Подробное описание задачи"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap text-1c-text-secondary">
                    Ответственный:
                  </td>
                  <td className="py-1.5">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        className="input-1c flex-1"
                        placeholder="Выберите ответственного"
                      />
                      <button type="button" className="btn-1c text-1c-xs px-1.5">...</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap text-1c-text-secondary">
                    Состояние:
                  </td>
                  <td className="py-1.5">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-1c"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            {error && (
              <div className="mt-2 p-1.5 bg-[#FFF0F0] border border-1c-danger text-1c-danger text-1c-sm">
                &#9888; {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-1c-border-light">
              <button type="submit" className="btn-1c-primary">
                Записать
              </button>
              <button type="button" onClick={onClose} className="btn-1c">
                Закрыть
              </button>
            </div>
          </form>
        </div>

        {/* Status bar */}
        <div className="bg-1c-status-bar border-t border-1c-border px-2 py-0.5 text-1c-xs text-1c-text-muted">
          {isEdit ? `Объект: Задача №${card.id}` : 'Новый объект'}
        </div>
      </div>
    </div>
  );
}
