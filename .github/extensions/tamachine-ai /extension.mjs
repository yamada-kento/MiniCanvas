import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { joinSession, createCanvas } from '@github/copilot-sdk/extension';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const servers = new Map();

const session = await joinSession({
  canvases: [
    createCanvas({
      id: 'minimum-canvas',
      displayName: 'Minimum Canvas',
      description: 'Minimum Canvas for testing purposes.',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'State document identifier' }
        },
        additionalProperties: true
      },
      actions: [
        {
          name: 'saveGame',
          description: '状態を保存する',
          handler: async (ctx) => {
            const documentId = ctx.input?.documentId || 'default';
            const state = loadState(documentId);
            saveState(documentId, state);
            return state;
          }
        },
      ],
      open: async (ctx) => {
        const documentId = ctx.input?.documentId || 'default';
        let entry = servers.get(ctx.instanceId);
        if (!entry) {
          entry = await startServer(ctx.instanceId, documentId);
          servers.set(ctx.instanceId, entry);
        }
        return {
          title: 'Minimum Canvas template',
          url: `${entry.url}?documentId=${encodeURIComponent(documentId)}`
        };
      },
      onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (entry) {
          servers.delete(ctx.instanceId);
          await new Promise((resolve) => entry.server.close(() => resolve()));
        }
      }
    })
  ]
});

function ensureStorage() {
  const storageRoot = resolve(session.workspacePath || process.env.HOME || '/tmp', '.copilot', 'canvas', 'tamachine-ai');
  mkdirSync(storageRoot, { recursive: true });
  return storageRoot;
}

function buildStatePath(documentId) {
  const storageRoot = ensureStorage();
  return resolve(storageRoot, `${String(documentId || 'default').replace(/[^a-zA-Z0-9-_]+/g, '-')}.json`);
}

function loadState(documentId = 'default') {
  const statePath = buildStatePath(documentId);
  if (existsSync(statePath)) {
    try {
      const raw = readFileSync(statePath, 'utf8');
      const parsed = JSON.parse(raw);
      return mergeState(defaultState, parsed);
    } catch {
      // ignore malformed state and fall back to default
    }
  }
  const initial = mergeState(defaultState, {});
  saveState(documentId, initial);
  return initial;
}

function saveState(documentId, state) {
  const statePath = buildStatePath(documentId);
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

function mergeState(base, incoming = {}) {
  const sourceHeroine = incoming.heroine || {};
  return {
    player: { ...base.player, ...(incoming.player || {}) },
    heroine: {
      ...base.heroine,
      ...sourceHeroine,
      memory: {
        ...(base.heroine.memory || {}),
        ...(sourceHeroine.memory || {})
      },
      policy: {
        ...(base.heroine.policy || {}),
        ...(sourceHeroine.policy || {})
      }
    },
    game: { ...base.game, ...(incoming.game || {}) },
    copilotBridge: { ...base.copilotBridge, ...(incoming.copilotBridge || {}) }
  };
}

async function startServer(instanceId, documentId) {
  const server = createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = requestUrl.pathname;

    if (pathname === '/api/state') {
      const stateDocumentId = requestUrl.searchParams.get('documentId') || documentId || 'default';
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(loadState(stateDocumentId)));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const merged = mergeState(defaultState, parsed);
            saveState(stateDocumentId, merged);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(merged));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'invalid json' }));
          }
        });
        return;
      }
    }

    const fileMap = {
      '/': 'index.html',
      '/styles.css': 'styles.css',
      '/app.mjs': 'app.mjs'
    };
    const target = fileMap[pathname];
    if (!target) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }

    const filePath = resolve(__dirname, target);
    try {
      const content = readFileSync(filePath);
      const contentType = pathname.endsWith('.css')
        ? 'text/css; charset=utf-8'
        : pathname.endsWith('.mjs')
          ? 'application/javascript; charset=utf-8'
          : 'text/html; charset=utf-8';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('asset not available');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    server,
    url: `http://127.0.0.1:${address.port}`
  };
}
