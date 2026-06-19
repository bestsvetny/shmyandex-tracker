import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';

const STATUSES = ['todo', 'in_progress', 'done'] as const;
type Status = (typeof STATUSES)[number];

interface CardRow {
  id: number;
  user_id: number;
  title: string;
  description: string;
  assignee: string;
  status: Status;
  position: number;
  created_at: string;
  updated_at: string;
}

interface CreateCardBody {
  title?: string;
  description?: string;
  assignee?: string;
  status?: string;
}

interface UpdateCardBody extends CreateCardBody {
  position?: number;
}

function serialize(row: CardRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignee: row.assignee,
    status: row.status,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function cardRoutes(
  fastify: FastifyInstance,
  opts: { db: Database.Database }
) {
  const { db } = opts;
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/api/cards', async (request) => {
    const rows = db
      .prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY status, position, id')
      .all(request.user.id) as CardRow[];
    return rows.map(serialize);
  });

  fastify.post<{ Body: CreateCardBody }>('/api/cards', async (request, reply) => {
    const { title, description = '', assignee = '', status = 'todo' } = request.body;
    if (!title?.trim()) {
      return reply.code(400).send({ error: 'Заголовок карточки обязателен' });
    }
    if (!STATUSES.includes(status as Status)) {
      return reply.code(400).send({ error: 'Недопустимый статус' });
    }

    const max = db
      .prepare('SELECT COALESCE(MAX(position), 0) AS m FROM cards WHERE user_id = ? AND status = ?')
      .get(request.user.id, status) as { m: number };

    const info = db
      .prepare(
        'INSERT INTO cards (user_id, title, description, assignee, status, position) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(request.user.id, title.trim(), description, assignee, status, max.m + 1);

    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(info.lastInsertRowid) as CardRow;
    return reply.code(201).send(serialize(row));
  });

  fastify.put<{ Params: { id: string }; Body: UpdateCardBody }>(
    '/api/cards/:id',
    async (request, reply) => {
      const id = Number(request.params.id);
      const existing = db
        .prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?')
        .get(id, request.user.id) as CardRow | undefined;
      if (!existing) {
        return reply.code(404).send({ error: 'Карточка не найдена' });
      }

      const {
        title = existing.title,
        description = existing.description,
        assignee = existing.assignee,
        status = existing.status,
        position = existing.position,
      } = request.body;

      if (!STATUSES.includes(status as Status)) {
        return reply.code(400).send({ error: 'Недопустимый статус' });
      }
      if (!title?.trim()) {
        return reply.code(400).send({ error: 'Заголовок карточки обязателен' });
      }

      db.prepare(
        `UPDATE cards
           SET title = ?, description = ?, assignee = ?, status = ?, position = ?,
               updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`
      ).run(title.trim(), description, assignee, status, position, id, request.user.id);

      const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow;
      return serialize(row);
    }
  );

  fastify.delete<{ Params: { id: string } }>('/api/cards/:id', async (request, reply) => {
    const id = Number(request.params.id);
    const info = db
      .prepare('DELETE FROM cards WHERE id = ? AND user_id = ?')
      .run(id, request.user.id);
    if (info.changes === 0) {
      return reply.code(404).send({ error: 'Карточка не найдена' });
    }
    return reply.code(204).send();
  });
}
