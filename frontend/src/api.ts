export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  assignee: string;
  status: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardPayload {
  title: string;
  description?: string;
  assignee?: string;
  status?: string;
  position?: number;
}

let token: string | null = localStorage.getItem('token');

export function setToken(value: string | null): void {
  token = value;
  if (value) localStorage.setItem('token', value);
  else localStorage.removeItem('token');
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  if (res.status === 204) return null as unknown as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && (data as any).error) ||
      `Ошибка запроса (${res.status})`;
    throw new Error(message as string);
  }
  return data as T;
}

export const api = {
  register: (payload: { email: string; name: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: User }>('/api/auth/me'),

  listCards: () => request<Card[]>('/api/cards'),
  createCard: (payload: CardPayload) =>
    request<Card>('/api/cards', { method: 'POST', body: JSON.stringify(payload) }),
  updateCard: (id: number, payload: CardPayload) =>
    request<Card>(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCard: (id: number) => request<null>(`/api/cards/${id}`, { method: 'DELETE' }),
};
