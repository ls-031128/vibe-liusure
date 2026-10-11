import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  confirmTestBranch,
  envFilePath,
  getVerifiedMigrationTarget,
  projectRoot,
} from './database-safety.mjs';

const action = process.argv[2];
if (action !== 'deploy' && action !== 'dev') {
  throw new Error('Use `deploy` or `dev` as the migration action.');
}

const target = getVerifiedMigrationTarget();
await confirmTestBranch({
  ...target,
  database: target.testTarget.database,
});

const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
const childEnvironment = {
  ...process.env,
  DATABASE_URL: '',
  DIRECT_URL: target.directUrl,
  TEST_DATABASE_URL: target.testUrl,
  NEON_TEST_BRANCH_ID: target.branchId,
  NEON_TEST_ENDPOINT_ID: target.endpointId,
  DOTENV_CONFIG_PATH: envFilePath,
};

const child = spawn(
  process.execPath,
  ['--', prismaCli, 'migrate', action, '--config', 'prisma7.config.ts'],
  {
    cwd: projectRoot,
    env: childEnvironment,
    stdio: 'inherit',
  },
);

child.once('error', (error) => {
  console.error(`Unable to start the guarded Prisma migration: ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
