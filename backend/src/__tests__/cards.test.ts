import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp, registerAndGetToken } from './helpers.js';

describe('Cards routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeEach(async () => {
    app = await createTestApp();
    token = await registerAndGetToken(app);
  });

  afterEach(async () => {
    await app.close();
  });

  function authHeader() {
    return { Authorization: `Bearer ${token}` };
  }

  async function createCard(overrides: Record<string, unknown> = {}) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/cards',
      headers: authHeader(),
      payload: {
        title: 'Test card',
        description: 'Some description',
        assignee: 'Bob',
        status: 'todo',
        ...overrides,
      },
    });
    return res.json<{ id: number; title: string; status: string; position: number }>();
  }

  // Защита маршрутов
  describe('authorization', () => {
    it('returns 401 on GET without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/cards' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 on POST without token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/cards',
        payload: { title: 'x' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // Создание карточек
  describe('POST /api/cards', () => {
    it('creates card and returns 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/cards',
        headers: authHeader(),
        payload: { title: 'Сделать тест', description: 'описание', assignee: 'Иван', status: 'todo' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<any>();
      expect(body.title).toBe('Сделать тест');
      expect(body.status).toBe('todo');
      expect(body.position).toBe(1);
    });

    it('assigns sequential positions within the same status', async () => {
      const c1 = await createCard({ title: 'First' });
      const c2 = await createCard({ title: 'Second' });
      expect(c2.position).toBeGreaterThan(c1.position);
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/cards',
        headers: authHeader(),
        payload: { description: 'no title here' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/cards',
        headers: authHeader(),
        payload: { title: 'x', status: 'flying' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // Список карточек
  describe('GET /api/cards', () => {
    it('returns empty array initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/cards', headers: authHeader() });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns only cards belonging to the authenticated user', async () => {
      // Создаём карточку для user1
      await createCard({ title: 'User1 card' });

      // Регистрируем второго пользователя
      const token2 = await registerAndGetToken(app, { email: 'other@example.com' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/cards',
        headers: { Authorization: `Bearer ${token2}` },
      });
      // User2 не должен видеть карточки user1
      expect(res.json<any[]>()).toHaveLength(0);
    });

    it('returns created cards sorted by position', async () => {
      await createCard({ title: 'A' });
      await createCard({ title: 'B' });
      const res = await app.inject({ method: 'GET', url: '/api/cards', headers: authHeader() });
      const cards = res.json<any[]>();
      expect(cards).toHaveLength(2);
      expect(cards[0].position).toBeLessThan(cards[1].position);
    });
  });

  // Обновление карточки
  describe('PUT /api/cards/:id', () => {
    it('updates fields and returns updated card', async () => {
      const card = await createCard();
      const res = await app.inject({
        method: 'PUT',
        url: `/api/cards/${card.id}`,
        headers: authHeader(),
        payload: { title: 'Updated', status: 'in_progress', position: 2 },
      });
      expect(res.statusCode).toBe(200);
      const updated = res.json<any>();
      expect(updated.title).toBe('Updated');
      expect(updated.status).toBe('in_progress');
    });

    it('returns 404 for non-existent card', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/cards/9999',
        headers: authHeader(),
        payload: { title: 'x' },
      });
      expect(res.statusCode).toBe(404);
    });

    it("returns 404 when trying to update another user's card", async () => {
      const card = await createCard();
      const token2 = await registerAndGetToken(app, { email: 'other@example.com' });
      const res = await app.inject({
        method: 'PUT',
        url: `/api/cards/${card.id}`,
        headers: { Authorization: `Bearer ${token2}` },
        payload: { title: 'steal' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // Удаление карточки
  describe('DELETE /api/cards/:id', () => {
    it('deletes card and returns 204', async () => {
      const card = await createCard();
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/cards/${card.id}`,
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(204);

      // Убеждаемся, что карточки больше нет
      const list = await app.inject({ method: 'GET', url: '/api/cards', headers: authHeader() });
      expect(list.json<any[]>()).toHaveLength(0);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/cards/9999',
        headers: authHeader(),
      });
      expect(res.statusCode).toBe(404);
    });

    it("returns 404 when deleting another user's card", async () => {
      const card = await createCard();
      const token2 = await registerAndGetToken(app, { email: 'other@example.com' });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/cards/${card.id}`,
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
