import { getMissions } from '@/lib/data'
import { getTopCompaniesByMissionCount } from '@/lib/missions'
import Dashboard from './components/Dashboard'

export default function Home() {
  const topCompanies = getTopCompaniesByMissionCount(15)
  const companies = topCompanies.map(([c]) => c)

  const years = getMissions()
    .map((m) => parseInt(m.Date.slice(0, 4), 10))
    .filter((y) => !isNaN(y))
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <Dashboard
      companies={companies}
      minYear={minYear}
      maxYear={maxYear}
    />
  )
}
