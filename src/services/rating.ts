import { RankTier } from '../types/score';
import { RANK_TIERS } from '../core/constants';

export function getRankTier(rating: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (rating >= RANK_TIERS[i].minRating) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function getNextRankTier(rating: number): { nextTier: RankTier | null; progress: number } {
  const currentTier = getRankTier(rating);
  const currentIndex = RANK_TIERS.findIndex(t => t.id === currentTier.id);

  if (currentIndex >= RANK_TIERS.length - 1) {
    return { nextTier: null, progress: 100 };
  }

  const nextTier = RANK_TIERS[currentIndex + 1];
  const span = nextTier.minRating - currentTier.minRating;
  const currentDiff = rating - currentTier.minRating;
  const progress = Math.min(100, Math.max(0, Math.round((currentDiff / span) * 100)));

  return { nextTier, progress };
}

/**
 * 计算 Elo 积分变动
 */
export function calculateRatingChange(
  userRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
  currentStreak: number
): number {
  // K-factor 随段位动态调整
  let k = 32;
  if (userRating >= 1600) k = 24;
  if (userRating >= 1900) k = 16;

  // 预期胜率
  const expected = 1 / (1 + Math.pow(10, (opponentRating - userRating) / 400));

  let actual = 0;
  if (result === 'win') actual = 1;
  else if (result === 'draw') actual = 0.5;
  else actual = 0;

  let delta = Math.round(k * (actual - expected));

  // 连胜额外激励加成
  if (result === 'win') {
    if (currentStreak >= 4) {
      delta += 15;
    } else if (currentStreak >= 2) {
      delta += 8;
    } else if (currentStreak >= 1) {
      delta += 4;
    }
    // 获胜保底加分
    delta = Math.max(6, delta);
  } else if (result === 'loss') {
    // 战败扣分上限保护
    delta = Math.min(-4, delta);
  }

  return delta;
}
