import { BoardState, PieceColor } from '../types/chess';
import { AIMoveResult, DifficultyConfig } from '../types/ai';
import { findBestMove } from './search';

let worker: Worker | null = null;
let currentTaskId = 0;
const pendingTasks = new Map<number, (res: AIMoveResult) => void>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!worker) {
    try {
      worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ id: number; result: AIMoveResult }>) => {
        const cb = pendingTasks.get(e.data.id);
        if (cb) {
          pendingTasks.delete(e.data.id);
          cb(e.data.result);
        }
      };
      worker.onerror = () => {
        worker = null;
      };
    } catch {
      worker = null;
    }
  }
  return worker;
}

/**
 * 异步计算 AI 走法：优先使用独立 Web Worker 线程，零阻塞主渲染循环；
 * 若在无 Worker 环境（如单元测试）则自动安全降级为定时器微切片。
 */
export async function computeAIMoveAsync(
  board: BoardState,
  color: PieceColor,
  config: DifficultyConfig
): Promise<AIMoveResult> {
  const w = getWorker();
  if (w) {
    return new Promise((resolve) => {
      currentTaskId++;
      const taskId = currentTaskId;
      pendingTasks.set(taskId, resolve);
      w.postMessage({ id: taskId, board, color, config });
    });
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const result = findBestMove(board, color, config);
      resolve(result);
    }, 10);
  });
}
