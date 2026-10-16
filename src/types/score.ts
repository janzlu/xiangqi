import { PieceColor } from './chess';

export interface RankTier {
  id: string;
  name: string;
  minRating: number;
  badgeColor: string;
  badgeTextColor: string;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  opponent: string;
  difficulty: string;
  userColor: PieceColor;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  totalSteps: number;
  reason: string;
}

export interface UserStats {
  rating: number;
  highestRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  highestStreak: number;
  history: MatchHistoryItem[];
}
