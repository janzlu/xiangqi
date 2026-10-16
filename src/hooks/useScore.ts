import { useState, useCallback } from 'react';
import { UserStats, RankTier, MatchHistoryItem } from '../types/score';
import { AIDifficulty } from '../types/ai';
import { PieceColor } from '../types/chess';
import { DIFFICULTY_CONFIGS } from '../core/constants';
import { calculateRatingChange, getNextRankTier, getRankTier } from '../services/rating';
import { loadUserStats, saveUserStats } from '../services/storage';

export function useScore() {
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());

  const currentTier: RankTier = getRankTier(stats.rating);
  const { nextTier, progress } = getNextRankTier(stats.rating);

  const recordGameResult = useCallback((
    result: 'win' | 'loss' | 'draw',
    difficulty: AIDifficulty,
    userColor: PieceColor,
    totalSteps: number,
    reason: string
  ): number => {
    const oppConfig = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.intermediate;
    const opponentRating = oppConfig?.rating ?? 1400;

    const ratingDelta = calculateRatingChange(
      stats.rating,
      opponentRating,
      result,
      stats.currentStreak
    );

    const newRating = Math.max(100, stats.rating + ratingDelta);
    const newStreak = result === 'win' ? stats.currentStreak + 1 : 0;
    const newHighestStreak = Math.max(stats.highestStreak, newStreak);
    const newHighestRating = Math.max(stats.highestRating, newRating);

    const historyItem: MatchHistoryItem = {
      id: `${Date.now()}`,
      date: new Date().toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      opponent: oppConfig?.name ?? '电脑对手',
      difficulty,
      userColor,
      result,
      ratingChange: ratingDelta,
      totalSteps,
      reason,
    };

    const newStats: UserStats = {
      rating: newRating,
      highestRating: newHighestRating,
      totalGames: stats.totalGames + 1,
      wins: result === 'win' ? stats.wins + 1 : stats.wins,
      losses: result === 'loss' ? stats.losses + 1 : stats.losses,
      draws: result === 'draw' ? stats.draws + 1 : stats.draws,
      currentStreak: newStreak,
      highestStreak: newHighestStreak,
      history: [historyItem, ...stats.history].slice(0, 50), // 保留最近 50 场
    };

    setStats(newStats);
    saveUserStats(newStats);

    return ratingDelta;
  }, [stats]);

  const resetStats = useCallback(() => {
    const freshStats: UserStats = {
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
    setStats(freshStats);
    saveUserStats(freshStats);
  }, []);

  return {
    stats,
    currentTier,
    nextTier,
    progress,
    recordGameResult,
    resetStats,
  };
}
