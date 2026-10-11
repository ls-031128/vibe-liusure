import 'dotenv/config';
import test from 'node:test';
import {
  parseDatabaseTarget,
  sameDatabaseTarget,
} from '../lib/database-target.mjs';

type DatabaseTest = (name: string, run: () => Promise<void>) => void;

const databaseTestsEnabled =
  process.env.PET_HEALTH_DATABASE_TEST_RUNNER === '1';

if (databaseTestsEnabled) {
  const testTarget = parseDatabaseTarget(
    'TEST_DATABASE_URL',
    process.env.TEST_DATABASE_URL,
  );
  const runtimeTarget = parseDatabaseTarget(
    'DATABASE_URL',
    process.env.DATABASE_URL,
  );
  const expectedEndpointId = process.env.NEON_TEST_ENDPOINT_ID;

  if (!sameDatabaseTarget(testTarget, runtimeTarget)) {
    throw new Error(
      'The isolated test process DATABASE_URL must match TEST_DATABASE_URL.',
    );
  }
  if (
    !testTarget.isNeon ||
    !expectedEndpointId ||
    testTarget.endpointId !== expectedEndpointId ||
    !process.env.NEON_TEST_BRANCH_ID
  ) {
    throw new Error(
      'Test database does not match the locally verified Neon test endpoint configuration.',
    );
  }
}

export const databaseTest: DatabaseTest = (name, run) => {
  if (!databaseTestsEnabled) {
    test(
      name,
      { skip: 'Run `npm run test:db` to opt in to the isolated Neon test database.' },
      async () => {},
    );
    return;
  }

  test(name, run);
};
