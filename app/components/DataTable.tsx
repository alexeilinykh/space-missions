'use client'

import { useState, useMemo } from 'react'
import type { Mission } from '@/lib/types'

type SortKey = keyof Pick<Mission, 'Company' | 'Date' | 'Mission' | 'Rocket' | 'MissionStatus' | 'Price'>
type SortDir = 'asc' | 'desc'

const STATUS_BADGE: Record<string, string> = {
  Success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Failure: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'Partial Failure': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Prelaunch Failure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
}

const PAGE_SIZE = 50

interface Props {
  missions: Mission[]
  loading?: boolean
}

interface ColDef {
  key: SortKey
  label: string
  className?: string
}

const COLUMNS: ColDef[] = [
  { key: 'Date', label: 'Date', className: 'w-28 shrink-0' },
  { key: 'Company', label: 'Company', className: 'w-36 shrink-0' },
  { key: 'Mission', label: 'Mission' },
  { key: 'Rocket', label: 'Rocket', className: 'hidden md:table-cell' },
  { key: 'MissionStatus', label: 'Status', className: 'w-36 shrink-0' },
  { key: 'Price', label: 'Price (M$)', className: 'w-24 shrink-0 text-right hidden lg:table-cell' },
]

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function DataTable({ missions, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('Date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [prevMissions, setPrevMissions] = useState(missions)
  if (prevMissions !== missions) {
    setPrevMissions(missions)
    setPage(0)
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...missions].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (sortKey === 'Price') {
        return (parseFloat(av) || 0) < (parseFloat(bv) || 0) ? -dir : dir
      }
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }, [missions, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? (
            <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {missions.length.toLocaleString()}
              </span>{' '}
              missions matched
            </>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-gray-400">
            Page {page + 1} of {totalPages}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-700 dark:bg-gray-800/60">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ${col.className ?? ''}`}
                >
                  {col.label}
                  <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700/50 dark:bg-gray-900">
            {loading && pageData.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                        <div className="h-3.5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : pageData.map((m, i) => (
              <tr
                key={`${m.Date}-${m.Mission}-${i}`}
                className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {m.Date}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                  {m.Company}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.Mission}</td>
                <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-400 md:table-cell">
                  {m.Rocket}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[m.MissionStatus] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {m.MissionStatus}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-xs text-gray-500 dark:text-gray-400 lg:table-cell">
                  {m.Price ? `$${parseFloat(m.Price).toLocaleString()}M` : '—'}
                </td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
