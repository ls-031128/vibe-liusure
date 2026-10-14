import assert from 'node:assert/strict';
import test from 'node:test';

import { getHomepageVisitCount, recordHomepageVisit } from '../lib/visit-tracking.ts';

const originalUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = 'postgresql://127.0.0.1:5432/visitor_unit_test';
const { GET, POST } = await import('../app/api/visitors/route.ts');
const { default: prisma } = await import('../lib/prisma.ts');
if (originalUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = originalUrl;

// Prisma delegate properties are Proxy-backed; restore the query boundary after
// each test instead of passing it to Node's descriptor-based mock.method.
function replaceVisitorMethod(t: test.TestContext, method: 'create' | 'count', implementation: (query: unknown) => unknown) {
  const delegate = prisma.visitor as unknown as Record<string, unknown>;
  const original = delegate[method];
  delegate[method] = implementation;
  t.after(() => { delegate[method] = original; });
}

test('POST /api/visitors records visits with unique IDs and no identity fields', async (t) => {
  const writes: unknown[] = [];
  replaceVisitorMethod(t, 'create', async (query) => { writes.push(query); return {}; });

  const first = await POST();
  const second = await POST();
  assert.equal(first.status, 204);
  assert.equal(await first.text(), '');
  assert.equal(second.status, 204);
  assert.equal(writes.length, 2);
  const ids: string[] = [];
  for (const write of writes) {
    const query = write as { data: { id: string; path: string } };
    assert.deepEqual(Object.keys(query), ['data']);
    assert.deepEqual(Object.keys(query.data), ['id', 'path']);
    assert.equal(query.data.path, '/');
    assert.match(query.data.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    ids.push(query.data.id);
  }
  assert.notEqual(ids[0], ids[1]);
});

test('POST /api/visitors silently ignores database failure', async (t) => {
  replaceVisitorMethod(t, 'create', async () => { throw new Error('private database failure'); });
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  const response = await POST();
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.deepEqual(logs, []);
});

test('homepage tracking posts a keepalive event without sending personal data', async (t) => {
  const calls: unknown[][] = [];
  t.mock.method(globalThis, 'fetch', async (...args: unknown[]) => {
    calls.push(args);
    return new Response(null, { status: 204 });
  });
  assert.equal(await recordHomepageVisit(), undefined);
  assert.deepEqual(calls, [['/api/visitors', {
    method: 'POST', keepalive: true, cache: 'no-store',
  }]]);
});

test('homepage tracking suppresses network failure', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network unavailable'); });
  await assert.doesNotReject(recordHomepageVisit());
});

test('homepage tracking suppresses non-success HTTP responses', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }));
  await assert.doesNotReject(recordHomepageVisit());
});

test('GET /api/visitors returns the homepage count without caching', async (t) => {
  const queries: unknown[] = [];
  replaceVisitorMethod(t, 'count', async (query) => { queries.push(query); return 7; });
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { count: 7 });
  assert.deepEqual(queries, [{ where: { path: '/' } }]);
});

test('GET /api/visitors silently returns an unavailable count on database failure', async (t) => {
  replaceVisitorMethod(t, 'count', async () => { throw new Error('private database failure'); });
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { count: null });
  assert.deepEqual(logs, []);
});

test('homepage count reads the actual total from the API', async (t) => {
  const calls: unknown[][] = [];
  t.mock.method(globalThis, 'fetch', async (...args: unknown[]) => {
    calls.push(args);
    return Response.json({ count: 7 });
  });
  assert.equal(await getHomepageVisitCount(), 7);
  assert.deepEqual(calls, [['/api/visitors', { cache: 'no-store' }]]);
});

test('homepage count ignores unavailable, invalid and failed HTTP results', async (t) => {
  for (const fixture of [{ count: null }, { count: -1 }, { count: '7' }, {}]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(fixture));
    assert.equal(await getHomepageVisitCount(), null);
  }
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  assert.equal(await getHomepageVisitCount(), null);
});

test('homepage count suppresses network failure', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network unavailable'); });
  assert.equal(await getHomepageVisitCount(), null);
});
