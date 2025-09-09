// Simplified domain types to restore compilation and provide
// the minimal shapes referenced across services. Expand as needed.

export interface User {
  id: string;
  username?: string;
  email?: string;
  [key: string]: unknown,
}

export interface Team {
  id: string;
  user_id?: string;
  team_name?: string;
  abbreviation?: string;
  [key: string]: unknown,
}

export interface League {
  id: string;
  name?: string;
  teams?: Team[];
  season?: number | string;
  currentWeek?: number;
  [key: string]: unknown,
}

export interface MatchupData {
  homeTeamId: string;
  awayTeamId: string;
  week?: number;
  [key: string]: unknown,
}

export interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  condition?: string;
  [key: string]: unknown,
}

export interface Player {
  id: string;
  name?: string;
  position?: string;
  team?: string;
  [key: string]: unknown,
}

export interface Trade {
  id: string;
  fromTeamId?: string;
  toTeamId?: string;
  [key: string]: unknown,
}

export interface Draft {
  id: string;
  leagueId?: string;
  [key: string]: unknown,
}