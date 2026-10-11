export type HealthAssessmentChartRecord = {
  riskLevel?: unknown;
  createdAt?: unknown;
};

export type RiskDistributionItem = {
  name: string;
  value: number;
};

export type TrendDataItem = {
  date: string;
  count: number;
};

const OTHER_RISK_LABEL = '其他';

function getRiskLabel(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return OTHER_RISK_LABEL;
  }

  return value.trim();
}

// The MVP has no user timezone setting, so chart dates use UTC consistently.
export const DEFAULT_TREND_TIME_ZONE = 'UTC';

function getDateKey(value: unknown, timeZone: string) {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');

  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function buildRiskDistribution(
  records: readonly HealthAssessmentChartRecord[],
): RiskDistributionItem[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    const label = getRiskLabel(record.riskLevel);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts, ([name, value]) => ({ name, value }));
}

export function buildTrendData(
  records: readonly HealthAssessmentChartRecord[],
  timeZone = DEFAULT_TREND_TIME_ZONE,
): TrendDataItem[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    const date = getDateKey(record.createdAt, timeZone);

    if (date) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([date, count]) => ({ date, count })).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
