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

      {/* 主对弈区：主棋盘放大居中，其他面板分列两侧 */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[340px_1fr_340px] gap-6 items-center justify-center">
        {/* 左侧区域：天梯积分卡与棋力难度选择 */}
        <section className="lg:col-span-6 xl:col-span-1 space-y-4 w-full order-2 xl:order-1">
          <ScoreCard
            stats={stats}
            currentTier={currentTier}
            nextTier={nextTier}
            progress={progress}
          />
          <DifficultySelector
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            playerColor={playerColor}
            onSelectPlayerColor={c => restart(c)}
            disabled={isAiThinking || history.length > 0}
          />
        </section>

        {/* 中间核心：放大居中的大棋盘 */}
        <section className="lg:col-span-12 xl:col-span-1 flex flex-col items-center justify-center order-1 xl:order-2 w-full py-1">
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

        {/* 右侧区域：快捷控制栏与对局棋谱日志 */}
        <section className="lg:col-span-6 xl:col-span-1 space-y-4 w-full order-3 xl:order-3">
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
