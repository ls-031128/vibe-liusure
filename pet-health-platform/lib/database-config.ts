type DatabaseEnvironment = {
  DATABASE_URL?: string;
  DIRECT_URL?: string;
};

function requirePostgresUrl(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL`);
  }

  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error(`${name} must use PostgreSQL`);
  }

  return value;
}

export function getRuntimeDatabaseUrl(
  environment?: DatabaseEnvironment,
): string {
  return requirePostgresUrl(
    'DATABASE_URL',
    (environment ?? process.env).DATABASE_URL,
  );
}

export function getMigrationDatabaseUrl(
  environment?: DatabaseEnvironment,
): string {
  return requirePostgresUrl(
    'DIRECT_URL',
    (environment ?? process.env).DIRECT_URL,
  );
}
