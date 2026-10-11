import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { parse as parseDotenv } from 'dotenv';
import {
  parseDatabaseTarget,
  sameDatabaseTarget,
} from '../lib/database-target.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const envFilePath = path.join(projectRoot, '.env');

const envFile = existsSync(envFilePath)
  ? parseDotenv(readFileSync(envFilePath))
  : {};

export function readProtectedValue(name) {
  const processValue = process.env[name];
  const fileValue = envFile[name];

  if (processValue && fileValue && processValue !== fileValue) {
    throw new Error(
      `${name} differs between the process environment and .env; refusing to choose a database target implicitly.`,
    );
  }

  const value = processValue || fileValue;
  if (!value) {
    throw new Error(`${name} is required for guarded database commands.`);
  }
  return value;
}

function readTestBranchIdentity() {
  const branchId = readProtectedValue('NEON_TEST_BRANCH_ID');
  const endpointId = readProtectedValue('NEON_TEST_ENDPOINT_ID');

  if (!/^br-[a-z0-9-]+$/i.test(branchId)) {
    throw new Error('NEON_TEST_BRANCH_ID has an invalid format.');
  }
  if (!/^ep-[a-z0-9-]+$/i.test(endpointId)) {
    throw new Error('NEON_TEST_ENDPOINT_ID has an invalid format.');
  }

  return { branchId, endpointId };
}

export function getVerifiedTestTarget() {
  const testUrl = readProtectedValue('TEST_DATABASE_URL');
  const testTarget = parseDatabaseTarget('TEST_DATABASE_URL', testUrl);
  const identity = readTestBranchIdentity();

  if (!testTarget.isNeon || testTarget.endpointId !== identity.endpointId) {
    throw new Error(
      'TEST_DATABASE_URL does not match the locally recorded Neon test endpoint.',
    );
  }

  return { testUrl, testTarget, ...identity };
}

export function getVerifiedMigrationTarget() {
  const verifiedTest = getVerifiedTestTarget();
  const directUrl = readProtectedValue('DIRECT_URL');
  const directTarget = parseDatabaseTarget('DIRECT_URL', directUrl);

  if (!directTarget.isNeon || directTarget.isPooler) {
    throw new Error('DIRECT_URL must be a non-pooler Neon PostgreSQL URL.');
  }
  if (
    directTarget.endpointId !== verifiedTest.endpointId ||
    !sameDatabaseTarget(directTarget, verifiedTest.testTarget)
  ) {
    throw new Error(
      'DIRECT_URL does not identify the configured Neon test endpoint and database.',
    );
  }

  return { ...verifiedTest, directUrl };
}

export async function confirmTestBranch({ branchId, endpointId, database }) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error(
      'A terminal confirmation is required; refusing to run a database command non-interactively.',
    );
  }

  stdout.write(
    `Configured target: Neon endpoint ${endpointId}, database ${database}, branch ID ${branchId}.\n` +
      'These local identifiers are not verified by Neon. Confirm in the Neon Console that this endpoint belongs to the branch named test.\n',
  );

  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await readline.question(
      `Type test/${branchId} to confirm the Neon Console mapping: `,
    );
    if (answer.trim() !== `test/${branchId}`) {
      throw new Error('Test-branch confirmation did not match; no command was run.');
    }
  } finally {
    readline.close();
  }
}
