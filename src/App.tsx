import { useState, useCallback } from 'react';
import { useXiangqi, GameOverDetails } from './hooks/useXiangqi';
import { useScore } from './hooks/useScore';
import { useOnlineChess } from './hooks/useOnlineChess';
import { PieceColor } from './types/chess';
import { Header } from './components/Header';
import { Board } from './components/Board/Board';
import { ScoreCard } from './components/Panels/ScoreCard';
import { ControlBar } from './components/Panels/ControlBar';
import { DifficultySelector } from './components/Panels/DifficultySelector';
import { OnlinePanel } from './components/Panels/OnlinePanel';
import { HistoryLog } from './components/Panels/HistoryLog';
import { GameOverModal } from './components/Modals/GameOverModal';
import { EndgameModal } from './components/Modals/EndgameModal';
import { RuleHelpModal } from './components/Modals/RuleHelpModal';
import { HistoryModal } from './components/Modals/HistoryModal';
import { LLMConfigModal } from './components/Modals/LLMConfigModal';
import { OnlineRoomModal } from './components/Modals/OnlineRoomModal';
import { InactivityAlertModal } from './components/Modals/InactivityAlertModal';
import { DrawOfferModal } from './components/Modals/DrawOfferModal';

export function App() {
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isEndgamesModalOpen, setIsEndgamesModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLLMConfigModalOpen, setIsLLMConfigModalOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('room');
  });

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

  // 人机/单机对战 Hook
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
    llmConfig,
    setLLMConfig,
    toggleLLMMode,
    latestAiThought,
  } = useXiangqi({
    onGameOver: handleGameOver,
  });

  const handleOnlineGameOver = useCallback((_winner: PieceColor | null, reason: string) => {
    setLastGameOverReason(reason);
    setLastRatingChange(0); // 休闲友谊赛不计天梯分
    setIsGameOverModalOpen(true);
  }, []);

  // 在线双人对战 Hook
  const online = useOnlineChess({
    onGameOver: handleOnlineGameOver,
  });

  const isOnlineMode = online.isOnlineActive && online.connectionState === 'connected';

  // 根据当前模式切换主棋盘数据源
  const activeBoard = isOnlineMode ? online.board : board;
  const activeTurn = isOnlineMode ? online.turn : turn;
  const activePlayerColor = isOnlineMode ? online.myColor : playerColor;
  const activeSelectedPos = isOnlineMode ? online.selectedPos : selectedPos;
  const activeValidDestinations = isOnlineMode ? online.validDestinations : validDestinations;
  const activeLastMove = isOnlineMode ? online.lastMove : lastMove;
  const activeGameStatus = isOnlineMode ? online.gameStatus : gameStatus;
  const activeWinner = isOnlineMode ? online.winner : winner;
  const activeHistory = isOnlineMode ? online.history : history;

  const isGameOver =
    activeGameStatus === 'checkmate' ||
    activeGameStatus === 'stalemate' ||
    activeGameStatus === 'resigned' ||
    activeGameStatus === 'draw';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#18110b] to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 顶部导航 */}
      <Header
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenLLMConfig={() => setIsLLMConfigModalOpen(true)}
        onOpenOnlineRoom={() => setIsOnlineModalOpen(true)}
        isLLMActive={llmConfig.enabled}
        isOnlineActive={isOnlineMode}
        onlineRoomCode={online.roomCode}
      />

      {/* 主对弈区：主棋盘放大居中，其他面板分列两侧 */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[340px_1fr_340px] gap-6 items-center justify-center">
        {/* 左侧区域：单机展示天梯分/难度选择；联机展示在线对局控制与聊天 */}
        <section className="lg:col-span-6 xl:col-span-1 space-y-4 w-full order-2 xl:order-1">
          {!isOnlineMode ? (
            <>
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
                isLLMMode={llmConfig.enabled}
                onToggleLLMMode={toggleLLMMode}
                onOpenLLMConfig={() => setIsLLMConfigModalOpen(true)}
                llmConfig={llmConfig}
              />
            </>
          ) : (
            <OnlinePanel
              roomCode={online.roomCode}
              myColor={online.myColor}
              turn={online.turn}
              secondsInTurn={online.secondsInTurn}
              chatMessages={online.chatMessages}
              onSendMessage={online.sendChatMessage}
              onUrgeMove={online.urgeMove}
              onLeaveRoom={online.leaveRoom}
            />
          )}
        </section>

        {/* 中间核心：放大居中的大棋盘 */}
        <section className="lg:col-span-12 xl:col-span-1 flex flex-col items-center justify-center order-1 xl:order-2 w-full py-1">
          <Board
            board={activeBoard}
            turn={activeTurn}
            playerColor={activePlayerColor}
            selectedPos={activeSelectedPos}
            validDestinations={activeValidDestinations}
            lastMove={activeLastMove}
            hintMove={isOnlineMode ? null : hintMove}
            onSquareClick={isOnlineMode ? online.handleSquareClickOnline : handleSquareClick}
            isAiThinking={isOnlineMode ? false : isAiThinking}
          />
        </section>

        {/* 右侧区域：快捷控制栏与对局棋谱日志 */}
        <section className="lg:col-span-6 xl:col-span-1 space-y-4 w-full order-3 xl:order-3">
          <ControlBar
            onUndo={undo}
            onHint={requestHint}
            onRestart={() => (isOnlineMode ? online.leaveRoom() : restart())}
            onResign={isOnlineMode ? online.resign : resign}
            onOpenEndgames={() => setIsEndgamesModalOpen(true)}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onToggleSound={toggleSound}
            soundEnabled={soundEnabled}
            canUndo={!isOnlineMode && history.length > 0}
            isAiThinking={isOnlineMode ? false : isAiThinking}
            isGameOver={isGameOver}
            isOnline={isOnlineMode}
            onOfferDraw={online.offerDraw}
          />
          <HistoryLog
            history={activeHistory}
            turn={activeTurn}
            playerColor={activePlayerColor}
            gameStatus={activeGameStatus}
            isAiThinking={isOnlineMode ? false : isAiThinking}
            latestAiThought={isOnlineMode ? '' : latestAiThought}
            isLLMMode={!isOnlineMode && llmConfig.enabled}
          />
        </section>
      </main>

      {/* 弹窗层 */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        winner={activeWinner}
        playerColor={activePlayerColor}
        reason={lastGameOverReason}
        ratingChange={lastRatingChange}
        newRating={stats.rating}
        onRestart={() => {
          if (isOnlineMode) {
            online.leaveRoom();
          } else {
            restart();
          }
        }}
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

      <LLMConfigModal
        isOpen={isLLMConfigModalOpen}
        config={llmConfig}
        onSave={setLLMConfig}
        onClose={() => setIsLLMConfigModalOpen(false)}
      />

      {/* 在线对战房间建房/进房弹窗 */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen && !isOnlineMode}
        connectionState={online.connectionState}
        roomCode={online.roomCode}
        errorMessage={online.errorMessage}
        onCreateRoom={online.createRoom}
        onJoinRoom={online.joinRoom}
        onCancel={() => {
          online.leaveRoom();
          setIsOnlineModalOpen(false);
        }}
      />

      {/* 5 分钟超时静止与催促提醒弹窗 */}
      <InactivityAlertModal
        isOpen={online.isInactivityAlertOpen}
        message={online.inactivityAlertMessage}
        isMyTurn={online.turn === online.myColor}
        onClose={online.closeInactivityAlert}
      />

      {/* 对手求和申请确认弹窗 */}
      <DrawOfferModal
        isOpen={online.isDrawOfferModalOpen}
        onAccept={() => online.respondDraw(true)}
        onReject={() => online.respondDraw(false)}
      />
    </div>
  );
}

export default App;
