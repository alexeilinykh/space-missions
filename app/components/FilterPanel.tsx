'use client'

import { useState, useCallback } from 'react'
import type { MissionStatus } from '@/lib/types'

const ALL_STATUSES: MissionStatus[] = [
  'Success',
  'Failure',
  'Partial Failure',
  'Prelaunch Failure',
]

export interface Filters {
  company: string
  statuses: Set<MissionStatus>
  startYear: number
  endYear: number
}

interface Props {
  companies: string[]
  filters: Filters   // currently applied filters (from parent)
  onChange: (f: Filters) => void
  minYear: number
  maxYear: number
}

export default function FilterPanel({
  companies,
  filters,
  onChange,
  minYear,
  maxYear,
}: Props) {
  // Pending (unapplied) state — all controls mutate this; nothing hits the
  // parent until Apply is clicked.
  const [pending, setPending] = useState<Filters>(() => ({
    ...filters,
    statuses: new Set(filters.statuses),
  }))

  // Local strings for year inputs so the user can type freely.
  // Apply clamps and commits them; Reset clears them via the prev* sync below.
  const [localStart, setLocalStart] = useState(String(filters.startYear))
  const [localEnd, setLocalEnd] = useState(String(filters.endYear))

  // Sync local year strings when pending year changes externally (Reset).
  // Uses React's "adjusting state during render" pattern instead of useEffect.
  const [prevPendingStart, setPrevPendingStart] = useState(pending.startYear)
  const [prevPendingEnd, setPrevPendingEnd] = useState(pending.endYear)
  if (prevPendingStart !== pending.startYear) {
    setPrevPendingStart(pending.startYear)
    setLocalStart(String(pending.startYear))
  }
  if (prevPendingEnd !== pending.endYear) {
    setPrevPendingEnd(pending.endYear)
    setLocalEnd(String(pending.endYear))
  }

  const toggleStatus = useCallback((s: MissionStatus) => {
    const next = new Set(pending.statuses)
    if (next.has(s)) next.delete(s)
    else next.add(s)
    setPending((prev) => ({ ...prev, statuses: next }))
  }, [pending.statuses])

  function handleApply() {
    const rawStart = parseInt(localStart, 10)
    const rawEnd = parseInt(localEnd, 10)
    // Clamp to dataset bounds; if inverted, swap.
    const a = !isNaN(rawStart) ? Math.max(minYear, Math.min(maxYear, rawStart)) : minYear
    const b = !isNaN(rawEnd)   ? Math.max(minYear, Math.min(maxYear, rawEnd))   : maxYear
    const start = Math.min(a, b)
    const end   = Math.max(a, b)
    const committed: Filters = { ...pending, startYear: start, endYear: end }
    setLocalStart(String(start))
    setLocalEnd(String(end))
    setPending(committed)
    onChange(committed)
  }

  function handleReset() {
    const defaults: Filters = {
      company: '',
      statuses: new Set(ALL_STATUSES),
      startYear: minYear,
      endYear: maxYear,
    }
    setPending(defaults)
    onChange(defaults)
  }

  // Highlight Apply when pending state differs from what's actually applied.
  const isPending =
    pending.company !== filters.company ||
    localStart !== String(filters.startYear) ||
    localEnd !== String(filters.endYear) ||
    pending.statuses.size !== filters.statuses.size ||
    [...pending.statuses].some((s) => !filters.statuses.has(s))

  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Company */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Company
        </label>
        <select
          value={pending.company}
          onChange={(e) => setPending({ ...pending, company: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Mission Status
        </p>
        <div className="flex flex-col gap-1.5">
          {ALL_STATUSES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={pending.statuses.has(s)}
                onChange={() => toggleStatus(s)}
                className="h-4 w-4 rounded accent-blue-500"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      {/* Year range */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Year Range
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Apply */}
      <button
        onClick={handleApply}
        className={`rounded-lg py-2 text-xs font-semibold transition ${
          isPending
            ? 'bg-blue-600 cursor-pointer text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            : 'border border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
        }`}
      >
        {isPending ? 'Apply filters' : 'Filters applied'}
      </button>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="-mt-4 rounded-lg border cursor-pointer border-gray-200 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        Reset filters
      </button>
    </aside>
  )
}
