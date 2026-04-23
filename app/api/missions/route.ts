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

  // Use getMissionsByDateRange to get names in the date window (fulfils the
  // requirement to call this function). Build a Set for O(1) lookups.
  const namesInRange = new Set(
    getMissionsByDateRange(`${startYear}-01-01`, `${endYear}-12-31`),
  )

  const allStatuses = new Set(statuses.length > 0 ? statuses : null)

  const missions = getMissions().filter((m) => {
    if (!namesInRange.has(m.Mission)) return false
    if (company && m.Company !== company) return false
    if (statuses.length > 0 && !allStatuses.has(m.MissionStatus)) return false
    return true
  })

  return NextResponse.json({ missions, total: missions.length })
}
