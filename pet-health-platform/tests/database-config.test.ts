import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMigrationDatabaseUrl,
  getRuntimeDatabaseUrl,
} from '../lib/database-config.ts';

test('runtime uses the application URL while migrations use the direct URL', () => {
  const environment = {
    DATABASE_URL: 'postgresql://runtime.example/app?sslmode=require',
    DIRECT_URL: 'postgresql://direct.example/app?sslmode=require',
  };

  assert.equal(getRuntimeDatabaseUrl(environment), environment.DATABASE_URL);
  assert.equal(getMigrationDatabaseUrl(environment), environment.DIRECT_URL);
});

test('database URL helpers reject SQLite URLs without exposing credentials', () => {
  assert.throws(
    () => getRuntimeDatabaseUrl({ DATABASE_URL: 'file:./prisma/dev.db' }),
    /DATABASE_URL must use PostgreSQL/,
  );
  assert.throws(
    () => getMigrationDatabaseUrl({ DIRECT_URL: 'file:./prisma/dev.db' }),
    /DIRECT_URL must use PostgreSQL/,
  );
});
