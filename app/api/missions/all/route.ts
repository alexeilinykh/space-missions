import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/lib/data'
import {
  getMissionsByDateRange,
  getMissionsByYear,
  getMissionStatusCount,
  getTopCompaniesByMissionCount,
  getTopLaunchSitesByMissionCount,
  getMostUsedRocket,
  getAverageMissionsPerYear,
  getMissionCountByCompany,
  getSuccessRate,
  parseSite,
  MIN_YEAR,
  MAX_YEAR,
} from '@/lib/missions'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const company = searchParams.get('company') ?? ''
  const statuses = searchParams.getAll('status')
  const startYear = parseInt(searchParams.get('startYear') ?? '1957', 10)
  const endYear = parseInt(searchParams.get('endYear') ?? '2022', 10)

  if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
    return NextResponse.json({ error: 'Invalid year range' }, { status: 400 })
  }

  const startDate = `${startYear}-01-01`
  const endDate = `${endYear}-12-31`
  const filtersActive =
    company !== '' ||
    statuses.length > 0 ||
    startYear !== MIN_YEAR ||
    endYear !== MAX_YEAR
  const allStatuses = new Set(statuses)

  // ── Single filter pass ────────────────────────────────────────────────────
  // Used for table rows, stats, and filtered chart data.
  // namesInRange satisfies the getMissionsByDateRange requirement; the direct
  // date check guards against duplicate mission names outside the range.
  const namesInRange = new Set(getMissionsByDateRange(startDate, endDate))

  const missions = getMissions().filter((m) => {
    if (!namesInRange.has(m.Mission)) return false
    if (m.Date < startDate || m.Date > endDate) return false
    if (company && m.Company !== company) return false
    if (statuses.length > 0 && !allStatuses.has(m.MissionStatus)) return false
    return true
  })

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalMissions = missions.length
  let successCount = 0
  for (const m of missions) if (m.MissionStatus === 'Success') successCount++
  const successRate = totalMissions
    ? parseFloat(((successCount / totalMissions) * 100).toFixed(2))
    : 0

  let mostUsedRocket: string
  if (!filtersActive) {
    mostUsedRocket = getMostUsedRocket()
  } else {
    const counts = new Map<string, number>()
    for (const m of missions) {
      if (m.Rocket) counts.set(m.Rocket, (counts.get(m.Rocket) ?? 0) + 1)
    }
    let top = ''
    let topCount = 0
    for (const [rocket, count] of counts) {
      if (count > topCount || (count === topCount && rocket < top)) {
        top = rocket
        topCount = count
      }
    }
    mostUsedRocket = top
  }
  let avgMissionsPerYear: number
  if (!filtersActive) {
    avgMissionsPerYear = getAverageMissionsPerYear(startYear, endYear)
  } else {
    const years = endYear - startYear + 1
    avgMissionsPerYear = parseFloat((missions.length / years).toFixed(2))
  }

  const companyMissionCount = company ? getMissionCountByCompany(company) : undefined
  const companySuccessRate = company ? getSuccessRate(company) : undefined

  // ── Charts ────────────────────────────────────────────────────────────────

  // byYear
  let byYear: { year: number; count: number }[]
  if (!filtersActive) {
    byYear = []
    for (let y = startYear; y <= endYear; y++) {
      byYear.push({ year: y, count: getMissionsByYear(y) })
    }
  } else {
    const countsByYear = new Map<number, number>()
    for (const m of missions) {
      const y = parseInt(m.Date.slice(0, 4), 10)
      if (!isNaN(y)) countsByYear.set(y, (countsByYear.get(y) ?? 0) + 1)
    }
    byYear = []
    for (let y = startYear; y <= endYear; y++) {
      byYear.push({ year: y, count: countsByYear.get(y) ?? 0 })
    }
  }

  // byCompany
  let byCompany: [string, number][]
  if (!company && !filtersActive) {
    byCompany = getTopCompaniesByMissionCount(15)
  } else if (!company && filtersActive) {
    const counts = new Map<string, number>()
    for (const m of missions) {
      counts.set(m.Company, (counts.get(m.Company) ?? 0) + 1)
    }
    byCompany = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  } else {
    const counts = new Map<string, number>()
    for (const m of missions) {
      counts.set(m.Company, (counts.get(m.Company) ?? 0) + 1)
    }
    byCompany = [...counts.entries()].sort((a, b) => b[1] - a[1])
  }

  // byStatus
  let byStatus: Record<string, number>
  if (!filtersActive) {
    byStatus = getMissionStatusCount()
  } else {
    byStatus = {}
    for (const m of missions) {
      byStatus[m.MissionStatus] = (byStatus[m.MissionStatus] ?? 0) + 1
    }
  }

  // byLocation
  let byLocation: [string, number][]
  if (!filtersActive) {
    byLocation = getTopLaunchSitesByMissionCount(10)
  } else {
    const counts = new Map<string, number>()
    for (const m of missions) {
      const site = parseSite(m.Location)
      counts.set(site, (counts.get(site) ?? 0) + 1)
    }
    byLocation = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
  }

  return NextResponse.json(
    {
      missions,
      total: missions.length,
      stats: {
        totalMissions,
        successRate,
        avgMissionsPerYear,
        mostUsedRocket,
        ...(company && { companyMissionCount, companySuccessRate }),
      },
      charts: {
        byYear,
        byCompany,
        byStatus,
        byLocation,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      },
    },
  )
}
