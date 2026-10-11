export type DatabaseTarget = {
  hostname: string;
  normalizedHostname: string;
  port: string;
  database: string;
  endpointId: string;
  isPooler: boolean;
  isNeon: boolean;
};

export function parseDatabaseTarget(
  name: string,
  value: string | undefined,
): DatabaseTarget;

export function sameDatabaseTarget(
  left: DatabaseTarget,
  right: DatabaseTarget,
): boolean;
