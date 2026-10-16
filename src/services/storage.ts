import { UserStats } from '../types/score';
import { AIDifficulty } from '../types/ai';
import { PieceColor } from '../types/chess';

const STATS_STORAGE_KEY = 'xiangqi_user_stats_v1';
const PREFS_STORAGE_KEY = 'xiangqi_user_prefs_v1';

export interface UserPreferences {
  soundEnabled: boolean;
  difficulty: AIDifficulty;
  playerColor: PieceColor;
}

const DEFAULT_STATS: UserStats = {
  rating: 1200,
  highestRating: 1200,
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  highestStreak: 0,
  history: [],
};

const DEFAULT_PREFS: UserPreferences = {
  soundEnabled: true,
  difficulty: 'intermediate',
  playerColor: 'red',
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save user stats', err);
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences', err);
  }
}
