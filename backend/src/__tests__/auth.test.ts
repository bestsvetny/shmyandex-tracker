import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp, registerAndGetToken } from './helpers.js';

describe('Auth routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // POST /api/auth/register
  describe('POST /api/auth/register', () => {
    it('creates user and returns token + user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'alice@example.com', name: 'Alice', password: 'secret' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json<{ token: string; user: { id: number; email: string; name: string } }>();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe('alice@example.com');
      expect(body.user.name).toBe('Alice');
      expect(body.user.id).toBeTypeOf('number');
    });

    it('normalises email to lowercase', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'ALICE@EXAMPLE.COM', name: 'Alice', password: 'secret' },
      });
      expect(res.json<any>().user.email).toBe('alice@example.com');
    });

    it('returns 409 on duplicate email', async () => {
      const payload = { email: 'alice@example.com', name: 'Alice', password: 'secret' };
      await app.inject({ method: 'POST', url: '/api/auth/register', payload });
      const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload });

      expect(res.statusCode).toBe(409);
    });

    it('returns 400 when fields are missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'alice@example.com' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for password shorter than 4 chars', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'alice@example.com', name: 'Alice', password: 'abc' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // POST /api/auth/login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'alice@example.com', name: 'Alice', password: 'secret' },
      });
    });

    it('returns token + user on correct credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'alice@example.com', password: 'secret' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ token: string; user: { email: string } }>();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe('alice@example.com');
    });

    it('returns 401 on wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'alice@example.com', password: 'wrong' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'nobody@example.com', password: 'secret' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 when body is empty', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  // GET /api/auth/me
  describe('GET /api/auth/me', () => {
    it('returns user when authenticated', async () => {
      const token = await registerAndGetToken(app);
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<any>().user.email).toBe('test@example.com');
    });

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { Authorization: 'Bearer garbage.token.value' },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
