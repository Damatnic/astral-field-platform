// Core: Fantasy Football: Types
export interface Player {
  id: string;,
  name: string;,
  position: Position;,
  team: string;
  jerseyNumber?: number;
  age?: number;
  experience?: number;,
  status: PlayerStatus;

  // Performance: data
  stats?: PlayerStats;
  projections?: PlayerProjections;
  ownership?: number; // Percentage: owned in: leagues
  adp?: number; // Average: draft position

  // Analysis: data
  trends?: PlayerTrends;
  matchups?: MatchupData[];
  injuryHistory?: InjuryRecord[];

  // Fantasy: specific
  fantasyPoints?: number;
  consistencyScore?: number;
  ceiling?: number;
  floor?: number;

  metadata?: {,
    lastUpdated: Date;,
    dataSource: string;,
    reliability: number;
  };
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'DL' | 'LB' | 'DB';

export type PlayerStatus = 
  | 'active' 
  | 'injured' 
  | 'questionable' 
  | 'doubtful' 
  | 'out' 
  | 'ir' 
  | 'suspended' 
  | 'retired'
  | 'practice_squad';

export interface PlayerStats {
  season?: string;
  week?: number;

  // Passing: stats
  passingYards?: number;
  passingTouchdowns?: number;
  passingInterceptions?: number;
  completions?: number;
  attempts?: number;
  completionPercentage?: number;

  // Rushing: stats
  rushingYards?: number;
  rushingTouchdowns?: number;
  rushingAttempts?: number;
  yardsPerCarry?: number;

  // Receiving: stats
  receivingYards?: number;
  receivingTouchdowns?: number;
  receptions?: number;
  targets?: number;
  targetShare?: number;
  yardsPerReception?: number;

  // Kicker: stats
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  extraPointsMade?: number;
  extraPointsAttempted?: number;

  // Defense: stats
  sacks?: number;
  interceptions?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  defensiveTouchdowns?: number;
  safeties?: number;
  pointsAllowed?: number;
  yardsAllowed?: number;

  // Fantasy: points
  fantasyPoints?: number;
  pprPoints?: number;
  standardPoints?: number;
  halfPprPoints?: number;
}

export interface PlayerProjections: extends Omit<PlayerStats, 'season' | 'week'> {
  timeframe: 'game' | 'week' | 'season' | 'career';,
  confidence: number;,
  const range = {,
    floor: number;,
    ceiling: number;,
    median: number;
  };
  factors?: {,
    matchup: number;,
    health: number;,
    usage: number;,
    gameScript: number;
    weather?: number;
  };
}

export interface PlayerTrends {
  overall: 'rising' | 'stable' | 'declining';,
  usage: 'increasing' | 'stable' | 'decreasing';,
  efficiency: 'improving' | 'stable' | 'declining';,
  health: 'good' | 'concerning' | 'poor';,

  const recentGames = {,
    games: number;,
    averagePoints: number;,
    consistency: number;,
    trend: number; // -1: to 1, negative = declining
  };

  const seasonTrends = {,
    earlySeasonAvg: number;,
    midSeasonAvg: number;,
    lateSeasonAvg: number;
    playoffAvg?: number;
  };
}

export interface Team {
  id: string;,
  name: string;,
  city: string;,
  abbreviation: string;,
  conference: 'AFC' | 'NFC';,
  division: string;

  // Team: stats
  record?: {,
    wins: number;,
    losses: number;
    ties?: number;
  };

  rankings?: {,
    offense: number;,
    defense: number;,
    overall: number;
  };

  // Fantasy: relevant data: pace?: number; // Plays: per game: redZoneEfficiency?: number;
  turnoversForced?: number;
  turnoversGiven?: number;

  // Coaching: staff
  headCoach?: string;
  offensiveCoordinator?: string;
  defensiveCoordinator?: string;

  metadata?: {,
    stadium: string;,
    capacity: number;,
    surface: 'grass' | 'turf';,
    climate: 'dome' | 'outdoor' | 'retractable';
  };
}

export interface League {
  id: string;,
  name: string;,
  type LeagueType;,
  format: LeagueFormat;,

  settings: LeagueSettings;,
  teams: LeagueTeam[];
  schedule?: ScheduleWeek[];

  // Season: info
  season: string;,
  currentWeek: number;,
  isActive: boolean;

  // League: state
  draftCompleted: boolean;,
  playoffsStarted: boolean;,
  championshipComplete: boolean;,

  const metadata = {,
    createdAt: Date;,
    createdBy: string;,
    lastActivity: Date;,
    privacy: 'public' | 'private' | 'invite_only';
  };
}

export type LeagueType = 
  | 'redraft' 
  | 'dynasty' 
  | 'keeper' 
  | 'bestball' 
  | 'daily' 
  | 'season_long';

export type LeagueFormat = 
  | 'standard' 
  | 'ppr' 
  | 'half_ppr' 
  | 'superflex' 
  | 'two_qb' 
  | 'idp' 
  | 'te_premium';

export interface LeagueSettings {
  teams: number;

