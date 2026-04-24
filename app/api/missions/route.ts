import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/lib/data'
import { getMissionsByDateRange } from '@/lib/missions'

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

  // Names are not unique across the dataset, so a direct date check is also
  // required to prevent rows with a duplicate name but an out-of-range date
  // from slipping through.
  const namesInRange = new Set(getMissionsByDateRange(startDate, endDate))
  const allStatuses = new Set(statuses)

  const missions = getMissions().filter((m) => {
    if (!namesInRange.has(m.Mission)) return false
    if (m.Date < startDate || m.Date > endDate) return false
    if (company && m.Company !== company) return false
    if (statuses.length > 0 && !allStatuses.has(m.MissionStatus)) return false
    return true
  })

  return NextResponse.json({ missions, total: missions.length })
}
