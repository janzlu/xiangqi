import { Move } from './chess';

export type AIDifficulty = 'novice' | 'intermediate' | 'master' | 'grandmaster';

export interface DifficultyConfig {
  id: AIDifficulty;
  name: string;
  rating: number;
  depth: number;
  description: string;
  useQuiescence: boolean;
  timeLimitMs: number;
}

export interface AIMoveResult {
  bestMove: Move | null;
  score: number;
  depthReached: number;
  nodesEvaluated: number;
  durationMs: number;
}
