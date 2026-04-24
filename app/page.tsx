import { MIN_YEAR, MAX_YEAR, TOP_COMPANY_NAMES } from '@/lib/missions'
import Dashboard from './components/Dashboard'

export default function Home() {
  return <Dashboard companies={TOP_COMPANY_NAMES} minYear={MIN_YEAR} maxYear={MAX_YEAR} />
}
