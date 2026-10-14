'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  buildRiskDistribution,
  buildTrendData,
  type HealthAssessmentChartRecord,
} from '../lib/health-assessment-chart-data';

type HealthAssessmentChartsProps = {
  assessments: readonly HealthAssessmentChartRecord[];
};

const CHART_COLORS = ['#0f766e', '#7ca6a0', '#9a83b4', '#cfaa69', '#7c94b5'];

export default function HealthAssessmentCharts({
  assessments,
}: HealthAssessmentChartsProps) {
  const riskData = useMemo(
    () => buildRiskDistribution(assessments),
    [assessments],
  );
  const trendData = useMemo(() => buildTrendData(assessments), [assessments]);

  return (
    <section className="surface-card" aria-labelledby="charts-title">
      <p className="eyebrow">HEALTH INSIGHTS</p>
      <h2 id="charts-title">记录中的健康趋势</h2>
      <p className="section-description">
        仅统计当前宠物的手动记录。颜色用于区分类别，不代表风险高低。
      </p>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>风险提示分布</h3>
          <p className="mt-1 text-xs text-slate-500">保留原始标签 · 单位：条</p>
          {riskData.length === 0 ? (
            <p className="chart-empty-state">暂无风险提示记录。</p>
          ) : (
            <div className="chart-wrapper" aria-label="风险提示分布饼图">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="48%"
                    outerRadius="78%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {riskData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 grid gap-2" aria-label="风险提示数量">
                {riskData.map((item, index) => <li key={item.name} className="flex items-start justify-between gap-3 text-xs text-slate-600"><span className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /><span className="break-words">{item.name}</span></span><strong className="shrink-0">{item.value} 条</strong></li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>评估记录趋势</h3>
          <p className="mt-1 text-xs text-slate-500">按 UTC 日期统计 · 单位：条</p>
          {trendData.length === 0 ? (
            <p className="chart-empty-state">暂无评估记录趋势。</p>
          ) : (
            <div className="chart-wrapper" aria-label="评估记录趋势柱状图">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} allowDataOverflow={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                  <Bar dataKey="count" name="记录数量" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
