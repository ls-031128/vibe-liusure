const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

export function parseDatabaseTarget(name, value) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol) || !url.hostname) {
    throw new Error(`${name} must use a PostgreSQL URL with a hostname.`);
  }

  const hostname = url.hostname.toLowerCase();
  const labels = hostname.split('.');
  const endpointLabel = labels[0].replace(/-pooler$/, '');
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (!database || !endpointLabel.startsWith('ep-')) {
    throw new Error(`${name} must identify a Neon database endpoint and database.`);
  }

  return {
    hostname,
    normalizedHostname: hostname.replace(/-pooler(?=\.)/, ''),
    port: url.port || '5432',
    database,
    endpointId: endpointLabel,
    isPooler: labels[0].endsWith('-pooler'),
    isNeon: hostname.endsWith('.neon.tech'),
  };
}

export function sameDatabaseTarget(left, right) {
  return (
    left.normalizedHostname === right.normalizedHostname &&
    left.port === right.port &&
    left.database === right.database
  );
}
