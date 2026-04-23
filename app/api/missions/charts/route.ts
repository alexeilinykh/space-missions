import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/lib/data'
import {
  getMissionsByYear,
  getMissionStatusCount,
  getTopCompaniesByMissionCount,
  getTopLaunchSitesByMissionCount,
} from '@/lib/missions'

function parseSite(location: string): string {
  const parts = location.split(',').map((p) => p.trim())
  return parts.slice(-2).join(', ')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const company = searchParams.get('company') ?? ''
  const statuses = searchParams.getAll('status')
  const startYear = parseInt(searchParams.get('startYear') ?? '1957', 10)
  const endYear = parseInt(searchParams.get('endYear') ?? '2022', 10)

  if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
    return NextResponse.json({ error: 'Invalid year range' }, { status: 400 })
  }

  const filtersActive = company !== '' || statuses.length > 0

  // Filtered subset (used when any filter is active for chart data)
  const filtered = filtersActive
    ? getMissions().filter((m) => {
        const year = parseInt(m.Date.slice(0, 4), 10)
        if (year < startYear || year > endYear) return false
        if (company && m.Company !== company) return false
        if (statuses.length > 0 && !statuses.includes(m.MissionStatus)) return false
        return true
      })
    : null

  // ── byYear ────────────────────────────────────────────────────────────────
  // When no filters are active, use the library function (global totals).
  // When filters are active, count from the filtered subset.
  let byYear: { year: number; count: number }[]
  if (!filtersActive) {
    byYear = []
    for (let y = startYear; y <= endYear; y++) {
      byYear.push({ year: y, count: getMissionsByYear(y) })
    }
  } else {
    const countsByYear = new Map<number, number>()
    for (const m of filtered!) {
      const y = parseInt(m.Date.slice(0, 4), 10)
      if (!isNaN(y)) countsByYear.set(y, (countsByYear.get(y) ?? 0) + 1)
    }
    byYear = []
    for (let y = startYear; y <= endYear; y++) {
      byYear.push({ year: y, count: countsByYear.get(y) ?? 0 })
    }
  }

  // ── byCompany ─────────────────────────────────────────────────────────────
  // When no company filter: use the library function (top 15 globally).
  // When company filter is active: compute from filtered subset.
  let byCompany: [string, number][]
  if (!company && !filtersActive) {
    byCompany = getTopCompaniesByMissionCount(15)
  } else if (!company && filtersActive) {
    // Status filter active but no company filter — compute from filtered
    const counts = new Map<string, number>()
    for (const m of filtered!) {
      counts.set(m.Company, (counts.get(m.Company) ?? 0) + 1)
    }
    byCompany = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  } else {
    // Company filter active — single-company chart is not very useful but keep consistent
    const counts = new Map<string, number>()
    for (const m of filtered!) {
      counts.set(m.Company, (counts.get(m.Company) ?? 0) + 1)
    }
    byCompany = [...counts.entries()].sort((a, b) => b[1] - a[1])
  }

  // ── byStatus ──────────────────────────────────────────────────────────────
  // When no status filter: use the library function (global counts).
  // When status filter is active: compute from filtered subset.
  let byStatus: Record<string, number>
  if (statuses.length === 0 && !filtersActive) {
    byStatus = getMissionStatusCount()
  } else if (statuses.length === 0 && filtersActive) {
    // Company filter active but no status filter — compute from filtered
    byStatus = {}
    for (const m of filtered!) {
      byStatus[m.MissionStatus] = (byStatus[m.MissionStatus] ?? 0) + 1
    }
  } else {
    // Status filter active — compute from filtered
    byStatus = {}
    for (const m of filtered!) {
      byStatus[m.MissionStatus] = (byStatus[m.MissionStatus] ?? 0) + 1
    }
  }

  // ── byLocation ────────────────────────────────────────────────────────────
  // When no filters active: use the library function.
  // When filters active: compute from filtered subset.
  let byLocation: [string, number][]
  if (!filtersActive) {
    byLocation = getTopLaunchSitesByMissionCount(10)
  } else {
    const counts = new Map<string, number>()
    for (const m of filtered!) {
      const site = parseSite(m.Location)
      counts.set(site, (counts.get(site) ?? 0) + 1)
    }
    byLocation = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
  }

  return NextResponse.json({ byYear, byCompany, byStatus, byLocation })
}
