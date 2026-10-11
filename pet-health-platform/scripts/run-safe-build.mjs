import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  confirmTestBranch,
  getVerifiedTestTarget,
  projectRoot,
} from './database-safety.mjs';

// This is only for course validation. Vercel Production must use its own
// separately configured Production environment variables.
const target = getVerifiedTestTarget();
await confirmTestBranch({
  ...target,
  database: target.testTarget.database,
});

const npmCli = process.env.npm_execpath;
if (!npmCli || !path.isAbsolute(npmCli) || !existsSync(npmCli)) {
  throw new Error('Cannot locate the npm CLI for the guarded build subprocess.');
}

// Pass a separate environment object: the parent process and its local SQLite
// DATABASE_URL remain unchanged, while this course-validation build uses test.
const childEnvironment = {
  ...process.env,
  DATABASE_URL: target.testUrl,
};

const child = spawn(process.execPath, [npmCli, 'run', 'build'], {
  cwd: projectRoot,
  env: childEnvironment,
  stdio: 'inherit',
  windowsHide: true,
});

child.once('error', () => {
  console.error('Unable to start the guarded build subprocess.');
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
