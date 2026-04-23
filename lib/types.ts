export type MissionStatus =
  | 'Success'
  | 'Failure'
  | 'Partial Failure'
  | 'Prelaunch Failure'

export type RocketStatus = 'Active' | 'Retired'

export interface Mission {
  Company: string
  Location: string
  Date: string       // YYYY-MM-DD
  Time: string       // HH:MM:SS (may be empty)
  Rocket: string
  Mission: string
  RocketStatus: RocketStatus
  Price: string      // numeric string or empty
  MissionStatus: MissionStatus
}
