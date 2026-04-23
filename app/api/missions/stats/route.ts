import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/lib/data'
import {
  getMostUsedRocket,
  getAverageMissionsPerYear,
  getMissionCountByCompany,
  getSuccessRate,
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

  // Compute filtered subset for totalMissions / successRate
  const filtered = getMissions().filter((m) => {
    const year = parseInt(m.Date.slice(0, 4), 10)
    if (year < startYear || year > endYear) return false
    if (company && m.Company !== company) return false
    if (statuses.length > 0 && !statuses.includes(m.MissionStatus)) return false
    return true
  })

  const totalMissions = filtered.length
  const successCount = filtered.filter((m) => m.MissionStatus === 'Success').length
  const successRate = totalMissions
    ? parseFloat(((successCount / totalMissions) * 100).toFixed(2))
    : 0

  // Library functions — operate on the full dataset
  const mostUsedRocket = getMostUsedRocket()
  const avgMissionsPerYear = getAverageMissionsPerYear(startYear, endYear)

  // Company-specific stats (only when a company filter is active)
  const companyMissionCount = company ? getMissionCountByCompany(company) : undefined
  const companySuccessRate = company ? getSuccessRate(company) : undefined

  return NextResponse.json({
    totalMissions,
    successRate,
    avgMissionsPerYear,
    mostUsedRocket,
    ...(company && { companyMissionCount, companySuccessRate }),
  })
}
