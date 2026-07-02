export type MatchPhase = 'group' | 'dieciseisavos' | 'octavos' | 'cuartos' | 'semifinal' | 'final';

export interface Team {
  id: string;
  name: string;
  flag: string; // Emoji representing the flag or SVG reference
  group?: string; // e.g., 'Grupo A'
}

export interface MatchIncident {
  minute: number;
  type: 'start' | 'goal_home' | 'goal_away' | 'yellow_home' | 'yellow_away' | 'red_home' | 'red_away' | 'shot_miss' | 'corner' | 'foul' | 'half_time' | 'end';
  title: string;
  description: string;
  timestamp: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  dateTime: string; // ISO string
  phase: MatchPhase;
  homeScore?: number; // Real home team score (undefined if not played yet)
  awayScore?: number; // Real away team score (undefined if not played yet)
  status: 'scheduled' | 'live' | 'finished';
  liveStartTimestamp?: number; // UNIX timestamp when game started in real-time
  mode?: 'simulated' | 'realtime'; // game live mode selector
  incidents?: MatchIncident[]; // real-time incidents feed
}

export interface Forecast {
  matchId: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  updatedAt: string;
  leagueCode?: string;
}

export type GameModeType = 'total' | 'sectional' | 'custom';

export interface CustomPhaseGroup {
  id: string;
  name: string;
  phases: MatchPhase[];
}

export interface League {
  code: string;
  name: string;
  creatorId: string;
  members: string[]; // User IDs belonging to this league
  costPerEntry?: number;
  bankConfig?: {
    bankName: string;
    accountType: 'ahorros' | 'corriente';
    accountNumber: string;
    ownerName: string;
    ownerId: string; // Cédula o RUC
    ownerEmail?: string;
  };
  gameMode?: GameModeType;
  customGroups?: CustomPhaseGroup[];
  poolDistributionMode?: 'proportional' | 'full';
}

export interface LeagueMemberInfo {
  userId: string;
  leagueCode: string;
  joinedAt: string;
  paid?: boolean;
  balance?: number; // Saldo apostado
  paymentStatus?: 'unpaid' | 'pending' | 'approved' | 'rejected';
  paymentVoucherUrl?: string;
  paymentVoucherAmount?: number;
  paymentCode?: string;
  paymentMethod?: 'transfer' | 'cash';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isAdmin?: boolean;
  isOfflineFallback?: boolean;
  onboarded?: boolean; // false = mostrar onboarding al primer ingreso
  email?: string;
  predictedChampion?: string;
  predictedScorer?: string;
  predictedAssister?: string;
}

export interface UserStats {
  userId: string;
  userName: string;
  userAvatar: string;
  exactMatchesCount: number; // 3 points
  trendMatchesCount: number; // 2 points
  simpleMatchesCount: number; // 1 point
  noMatchesCount: number; // 0 points
  totalPoints: number;
  pendingMatchesCount?: number;
  predictionsMadeCount?: number;
  championPoints?: number;
  scorerPoints?: number;
  assisterPoints?: number;
}

export interface ScoringResult {
  score: number;
  category: 'perfect' | 'trend' | 'simple' | 'none';
  reason: string;
}