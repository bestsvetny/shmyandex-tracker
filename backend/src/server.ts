import { buildApp } from './app.js';
import { getDb } from './db.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

const db = getDb();
const app = await buildApp(db, { jwtSecret: JWT_SECRET, logger: true });

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
