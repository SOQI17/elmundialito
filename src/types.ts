export type MatchPhase = 'group' | 'octavos' | 'cuartos' | 'semifinal' | 'final';

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
}

export interface League {
  code: string;
  name: string;
  creatorId: string;
  members: string[]; // User IDs belonging to this league
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isAdmin?: boolean;
  isOfflineFallback?: boolean;
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
}

export interface ScoringResult {
  score: number;
  category: 'perfect' | 'trend' | 'simple' | 'none';
  reason: string;
}
