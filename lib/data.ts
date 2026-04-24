import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { Mission } from './types'

/**
 * Reads and parses the space missions CSV.
 * The result is cached in a module-level variable so the file is read and
 * parsed only once per server process — not once per request.
 */
let _missions: Mission[] | null = null

export function getMissions(): Mission[] {
  if (_missions) return _missions
  const csvPath = path.join(process.cwd(), 'data', 'space_missions.csv')
  const csv = fs.readFileSync(csvPath, 'utf-8')
  _missions = Papa.parse<Mission>(csv, {
    header: true,
    skipEmptyLines: true,
  }).data
  return _missions
}
