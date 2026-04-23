import { cache } from 'react'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { Mission } from './types'

/**
 * Reads and parses the space missions CSV once per request.
 * React.cache() memoises the result — subsequent calls within
 * the same server render return the already-parsed array.
 */
export const getMissions = cache((): Mission[] => {
  const csvPath = path.join(process.cwd(), 'data', 'space_missions.csv')
  const csv = fs.readFileSync(csvPath, 'utf-8')
  const result = Papa.parse<Mission>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  return result.data
})
