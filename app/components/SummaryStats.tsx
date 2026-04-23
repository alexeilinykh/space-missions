interface Stat {
  label: string
  value: string
  sub?: string
}

interface Props {
  totalMissions: number
  overallSuccessRate: number
  mostUsedRocket: string
  avgMissionsPerYear: number
  loading?: boolean
}

export default function SummaryStats({
  totalMissions,
  overallSuccessRate,
  mostUsedRocket,
  avgMissionsPerYear,
  loading,
}: Props) {
  const stats: Stat[] = [
    {
      label: 'Total Missions',
      value: totalMissions.toLocaleString(),
      sub: 'In selected range',
    },
    {
      label: 'Success Rate',
      value: `${overallSuccessRate}%`,
      sub: 'Success / total launches',
    },
    {
      label: 'Most Used Rocket',
      value: mostUsedRocket,
      sub: 'By number of flights',
    },
    {
      label: 'Avg Missions / Year',
      value: avgMissionsPerYear.toLocaleString(),
      sub: 'Across selected year range',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {s.label}
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold text-gray-900 dark:text-gray-50">
              {s.value}
            </p>
          )}
          {s.sub && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
