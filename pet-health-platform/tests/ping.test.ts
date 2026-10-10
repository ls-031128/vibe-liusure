import assert from 'node:assert/strict';
import test from 'node:test';

import { GET } from '../app/api/ping/route.ts';

test('GET /api/ping returns the MVP health response', async () => {
  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
