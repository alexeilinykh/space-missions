import { getMissions } from './data'

// ── Private validation helpers ────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function requireNonBlankString(val: string, name: string): string {
  if (typeof val !== 'string' || val.trim().length === 0)
    throw new Error(
      `${name} must be a non-blank string, received: ${JSON.stringify(val)}`,
    )
  return val.trim()
}

function requirePositiveInteger(val: number, name: string): void {
  if (!Number.isInteger(val) || val <= 0)
    throw new Error(
      `${name} must be a positive integer, received: ${val}`,
    )
}

function requireInteger(val: number, name: string): void {
  if (!Number.isInteger(val))
    throw new Error(`${name} must be an integer, received: ${val}`)
}

function requireIsoDate(val: string, name: string): void {
  if (!ISO_DATE_RE.test(val))
    throw new Error(
      `${name} must be an ISO date string (YYYY-MM-DD), received: ${JSON.stringify(val)}`,
    )
}

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Returns the total number of missions for the given company.
 * Returns 0 if the company exists in the dataset but has no missions, or if
 * the company name is not found.
 * Throws if companyName is blank or not a string.
 *
 * Example: getMissionCountByCompany("NASA") → 394
 */
export function getMissionCountByCompany(companyName: string): number {
  const name = requireNonBlankString(companyName, 'companyName')
  return getMissions().filter((m) => m.Company === name).length
}

/**
 * Returns the success rate (0–100) for the given company, rounded to
 * 2 decimal places. Only "Success" counts as a success.
 * Returns 0 if the company is not found in the dataset.
 * Throws if companyName is blank or not a string.
 *
 * Example: getSuccessRate("NASA") → 87.34
 */
export function getSuccessRate(companyName: string): number {
  const name = requireNonBlankString(companyName, 'companyName')
  const missions = getMissions().filter((m) => m.Company === name)
  if (missions.length === 0) return 0.0
  const successes = missions.filter((m) => m.MissionStatus === 'Success').length
  return parseFloat(((successes / missions.length) * 100).toFixed(2))
}

/**
 * Returns the names of all missions whose date falls within [startDate, endDate]
 * (inclusive). Both dates must be ISO strings in YYYY-MM-DD format.
 * Throws if either date is not a valid YYYY-MM-DD string, or if startDate is
 * after endDate.
 *
 * Example: getMissionsByDateRange("1957-01-01", "1957-12-31")
 *          → ["Sputnik-1", "Sputnik-2", ...]
 */
export function getMissionsByDateRange(
  startDate: string,
  endDate: string,
): string[] {
  requireIsoDate(startDate, 'startDate')
  requireIsoDate(endDate, 'endDate')
  if (startDate > endDate)
    throw new Error(
      `startDate must not be after endDate, received: ${startDate} > ${endDate}`,
    )
  return getMissions()
    .filter((m) => m.Date >= startDate && m.Date <= endDate)
    .sort((a, b) => a.Date.localeCompare(b.Date) || a.Mission.localeCompare(b.Mission))
    .map((m) => m.Mission)
}

/**
 * Returns the top n companies sorted by mission count descending.
 * Each element is a [companyName, count] tuple.
 * If n exceeds the number of distinct companies, all companies are returned.
 * Throws if n is not a positive integer.
 *
 * Example: getTopCompaniesByMissionCount(3)
 *          → [["RVSN USSR", 1777], ["Arianespace", 279], ["NASA", 199]]
 */
export function getTopCompaniesByMissionCount(n: number): [string, number][] {
  requirePositiveInteger(n, 'n')
  const counts = new Map<string, number>()
  for (const m of getMissions()) {
    counts.set(m.Company, (counts.get(m.Company) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
}

/**
 * Returns a count of missions grouped by MissionStatus.
 * Returns an empty object if the dataset is empty.
 *
 * Example: getMissionStatusCount()
 *          → { Success: 3879, Failure: 485, "Partial Failure": 68, "Prelaunch Failure": 7 }
 */
export function getMissionStatusCount(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of getMissions()) {
    counts[m.MissionStatus] = (counts[m.MissionStatus] ?? 0) + 1
  }
  return counts
}

/**
 * Returns the number of missions launched in the given year.
 * Returns 0 for years that have no recorded missions.
 * Throws if year is not an integer.
 *
 * Example: getMissionsByYear(2020) → 114
 */
export function getMissionsByYear(year: number): number {
  requireInteger(year, 'year')
  const prefix = String(year)
  return getMissions().filter((m) => m.Date.startsWith(prefix)).length
}

/**
 * Returns the name of the rocket used in the most missions.
 * Returns an empty string if the dataset is empty or all rocket names are blank.
 *
 * Example: getMostUsedRocket() → "Cosmos-3M (11K65M)"
 */
export function getMostUsedRocket(): string {
  const counts = new Map<string, number>()
  for (const m of getMissions()) {
    if (m.Rocket) counts.set(m.Rocket, (counts.get(m.Rocket) ?? 0) + 1)
  }
  let topRocket = ''
  let topCount = 0
  for (const [rocket, count] of counts) {
    if (count > topCount || (count === topCount && rocket < topRocket)) {
      topCount = count
      topRocket = rocket
    }
  }
  return topRocket
}

/**
 * Parses a raw Location string and returns a short site label using the
 * last two comma-separated parts (e.g. "Baikonur Cosmodrome, Kazakhstan").
 */
function parseSite(location: string): string {
  const parts = location.split(',').map((p) => p.trim())
  return parts.slice(-2).join(', ')
}

/**
 * Returns the top n launch sites sorted by mission count descending.
 * Each element is a [siteName, count] tuple.
 * Site names are derived from the last two comma-separated parts of the
 * Location field (e.g. "Baikonur Cosmodrome, Kazakhstan").
 * Ties are broken alphabetically by site name.
 * Throws if n is not a positive integer.
 *
 * Example: getTopLaunchSitesByMissionCount(3)
 *          → [["Plesetsk Cosmodrome, Russia", 1278], ...]
 */
export function getTopLaunchSitesByMissionCount(n: number): [string, number][] {
  requirePositiveInteger(n, 'n')
  const counts = new Map<string, number>()
  for (const m of getMissions()) {
    const site = parseSite(m.Location)
    counts.set(site, (counts.get(site) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
}

/**
 * Returns the average number of missions per year over [startYear, endYear]
 * (inclusive), rounded to 2 decimal places.
 * Throws if either argument is not an integer, or if startYear is after endYear.
 *
 * Example: getAverageMissionsPerYear(2010, 2020) → 87.45
 */
export function getAverageMissionsPerYear(
  startYear: number,
  endYear: number,
): number {
  requireInteger(startYear, 'startYear')
  requireInteger(endYear, 'endYear')
  if (startYear > endYear)
    throw new Error(
      `startYear must not be after endYear, received: ${startYear} > ${endYear}`,
    )
  let total = 0
  for (let y = startYear; y <= endYear; y++) {
    total += getMissionsByYear(y)
  }
  const years = endYear - startYear + 1
  return parseFloat((total / years).toFixed(2))
}
