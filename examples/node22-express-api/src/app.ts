import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
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
  return process.env.LICELL_FC_RUNTIME || process.env.FC_RUNTIME || process.env.RUNTIME || 'nodejs22';
}

function regionName() {
  return process.env.LICELL_REGION || process.env.ALI_REGION || process.env.FC_REGION || process.env.REGION || 'unknown';
}

function parsePriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

function parseDoneFilter(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] ? String(req.headers['x-request-id']) : randomUUID();
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'licell-node22-express-api',
    framework: 'express',
    runtime: runtimeName(),
    endpoints: ['GET /healthz', 'GET /meta', 'GET /echo?message=', 'GET /todos', 'POST /todos', 'PATCH /todos/:id/toggle', 'POST /math/sum']
  });
});

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    now: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    framework: 'express',
    runtime: runtimeName()
  });
});

app.get('/meta', (_req, res) => {
  res.json({
    ok: true,
    framework: 'express',
    runtime: runtimeName(),
    region: regionName(),
    appName: process.env.LICELL_APP_NAME || process.env.APP_NAME || 'unknown',
    requestId: res.locals.requestId
  });
});

app.get('/echo', (req, res) => {
  const message = typeof req.query.message === 'string' ? req.query.message : 'hello-from-express';
  res.json({
    ok: true,
    message,
    method: req.method,
    path: req.path,
    query: req.query,
    requestId: res.locals.requestId
  });
});

app.get('/todos', (req, res) => {
  const done = parseDoneFilter(req.query.done);
  const items = done === undefined ? todos : todos.filter((item) => item.done === done);
  res.json({
    ok: true,
    total: items.length,
    items,
    requestId: res.locals.requestId
  });
});

app.post('/todos', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) throw new ApiError(400, 'title is required');
  if (title.length > 120) throw new ApiError(400, 'title is too long');

  const todo: TodoItem = {
    id: `todo-${Date.now()}`,
    title,
    done: false,
    priority: parsePriority(req.body?.priority),
    createdAt: new Date().toISOString()
  };
  todos.unshift(todo);

  res.status(201).json({
    ok: true,
    item: todo,
    total: todos.length,
    requestId: res.locals.requestId
  });
});

app.patch('/todos/:id/toggle', (req, res) => {
  const todo = todos.find((item) => item.id === req.params.id);
  if (!todo) throw new ApiError(404, 'todo not found');
  todo.done = !todo.done;

  res.json({
    ok: true,
    item: todo,
    requestId: res.locals.requestId
  });
});

app.post('/math/sum', (req, res) => {
  const numbers = req.body?.numbers;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new ApiError(400, 'numbers must be a non-empty array');
  }
  if (numbers.length > 100) {
    throw new ApiError(400, 'numbers array is too large');
  }

  const normalized = numbers.map((value) => Number(value));
  if (normalized.some((value) => !Number.isFinite(value))) {
    throw new ApiError(400, 'numbers must contain only finite values');
  }

  const sum = normalized.reduce((acc, value) => acc + value, 0);
  res.json({
    ok: true,
    count: normalized.length,
    sum,
    average: sum / normalized.length,
    requestId: res.locals.requestId
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ ok: false, error: err.message, details: err.details, requestId: res.locals.requestId });
    return;
  }
  if (err instanceof Error && err.name === 'SyntaxError') {
    res.status(400).json({ ok: false, error: 'invalid JSON body', requestId: res.locals.requestId });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ ok: false, error: message, requestId: res.locals.requestId });
});

export { app };
