import assert from 'node:assert/strict';
import test from 'node:test';

import { createRequestVersion } from '../lib/request-version.ts';

test('only the most recent request remains eligible to update state', () => {
  const requests = createRequestVersion();
  const oldRequest = requests.next();
  const currentRequest = requests.next();

  assert.equal(requests.isCurrent(oldRequest), false);
  assert.equal(requests.isCurrent(currentRequest), true);
});

test('invalidating requests prevents updates after component cleanup', () => {
  const requests = createRequestVersion();
  const request = requests.next();

  requests.invalidate();

  assert.equal(requests.isCurrent(request), false);
});
