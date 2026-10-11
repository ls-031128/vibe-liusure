import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRiskDistribution,
  buildTrendData,
} from '../lib/health-assessment-chart-data.ts';

test('buildRiskDistribution counts each risk label', () => {
  const result = buildRiskDistribution([
    { riskLevel: '待观察', createdAt: '2026-10-10T08:00:00.000Z' },
    { riskLevel: '待观察', createdAt: '2026-10-10T09:00:00.000Z' },
    { riskLevel: '建议咨询兽医', createdAt: '2026-10-10T10:00:00.000Z' },
  ]);

  assert.deepEqual(result, [
    { name: '待观察', value: 2 },
    { name: '建议咨询兽医', value: 1 },
  ]);
});

test('chart data builders return empty arrays for empty input', () => {
  assert.deepEqual(buildRiskDistribution([]), []);
  assert.deepEqual(buildTrendData([]), []);
});

test('buildTrendData aggregates records from the same day', () => {
  const result = buildTrendData([
    { riskLevel: '待观察', createdAt: '2026-10-10T08:00:00.000Z' },
    { riskLevel: '其他', createdAt: '2026-10-10T21:00:00.000Z' },
    { riskLevel: '待观察', createdAt: '2026-10-11T08:00:00.000Z' },
  ]);

  assert.deepEqual(result, [
    { date: '2026-10-10', count: 2 },
    { date: '2026-10-11', count: 1 },
  ]);
});

test('buildTrendData sorts dates chronologically', () => {
  const result = buildTrendData([
    { riskLevel: '待观察', createdAt: '2026-10-12T08:00:00.000Z' },
    { riskLevel: '待观察', createdAt: '2026-10-10T08:00:00.000Z' },
    { riskLevel: '待观察', createdAt: '2026-10-11T08:00:00.000Z' },
  ]);

  assert.deepEqual(result.map((item) => item.date), [
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
  ]);
});

test('buildTrendData groups by the requested timezone across UTC midnight', () => {
  const records = [
    { createdAt: '2026-10-10T23:30:00.000Z' },
    { createdAt: '2026-10-11T00:30:00.000Z' },
  ];

  assert.deepEqual(buildTrendData(records), [
    { date: '2026-10-10', count: 1 },
    { date: '2026-10-11', count: 1 },
  ]);
  assert.deepEqual(buildTrendData(records, 'Asia/Shanghai'), [
    { date: '2026-10-11', count: 2 },
  ]);
});

test('buildRiskDistribution preserves unknown labels and groups invalid labels as other', () => {
  const result = buildRiskDistribution([
    { riskLevel: '用户自定义提示', createdAt: '2026-10-10T08:00:00.000Z' },
    { riskLevel: '', createdAt: '2026-10-10T09:00:00.000Z' },
    { createdAt: '2026-10-10T10:00:00.000Z' },
    { riskLevel: 42, createdAt: 'not-a-date' },
  ]);

  assert.deepEqual(result, [
    { name: '用户自定义提示', value: 1 },
    { name: '其他', value: 3 },
  ]);
});

test('buildTrendData ignores records with missing or invalid dates', () => {
  const result = buildTrendData([
    { riskLevel: '待观察', createdAt: '2026-10-10T08:00:00.000Z' },
    { riskLevel: '待观察' },
    { riskLevel: '待观察', createdAt: 'not-a-date' },
    { riskLevel: '待观察', createdAt: null },
  ]);

  assert.deepEqual(result, [{ date: '2026-10-10', count: 1 }]);
});
