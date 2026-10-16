import { useState, useCallback } from 'react';
import { useXiangqi, GameOverDetails } from './hooks/useXiangqi';
import { useScore } from './hooks/useScore';
import { PieceColor } from './types/chess';
import { Header } from './components/Header';
import { Board } from './components/Board/Board';
import { ScoreCard } from './components/Panels/ScoreCard';
import { ControlBar } from './components/Panels/ControlBar';
import { DifficultySelector } from './components/Panels/DifficultySelector';
import { HistoryLog } from './components/Panels/HistoryLog';
import { GameOverModal } from './components/Modals/GameOverModal';
import { EndgameModal } from './components/Modals/EndgameModal';
import { RuleHelpModal } from './components/Modals/RuleHelpModal';
import { HistoryModal } from './components/Modals/HistoryModal';

export function App() {
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isEndgamesModalOpen, setIsEndgamesModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [lastGameOverReason, setLastGameOverReason] = useState('');
  const [lastRatingChange, setLastRatingChange] = useState(0);

  const {
    stats,
    currentTier,
    nextTier,
    progress,
    recordGameResult,
    resetStats,
  } = useScore();

  const handleGameOver = useCallback((
    gameWinner: PieceColor | null,
    reason: string,
    details: GameOverDetails
  ) => {
    setLastGameOverReason(reason);
    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (gameWinner !== null) {
      result = gameWinner === details.userColor ? 'win' : 'loss';
    }

    const delta = recordGameResult(
      result,
      details.difficulty,
      details.userColor,
      details.totalSteps,
      reason
    );

    setLastRatingChange(delta);
    setIsGameOverModalOpen(true);
  }, [recordGameResult]);

  const {
    board,
    turn,
    playerColor,
    difficulty,
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
  } = useXiangqi({
    onGameOver: handleGameOver,
  });

  const isGameOver =
    gameStatus === 'checkmate' ||
    gameStatus === 'stalemate' ||
    gameStatus === 'resigned' ||
    gameStatus === 'draw';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#18110b] to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 顶部导航 */}
      <Header onOpenHistory={() => setIsHistoryModalOpen(true)} />

      {/* 主对弈区 */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左侧：棋盘区域 */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center">
          <Board
            board={board}
            turn={turn}
            playerColor={playerColor}
            selectedPos={selectedPos}
            validDestinations={validDestinations}
            lastMove={lastMove}
            hintMove={hintMove}
            onSquareClick={handleSquareClick}
            isAiThinking={isAiThinking}
          />
        </section>

        {/* 右侧：状态面板、计分卡、操作栏与棋谱 */}
        <section className="lg:col-span-5 space-y-4 w-full">
          {/* 天梯积分与段位展示 */}
          <ScoreCard
            stats={stats}
            currentTier={currentTier}
            nextTier={nextTier}
            progress={progress}
          />

          {/* 快捷操作控制栏 */}
          <ControlBar
            onUndo={undo}
            onHint={requestHint}
            onRestart={() => restart()}
            onResign={resign}
            onOpenEndgames={() => setIsEndgamesModalOpen(true)}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onToggleSound={toggleSound}
            soundEnabled={soundEnabled}
            canUndo={history.length > 0}
            isAiThinking={isAiThinking}
            isGameOver={isGameOver}
          />

          {/* 难度选择与执子选择 */}
          <DifficultySelector
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            playerColor={playerColor}
            onSelectPlayerColor={c => restart(c)}
            disabled={isAiThinking || history.length > 0}
          />

          {/* 实时走法与对弈日志 */}
          <HistoryLog
            history={history}
            turn={turn}
            playerColor={playerColor}
            gameStatus={gameStatus}
            isAiThinking={isAiThinking}
          />
        </section>
      </main>

      {/* 弹窗层 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        winner={winner}
        playerColor={playerColor}
        reason={lastGameOverReason}
        ratingChange={lastRatingChange}
        newRating={stats.rating}
        onRestart={() => restart()}
        onClose={() => setIsGameOverModalOpen(false)}
      />

      <EndgameModal
        isOpen={isEndgamesModalOpen}
        onSelectChallenge={loadEndgame}
        onClose={() => setIsEndgamesModalOpen(false)}
      />

      <RuleHelpModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        history={stats.history}
        onResetStats={resetStats}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}

export default App;
