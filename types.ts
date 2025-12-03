export interface Team {
  id: string;
  name: string;
  flag: string; // Emoji or short code
  rating: number; // For basic simulation logic
}

export interface PoolTeam extends Team {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number; // Table points
  diff: number;   // Point difference
}

export interface Pool {
  id: string; // A, B, C, D, E, F
  teams: PoolTeam[];
}

export interface MatchResult {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  winnerId: string;
  summary?: string;
  isSimulated: boolean;
}

export interface KnockoutMatch {
  id: string;
  round: 'R16' | 'QF' | 'SF' | 'Final' | '3rd';
  matchLabel: string; // e.g., "Winner Pool A vs Best 3rd"
  teamA: Team | null;
  teamB: Team | null;
  result: MatchResult | null;
  nextMatchId?: string; // ID of the match the winner advances to
  nextMatchSlot?: 'A' | 'B'; // Which slot in the next match
  loserMatchId?: string; // ID of the match the loser drops to (for Semi-Finals)
  loserMatchSlot?: 'A' | 'B';
}

export type TournamentPhase = 'POOLS' | 'KNOCKOUT';