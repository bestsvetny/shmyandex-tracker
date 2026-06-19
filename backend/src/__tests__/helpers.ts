import Database from 'better-sqlite3';
import { createSchema } from '../db.js';
import { buildApp } from '../app.js';

export function createTestApp() {
  const db = new Database(':memory:');
  createSchema(db);
  return buildApp(db, { serveFrontend: false });
}

/** Быстрая регистрация + получение токена */
export async function registerAndGetToken(
  app: Awaited<ReturnType<typeof createTestApp>>,
  overrides: { email?: string; name?: string; password?: string } = {}
) {
  const payload = {
    email: overrides.email ?? 'test@example.com',
    name: overrides.name ?? 'Test User',
    password: overrides.password ?? 'password123',
  };
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload,
  });
  return (res.json() as { token: string }).token;
}
