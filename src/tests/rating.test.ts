import { describe, it, expect } from 'vitest';
import { calculateRatingChange, getRankTier, getNextRankTier } from '../services/rating';

describe('Rating and Rank Service', () => {
  it('should award positive rating delta on win and negative on loss', () => {
    const userRating = 1200;
    const oppRating = 1400;

    const winDelta = calculateRatingChange(userRating, oppRating, 'win', 0);
    expect(winDelta).toBeGreaterThan(15);

    const lossDelta = calculateRatingChange(userRating, oppRating, 'loss', 0);
    expect(lossDelta).toBeLessThan(0);
  });

  it('should give streak bonus for winning streaks', () => {
    const userRating = 1300;
    const oppRating = 1300;

    const normalWin = calculateRatingChange(userRating, oppRating, 'win', 0);
    const streak2Win = calculateRatingChange(userRating, oppRating, 'win', 2);
    const streak5Win = calculateRatingChange(userRating, oppRating, 'win', 5);

    expect(streak2Win).toBeGreaterThan(normalWin);
    expect(streak5Win).toBeGreaterThan(streak2Win);
  });

  it('should map ratings to correct rank tiers', () => {
    expect(getRankTier(1000).name).toBe('业余九级');
    expect(getRankTier(1200).name).toBe('业余六级');
    expect(getRankTier(1350).name).toBe('业余三级');
    expect(getRankTier(1450).name).toBe('业余一级');
    expect(getRankTier(1600).name).toBe('业余名手');
    expect(getRankTier(1800).name).toBe('棋协大师');
    expect(getRankTier(1950).name).toBe('国家大师');
    expect(getRankTier(2200).name).toBe('特级大师');
  });

  it('should compute progress towards next rank tier', () => {
    const { nextTier, progress } = getNextRankTier(1175);
    // 1175 is between 1100 (业余六级) and 1250 (业余三级)
    // span = 150, diff = 75, progress = 50%
    expect(nextTier?.name).toBe('业余三级');
    expect(progress).toBe(50);
  });
});
