import { Hono } from 'hono';
import { serve } from '@hono/node-server';

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const todos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Read Licell docs',
    done: true,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-2',
    title: 'Deploy this example to FC',
    done: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  }
];

function runtimeName() {
  return process.env.LICELL_FC_RUNTIME || process.env.FC_RUNTIME || process.env.RUNTIME || 'docker';
}

function regionName() {
  return process.env.LICELL_REGION || process.env.ALI_REGION || process.env.FC_REGION || process.env.REGION || 'unknown';
}

function parsePriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

const app = new Hono();

app.get('/', (c) => c.json({
  ok: true,
  service: 'licell-docker-bun-hono-api',
  framework: 'hono',
  runtime: runtimeName(),
  endpoints: ['GET /healthz', 'GET /meta', 'GET /echo?message=', 'GET /todos', 'POST /todos', 'PATCH /todos/:id/toggle', 'POST /math/sum']
}));

app.get('/healthz', (c) => c.json({
  ok: true,
  now: new Date().toISOString(),
  framework: 'hono',
  runtime: runtimeName()
}));

app.get('/meta', (c) => c.json({
  ok: true,
  framework: 'hono',
  runtime: runtimeName(),
  region: regionName(),
  appName: process.env.LICELL_APP_NAME || process.env.APP_NAME || 'unknown'
}));

app.get('/echo', (c) => {
  const message = c.req.query('message') || 'hello-from-hono';
  return c.json({
    ok: true,
    message,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query()
  });
});

app.get('/todos', (c) => {
  const done = c.req.query('done');
  let items = todos;
  if (done === 'true') items = todos.filter((item) => item.done);
  else if (done === 'false') items = todos.filter((item) => !item.done);
  else if (done !== undefined) return c.json({ ok: false, error: 'done must be true or false' }, 400);

  return c.json({ ok: true, total: items.length, items });
});

app.post('/todos', async (c) => {
  const payload = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) return c.json({ ok: false, error: 'title is required' }, 400);
  if (title.length > 120) return c.json({ ok: false, error: 'title is too long' }, 400);

  const item: TodoItem = {
    id: `todo-${Date.now()}`,
    title,
    done: false,
    priority: parsePriority(payload?.priority),
    createdAt: new Date().toISOString()
  };
  todos.unshift(item);

  return c.json({ ok: true, item, total: todos.length }, 201);
});

app.patch('/todos/:id/toggle', (c) => {
  const id = c.req.param('id');
  const item = todos.find((todo) => todo.id === id);
  if (!item) return c.json({ ok: false, error: 'todo not found' }, 404);
  item.done = !item.done;
  return c.json({ ok: true, item });
});

app.post('/math/sum', async (c) => {
  const payload = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const numbers = payload?.numbers;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return c.json({ ok: false, error: 'numbers must be a non-empty array' }, 400);
  }
  if (numbers.length > 100) {
    return c.json({ ok: false, error: 'numbers array is too large' }, 400);
  }

  const normalized = numbers.map((value) => Number(value));
  if (normalized.some((value) => !Number.isFinite(value))) {
    return c.json({ ok: false, error: 'numbers must contain only finite values' }, 400);
  }

  const sum = normalized.reduce((acc, value) => acc + value, 0);
  return c.json({
    ok: true,
    count: normalized.length,
    sum,
    average: sum / normalized.length
  });
});

const port = Number(process.env.PORT || process.env.FC_SERVER_PORT || 9000);
serve({ fetch: app.fetch, port });

console.log(`[docker-bun-hono-api] listening on http://127.0.0.1:${port}`);
