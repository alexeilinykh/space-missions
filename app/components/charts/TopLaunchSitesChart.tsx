'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Props {
  data: [string, number][]
}

const COLORS = [
  '#10b981', '#34d399', '#6ee7b7', '#059669', '#047857',
  '#a7f3d0', '#d1fae5', '#065f46', '#14b8a6', '#2dd4bf',
]

export default function TopLaunchSitesChart({ data }: Props) {
  const chartData = data.map(([site, count]) => ({ site, count }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Top 10 Launch Sites
      </h2>
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Mission count by launch location
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="site"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={160}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
            formatter={(v) => [v ?? 0, 'Missions']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
