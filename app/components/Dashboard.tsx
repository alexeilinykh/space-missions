'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Mission, MissionStatus } from '@/lib/types'
import FilterPanel, { type Filters } from './FilterPanel'
import SummaryStats from './SummaryStats'
import DataTable from './DataTable'
import MissionsOverTimeChart from './charts/MissionsOverTimeChart'
import TopCompaniesChart from './charts/TopCompaniesChart'
import MissionStatusChart from './charts/MissionStatusChart'
import TopLaunchSitesChart from './charts/TopLaunchSitesChart'

// ── Types matching the API response shapes ────────────────────────────────────

interface TableData {
  missions: Mission[]
  total: number
}

interface StatsData {
  totalMissions: number
  successRate: number
  avgMissionsPerYear: number
  mostUsedRocket: string
}

interface ChartsData {
  byYear: { year: number; count: number }[]
  byCompany: [string, number][]
  byStatus: Record<string, number>
  byLocation: [string, number][]
}

// ── SWR fetcher ───────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API error ${r.status}`)
    return r.json()
  })

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_STATUSES = new Set<MissionStatus>([
  'Success',
  'Failure',
  'Partial Failure',
  'Prelaunch Failure',
])

const ALL_STATUS_ARRAY: MissionStatus[] = [
  'Success',
  'Failure',
  'Partial Failure',
  'Prelaunch Failure',
]

function buildParams(filters: Filters): string {
  const p = new URLSearchParams()
  if (filters.company) p.set('company', filters.company)
  // Only send status params when fewer than all are selected
  if (filters.statuses.size < ALL_STATUS_ARRAY.length) {
    for (const s of filters.statuses) p.append('status', s)
  }
  p.set('startYear', String(filters.startYear))
  p.set('endYear', String(filters.endYear))
  return p.toString()
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  companies: string[]
  minYear: number
  maxYear: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard({ companies, minYear, maxYear }: Props) {
  const [filters, setFilters] = useState<Filters>({
    company: '',
    statuses: ALL_STATUSES,
    startYear: minYear,
    endYear: maxYear,
  })

  // swrParams is derived directly from applied filters — no debounce needed
  // since FilterPanel now only calls onChange on explicit Apply / Reset.
  const swrParams = buildParams(filters)

  // ── SWR hooks ───────────────────────────────────────────────────────────────
  const { data: tableData, isLoading: tableLoading } = useSWR<TableData>(
    `/api/missions?${swrParams}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )

  const { data: statsData, isLoading: statsLoading } = useSWR<StatsData>(
    `/api/missions/stats?${swrParams}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )

  const { data: chartsData, isLoading: chartsLoading } = useSWR<ChartsData>(
    `/api/missions/charts?${swrParams}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col gap-8 bg-gray-50 p-6 dark:bg-gray-950 lg:p-10">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Space Missions Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Global space launch data, 1957–2022
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filter */}
        <div className="w-full shrink-0 lg:w-56">
          <FilterPanel
            companies={companies}
            filters={filters}
            onChange={setFilters}
            minYear={minYear}
            maxYear={maxYear}
          />
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* Summary stats */}
          <div className={statsLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <SummaryStats
              totalMissions={statsData?.totalMissions ?? 0}
              overallSuccessRate={statsData?.successRate ?? 0}
              mostUsedRocket={statsData?.mostUsedRocket ?? '—'}
              avgMissionsPerYear={statsData?.avgMissionsPerYear ?? 0}
              loading={statsLoading}
            />
          </div>

          {/* Charts row 1 */}
          <div
            className={`grid grid-cols-1 gap-6 xl:grid-cols-2 ${chartsLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}`}
          >
            <MissionsOverTimeChart data={chartsData?.byYear ?? []} />
            <MissionStatusChart data={chartsData?.byStatus ?? {}} />
          </div>

          {/* Charts row 2 */}
          <div
            className={`grid grid-cols-1 gap-6 xl:grid-cols-2 ${chartsLoading ? 'opacity-50 transition-opacity' : 'transition-opacity'}`}
          >
            <TopCompaniesChart data={chartsData?.byCompany ?? []} />
            <TopLaunchSitesChart data={chartsData?.byLocation ?? []} />
          </div>

          {/* Data table */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mission Records
            </h2>
            <DataTable
              missions={tableData?.missions ?? []}
              loading={tableLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