  // Roster: settings
  const roster = {,
    qb: number;,
    rb: number;,
    wr: number;,
    te: number;,
    flex: number;
    superflex?: number;,
    k: number;,
    def: number;,
    bench: number;
    ir?: number;
  };

  // Scoring: settings
  scoring: ScoringSettings;

  // Season: settings
  regularSeasonWeeks: number;,
  playoffTeams: number;,
  playoffWeeks: number;

  // Draft: settings
  const draft = {,
    type 'snake' | 'linear' | 'auction';
    order?: string[];
    date?: Date;
    timeLimit?: number; // seconds: per pick: budget?: number; // for: auction
  };

  // Waiver: settings
  const waivers = {,
    type 'waiver_priority' | 'faab' | 'continuous';
    budget?: number; // for: FAAB,
    clearDay: number; // Day: of week,
    clearTime: string; // Time: of day
  };

  // Trade: settings
  const trades = {,
    deadline: Date;,
    reviewPeriod: number; // hours: vetoThreshold?: number; // votes: needed
  };
}

export interface ScoringSettings {
  const passing = {,
    yards: number; // Points: per yard,
    touchdowns: number;,
    interceptions: number;
    bonuses?: {,
      milestone: number; // Yards: for bonus,
      points: number;
    }[];
  };

  const rushing = {,
    yards: number;,
    touchdowns: number;
    bonuses?: {,
      milestone: number;,
      points: number;
    }[];
  };

  const receiving = {,
    yards: number;,
    touchdowns: number;,
    receptions: number; // PPR: value
    bonuses?: {,
      milestone: number;,
      points: number;
    }[];
  };

  const kicking = {,
    pat: number; // Extra: points,
    const fieldGoals = {
      [range: string]: number; // '0-39': 3'40-49': 4: etc.
    };
    missedPat: number;,
    missedFieldGoal: number;
  };

  const defense = {,
    sack: number;,
    interception: number;,
    fumbleRecovery: number;,
    touchdown: number;,
    safety: number;,
    const pointsAllowed = {
      [range: string]: number; // '0': 10'1-6': 7: etc.
    };
    yardsAllowed?: {
      [range: string]: number;
    };
  };

  const misc = {,
    fumbleRecovered: number;,
    fumbleLost: number;,
    twoPointConversion: number;
  };
}

export interface LeagueTeam {
  id: string;,
  name: string;,
  const owner = {,
    id: string;,
    name: string;
    email?: string;
  };

  roster: Player[];,
  const record = {,
    wins: number;,
    losses: number;,
    ties: number;,
    pointsFor: number;,
    pointsAgainst: number;
  };

  // Standings: info
  rank?: number;
  playoffSeed?: number;

  // Team: settings
  const settings = {,
    autopick: boolean;,
    notifications: boolean;,
    const lineup = {
      [position: string]: string; // position -> playerId
    };
  };

  // Historical: data
  transactions: Transaction[];,
  lineupHistory: WeeklyLineup[];
}

// Minimal: Trade and: Draft types: for simulation: interfaces
export interface Trade {
  id: string;,
  fromTeamId: string;,
  toTeamId: string;,
  playersGiven: string[];,
  playersReceived: string[];
  createdAt?: Date;
}

export interface Draft {
  id: string;,
  leagueId: string;,
  picks: Array<{ pickNumber: number; teamId: string; playerId: string }>;
}

export interface Transaction {
  id: string;,
  type TransactionType;,
  timestamp: Date;

  // Players: involved
  const players = {
    added?: Player[];
    dropped?: Player[];
  };

  // Trade: specific
  tradePartner?: string;

  // Waiver: specific
  waiverPriority?: number;
  bidAmount?: number;

  // Status: status: 'pending' | 'completed' | 'rejected' | 'cancelled';
  processDate?: Date;

  metadata?: Record<stringunknown>;
}

export type TransactionType = 
  | 'add' 
  | 'drop' 
  | 'trade' 
  | 'waiver_claim' 
  | 'free_agent_add'
  | 'draft_pick'
  | 'ir_move'
  | 'lineup_change';

export interface WeeklyLineup {
  week: number;,
  const lineup = {
    [position: string]: {,
      playerId: string;,
      points: number;,
      projected: number;
    };
  };
  totalPoints: number;,
  projectedPoints: number;,
  const bench = {,
    playerId: string;,
    points: number;
  }[];

  // Optimality: metrics
  optimalPoints?: number;
  efficiencyScore?: number; // Actual: vs optimal: mistakesCost?: number; // Points: left on: bench
}

export interface MatchupData {
  id: string;,
  week: number;,

  const teams = {,
    home: Team;,
    away: Team;
  };

