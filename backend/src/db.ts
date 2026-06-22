import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createSchema(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      assignee    TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'todo',
      position    REAL NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
  `);
}

export function seed(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@tracker.local');
  if (existing) return;

  const hash = bcrypt.hashSync('demo1234', 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run('demo@tracker.local', 'Demo User', hash);

  const userId = Number(lastInsertRowid);

  const insert = db.prepare(
    'INSERT INTO cards (user_id, title, description, status, position) VALUES (?, ?, ?, ?, ?)'
  );

  insert.run(userId, 'Изучить документацию', 'Прочитать README и ознакомиться с API', 'todo', 1);
  insert.run(userId, 'Настроить окружение', 'Установить зависимости и запустить dev-сервер', 'todo', 2);
  insert.run(userId, 'Реализовать авторизацию', 'Добавить JWT и формы логина/регистрации', 'in_progress', 1);
  insert.run(userId, 'Сверстать канбан-доску', 'Три колонки: To Do, In Progress, Done', 'in_progress', 2);
  insert.run(userId, 'Создать репозиторий', 'Инициализировать Git и сделать первый коммит', 'done', 1);
}

export function openDb(filename: string): Database.Database {
  const db = new Database(filename);
  createSchema(db);
  return db;
}

// Синглтон для production-сервера
let _instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_instance) {
    const dataDir = join(__dirname, '..', 'data');
    mkdirSync(dataDir, { recursive: true });
    _instance = openDb(join(dataDir, 'tracker.db'));
    seed(_instance);
  }
  return _instance;
}
