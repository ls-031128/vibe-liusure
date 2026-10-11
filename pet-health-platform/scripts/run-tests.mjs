import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  confirmTestBranch,
  getVerifiedTestTarget,
  projectRoot,
} from './database-safety.mjs';

const mode = process.argv[2];
const testDirectory = path.join(projectRoot, 'tests');
const allTestFiles = readdirSync(testDirectory)
  .filter((file) => file.endsWith('.test.ts'))
  .sort()
  .map((file) => path.join('tests', file));
const databaseTestFiles = [
  path.join('tests', 'pets.test.ts'),
  path.join('tests', 'health-assessments.test.ts'),
];

if (mode !== 'unit' && mode !== 'database') {
  throw new Error('Use `unit` or `database` as the test-runner mode.');
}

const childEnvironment = { ...process.env };
childEnvironment.DOTENV_CONFIG_PATH = path.join(projectRoot, '.env');

if (mode === 'unit') {
  for (const key of [
    'DATABASE_URL',
    'DIRECT_URL',
    'TEST_DATABASE_URL',
    'NEON_TEST_BRANCH_ID',
    'NEON_TEST_ENDPOINT_ID',
    'PET_HEALTH_DATABASE_TEST_RUNNER',
  ]) {
    childEnvironment[key] = '';
  }
} else {
  const target = getVerifiedTestTarget();
  await confirmTestBranch({
    ...target,
    database: target.testTarget.database,
  });

  childEnvironment.DATABASE_URL = target.testUrl;
  childEnvironment.TEST_DATABASE_URL = target.testUrl;
  childEnvironment.DIRECT_URL = '';
  childEnvironment.NEON_TEST_BRANCH_ID = target.branchId;
  childEnvironment.NEON_TEST_ENDPOINT_ID = target.endpointId;
  childEnvironment.PET_HEALTH_DATABASE_TEST_RUNNER = '1';
}

const files = mode === 'unit' ? allTestFiles : databaseTestFiles;
const child = spawn(process.execPath, ['--test', ...files], {
  cwd: projectRoot,
  env: childEnvironment,
  stdio: 'inherit',
});

child.once('error', (error) => {
  console.error(`Unable to start the isolated test process: ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
