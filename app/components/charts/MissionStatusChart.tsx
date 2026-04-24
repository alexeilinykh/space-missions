'use client'

import { memo, useMemo } from 'react'
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
  data: Record<string, number>
}

const STATUS_COLORS: Record<string, string> = {
  Success: '#22c55e',
  Failure: '#ef4444',
  'Partial Failure': '#f59e0b',
  'Prelaunch Failure': '#f97316',
}

const STATUS_ORDER = ['Success', 'Failure', 'Partial Failure', 'Prelaunch Failure']

export default memo(function MissionStatusChart({ data }: Props) {
  const chartData = useMemo(
    () =>
      STATUS_ORDER.filter((s) => data[s] !== undefined).map((status) => ({
        status,
        count: data[status] ?? 0,
      })),
    [data],
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Mission Outcomes
      </h2>
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Breakdown of all missions by final status
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 16, left: 0, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-12}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
            formatter={(v) => [v ?? 0, 'Missions']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? '#6b7280'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
