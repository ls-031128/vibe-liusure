'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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

const CHART_COLORS = ['#315efb', '#ef8354', '#5cb85c', '#8e7dbe', '#f2c14e'];

export default function HealthAssessmentCharts({
  assessments,
}: HealthAssessmentChartsProps) {
  const riskData = useMemo(
    () => buildRiskDistribution(assessments),
    [assessments],
  );
  const trendData = useMemo(() => buildTrendData(assessments), [assessments]);

  return (
    <section className="charts-section" aria-labelledby="charts-title">
      <h2 id="charts-title">健康评估统计</h2>
      <p className="section-description">
        图表仅统计当前手动保存的评估记录，不代表 AI 诊断或医学评分。
      </p>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>风险提示分布</h3>
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
                    outerRadius="68%"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>评估记录趋势</h3>
          {trendData.length === 0 ? (
            <p className="chart-empty-state">暂无评估记录趋势。</p>
          ) : (
            <div className="chart-wrapper" aria-label="评估记录趋势柱状图">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} allowDataOverflow={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="记录数量" fill="#315efb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