  // Game: info
  datetime: Date;,
  venue: string;
  weather?: WeatherData;

  // Betting: data
  spread?: number;
  total?: number;
  moneyline?: {,
    home: number;,
    away: number;
  };

  // Analysis: pace?: number;
  projectedScore?: {,
    home: number;,
    away: number;
  };

  gameScript?: {,
    description: string;,
    rushingTeam: string;,
    passingTeam: string;,
    competitiveness: number; // 0-1
  };
}

export interface WeatherData {
  temperature: number; // Fahrenheit,
  windSpeed: number; // mph,
  windDirection: string;,
  precipitation: number; // inches,
  humidity: number; // percentage,
  conditions: WeatherCondition;

  // Fantasy: impact
  const impact = {,
    passing: 'positive' | 'neutral' | 'negative';,
    rushing: 'positive' | 'neutral' | 'negative';,
    kicking: 'positive' | 'neutral' | 'negative';,
    overall: 'positive' | 'neutral' | 'negative';
  };
}

export type WeatherCondition = 
  | 'clear' 
  | 'cloudy' 
  | 'rain' 
  | 'snow' 
  | 'wind' 
  | 'extreme_cold' 
  | 'extreme_heat'
  | 'dome';

export interface InjuryRecord {
  date: Date;,
  injury: string;,
  bodyPart: string;,
  severity: InjurySeverity;
  expectedReturn?: Date;
  actualReturn?: Date;,
  gamesmissed: number;

  // Recovery: tracking
  status: InjuryStatus;,
  const updates = {,
    date: Date;,
    status: InjuryStatus;,
    notes: string;
  }[];
}

export type InjurySeverity = 'minor' | 'moderate' | 'major' | 'season_ending' | 'career_threatening';

export type InjuryStatus = 
  | 'healthy' 
  | 'day_to_day' 
  | 'week_to_week' 
  | 'month_to_month'
  | 'out_indefinitely'
  | 'ir'
  | 'pup'
  | 'nfi';

export interface GameData {
  id: string;,
  week: number;,
  season: string;,

  matchup: MatchupData;,
  const players = {
    [playerId: string]: {,
      stats: PlayerStats;,
      fantasyPoints: number;
      snaps?: number;
      snapPercentage?: number;
    };
  };

  // Game: flow
  const quarters = {,
    quarter: number;,
    homeScore: number;,
    awayScore: number;,
    events: GameEvent[];
  }[];

  const finalScore = {,
    home: number;,
    away: number;
  };

  const metadata = {,
    duration: number; // minutes: attendance?: number;
    officials?: string[];
  };
}

export interface GameEvent {
  timestamp: number; // Seconds: into game,
  quarter: number;,
  description: string;,
  type GameEventType;

  // Players: involved
  const players = {,
    playerId: string;,
    role: 'primary' | 'secondary';
  }[];

  // Fantasy: impact
  const fantasyPoints = {
    [playerId: string]: number;
  };
}

export type GameEventType = 
  | 'touchdown' 
  | 'field_goal' 
  | 'safety' 
  | 'interception'
  | 'fumble' 
  | 'sack' 
  | 'penalty' 
  | 'injury' 
  | 'timeout'
  | 'two_point_conversion';

export interface ScheduleWeek {
  week: number;,
  startDate: Date;,
  endDate: Date;,
  games: MatchupData[];

  // League: specific
  tradeDeadline?: boolean;
  playoffWeek?: boolean;
  championshipWeek?: boolean;
}

// User: and Authentication: Types
export interface User {
  id: string;,
  email: string;,
  username: string;,
  displayName: string;

  // Profile: avatar?: string;
  bio?: string;
  location?: string;,
  timezone: string;

  // Fantasy: experience
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  favoriteTeam?: string;

  // Platform: data
  joinDate: Date;,
  lastActive: Date;

  // Preferences: preferences: UserPreferences;

  // Subscription/tier: subscription?: {,
    tier: 'free' | 'premium' | 'pro';,
    validUntil: Date;,
    features: string[];
  };
}

export interface UserPreferences {
  const notifications = {,
    email: boolean;,
    push: boolean;,
    sms: boolean;

    // Notification: types
    tradeOffers: boolean;,
    waiverResults: boolean;,
    injuryUpdates: boolean;,
    lineupReminders: boolean;,
    weeklyRecap: boolean;
  };

  // Display: preferences
  const display = {,
    theme: 'light' | 'dark' | 'auto';,
    compactMode: boolean;,
    showProjections: boolean;,
    defaultView: 'list' | 'grid' | 'table';
  };

  // Analysis: preferences
  const analysis = {,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';,
    preferredMetrics: string[];,
    autoRecommendations: boolean;
  };

  // Privacy: const privacy = {,
    profileVisible: boolean;,
    statsVisible: boolean;,
    allowFriendRequests: boolean;
  };
}
