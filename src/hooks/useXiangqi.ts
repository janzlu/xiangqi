import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BoardState, EndgameChallenge, GameStatus, Move, MoveRecord, PieceColor, Position } from '../types/chess';
import { AIDifficulty, DifficultyConfig } from '../types/ai';
import { createInitialBoard, DIFFICULTY_CONFIGS } from '../core/constants';
import { applyMove, getLegalDestinationsForPosition, getLegalMoves, isInCheck } from '../core/rules';
import { moveToNotation } from '../core/notation';
import { fenToBoard } from '../core/fen';
import { computeAIMoveAsync } from '../engine/aiService';
import { soundManager } from '../services/audio';
import { loadUserPreferences, saveUserPreferences } from '../services/storage';

export interface GameOverDetails {
  totalSteps: number;
  userColor: PieceColor;
  difficulty: AIDifficulty;
}

interface UseXiangqiProps {
  onGameOver?: (winner: PieceColor | null, reason: string, details: GameOverDetails) => void;
}

export function useXiangqi({ onGameOver }: UseXiangqiProps = {}) {
  const [prefs] = useState(() => loadUserPreferences());

  const initialBoardRef = useRef<BoardState>(createInitialBoard());
  const initialTurnRef = useRef<PieceColor>('red');

  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('red');
  const [playerColor, setPlayerColor] = useState<PieceColor>(prefs.playerColor);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(prefs.difficulty);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(prefs.soundEnabled);

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [hintMove, setHintMove] = useState<Move | null>(null);

  const difficultyConfig: DifficultyConfig = DIFFICULTY_CONFIGS[difficulty];

  // 同步音效开关
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // 保存偏好设置
  useEffect(() => {
    saveUserPreferences({ soundEnabled, difficulty, playerColor });
  }, [soundEnabled, difficulty, playerColor]);

  // 执行走子逻辑
  const executeMove = useCallback((move: Move) => {
    const notation = moveToNotation(board, move);
    const nextBoard = applyMove(board, move);
    const nextTurn: PieceColor = turn === 'red' ? 'black' : 'red';

    // 声音与反馈
    const isEnemyInCheck = isInCheck(nextBoard, nextTurn);
    if (isEnemyInCheck) {
      soundManager.playCheck();
    } else if (move.captured) {
      soundManager.playCapture();
    } else {
      soundManager.playMove();
    }

    // 检查对方是否还有合法着法
    const enemyLegalMoves = getLegalMoves(nextBoard, nextTurn);
    let nextStatus: GameStatus = 'playing';
    let gameWinner: PieceColor | null = null;
    let endReason = '';

    if (enemyLegalMoves.length === 0) {
      if (isEnemyInCheck) {
        nextStatus = 'checkmate';
        gameWinner = turn;
        endReason = `${turn === 'red' ? '红方' : '黑方'}绝杀致胜`;
      } else {
        nextStatus = 'stalemate';
        gameWinner = turn;
        endReason = `${nextTurn === 'red' ? '红方' : '黑方'}欠行困毙（判负）`;
      }
    } else if (isEnemyInCheck) {
      nextStatus = 'check';
    }

    const newRecord: MoveRecord = {
      stepNumber: history.length + 1,
      color: turn,
      move: { ...move, notation, isCheck: isEnemyInCheck },
      notation,
      boardSnapshot: nextBoard,
    };

    setBoard(nextBoard);
    setLastMove(move);
    setHistory(prev => [...prev, newRecord]);
    setSelectedPos(null);
    setValidDestinations([]);
    setHintMove(null);
    setTurn(nextTurn);
    setGameStatus(nextStatus);

    if (nextStatus === 'checkmate' || nextStatus === 'stalemate') {
      setWinner(gameWinner);
      if (gameWinner === playerColor) {
        soundManager.playVictory();
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      } else {
        soundManager.playDefeat();
      }
      onGameOver?.(gameWinner, endReason, {
        totalSteps: history.length + 1,
        userColor: playerColor,
        difficulty,
      });
    }
  }, [board, turn, history.length, playerColor, difficulty, onGameOver]);

  // 点击选择棋子或落子
  const handleSquareClick = useCallback((pos: Position) => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'resigned') {
      return;
    }
    if (turn !== playerColor || isAiThinking) {
      return; // 电脑走棋回合不可交互
    }

    const clickedPiece = board[pos.row][pos.col];

    // 1. 如果已经选中了自己的棋子，且点击了合法目的地 -> 走子
    if (selectedPos) {
      const isTargetValid = validDestinations.some(
        d => d.row === pos.row && d.col === pos.col
      );

      if (isTargetValid) {
        const move: Move = {
          from: selectedPos,
          to: pos,
          captured: clickedPiece || undefined,
        };
        executeMove(move);
        return;
      }
    }

    // 2. 点击己方棋子 -> 选中并高亮有效目的地
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPos(pos);
      const dests = getLegalDestinationsForPosition(board, pos);
      setValidDestinations(dests);
      return;
    }

    // 3. 点击空白或其他非合法格 -> 取消选中
    setSelectedPos(null);
    setValidDestinations([]);
  }, [board, gameStatus, isAiThinking, playerColor, selectedPos, turn, validDestinations, executeMove]);


  // 电脑自动走棋：轮到电脑时自动计算并落子
  useEffect(() => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') {
      return;
    }

    if (turn !== playerColor) {
      let isCancelled = false;
      queueMicrotask(() => {
        if (!isCancelled) setIsAiThinking(true);
      });

      computeAIMoveAsync(board, turn, difficultyConfig)
        .then(result => {
          if (!isCancelled) {
            setIsAiThinking(false);
            if (result && result.bestMove) {
              executeMove(result.bestMove);
            }
          }
        })
        .catch(err => {
          console.error('AI move execution failed', err);
          if (!isCancelled) {
            setIsAiThinking(false);
          }
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [turn, playerColor, gameStatus, board, difficultyConfig, executeMove]);

  // 悔棋（人机对战模式下回退两步：AI一步 + 玩家一步）
  const undo = useCallback(() => {
    if (isAiThinking || history.length === 0) return;

    let targetIndex = history.length - 1;
    if (turn === playerColor && history.length >= 2) {
      targetIndex = history.length - 3;
    } else {
      targetIndex = history.length - 2;
    }

    if (targetIndex < 0) {
      // 恢复至开局或当前残局起始题面
      setBoard(initialBoardRef.current);
      setTurn(initialTurnRef.current);
      setHistory([]);
      setLastMove(null);
    } else {
      const targetRecord = history[targetIndex];
      setBoard(targetRecord.boardSnapshot);
      setTurn(targetRecord.color === 'red' ? 'black' : 'red');
      setHistory(prev => prev.slice(0, targetIndex + 1));
      setLastMove(targetRecord.move);
    }

    setSelectedPos(null);
    setValidDestinations([]);
    setHintMove(null);
    setGameStatus('playing');
    setWinner(null);
  }, [history, isAiThinking, playerColor, turn]);

  // 重新开局
  const restart = useCallback((newPlayerColor?: PieceColor) => {
    const initB = createInitialBoard();
    initialBoardRef.current = initB;
    initialTurnRef.current = 'red';
    setBoard(initB);
    setTurn('red');
    if (newPlayerColor) setPlayerColor(newPlayerColor);
    setSelectedPos(null);
    setValidDestinations([]);
    setLastMove(null);
    setGameStatus('playing');
    setWinner(null);
    setHistory([]);
    setIsAiThinking(false);
    setHintMove(null);
  }, []);

  // 载入残局挑战
  const loadEndgame = useCallback((challenge: EndgameChallenge) => {
    const { board: loadedBoard, activeColor } = fenToBoard(challenge.fen);
    initialBoardRef.current = loadedBoard;
    initialTurnRef.current = activeColor;
    setBoard(loadedBoard);
    setTurn(activeColor);
    setPlayerColor(challenge.turn);
    setSelectedPos(null);
    setValidDestinations([]);
    setLastMove(null);
    setGameStatus('playing');
    setWinner(null);
    setHistory([]);
    setIsAiThinking(false);
    setHintMove(null);
  }, []);

  // 提示下一步
  const requestHint = useCallback(async () => {
    if (isAiThinking || turn !== playerColor) return;
    setIsAiThinking(true);
    const result = await computeAIMoveAsync(board, turn, {
      ...difficultyConfig,
      depth: Math.max(3, difficultyConfig.depth),
      timeLimitMs: 2000,
    });
    setIsAiThinking(false);
    if (result.bestMove) {
      setHintMove(result.bestMove);
      setSelectedPos(result.bestMove.from);
      setValidDestinations([result.bestMove.to]);
    }
  }, [isAiThinking, turn, playerColor, board, difficultyConfig]);

  // 认输
  const resign = useCallback(() => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') return;
    const resigningColor = playerColor;
    const oppColor: PieceColor = resigningColor === 'red' ? 'black' : 'red';
    setGameStatus('resigned');
    setWinner(oppColor);
    soundManager.playDefeat();
    onGameOver?.(oppColor, `${resigningColor === 'red' ? '红方' : '黑方'}认输`, {
      totalSteps: history.length,
      userColor: playerColor,
      difficulty,
    });
  }, [gameStatus, playerColor, history.length, difficulty, onGameOver]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    board,
    turn,
    playerColor,
    difficulty,
    difficultyConfig,
    soundEnabled,
    selectedPos,
    validDestinations,
    lastMove,
    gameStatus,
    winner,
    history,
    isAiThinking,
    hintMove,
    handleSquareClick,
    undo,
    restart,
    loadEndgame,
    requestHint,
    resign,
    toggleSound,
    setDifficulty,
    setPlayerColor,
  };
}
