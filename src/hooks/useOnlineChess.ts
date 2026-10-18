import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BoardState, GameStatus, Move, MoveRecord, PieceColor, Position } from '../types/chess';
import {
  ChatMessage,
  OnlineColorChoice,
  OnlineConnectionState,
  P2PMessage,
  RoomRole,
} from '../types/online';
import { createInitialBoard } from '../core/constants';
import { applyMove, getLegalDestinationsForPosition, getLegalMoves, isInCheck } from '../core/rules';
import { moveToNotation } from '../core/notation';
import { evaluateRepetitionAndRules } from '../core/repetition';
import { generateRoomCode, PeerConnectionManager } from '../services/peerService';
import { soundManager } from '../services/audio';

export interface UseOnlineChessOptions {
  onGameOver?: (winner: PieceColor | null, reason: string) => void;
}

export function useOnlineChess(options?: UseOnlineChessOptions) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [isOnlineActive, setIsOnlineActive] = useState(false);
  const [connectionState, setConnectionState] = useState<OnlineConnectionState>('idle');
  const [roomRole, setRoomRole] = useState<RoomRole | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [myColor, setMyColor] = useState<PieceColor>('red');
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('red');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [gameOverReason, setGameOverReason] = useState('');
  const [history, setHistory] = useState<MoveRecord[]>([]);

  // 聊天与互动
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isDrawOfferModalOpen, setIsDrawOfferModalOpen] = useState(false);

  // 5 分钟超时与催促提醒
  const [secondsInTurn, setSecondsInTurn] = useState(0);
  const [isInactivityAlertOpen, setIsInactivityAlertOpen] = useState(false);
  const [inactivityAlertMessage, setInactivityAlertMessage] = useState('');
  const hasAlertedThisTurnRef = useRef(false);

  const peerMgrRef = useRef<PeerConnectionManager>(new PeerConnectionManager());

  // 清理网络资源
  const cleanup = useCallback(() => {
    peerMgrRef.current.cleanup();
    setIsOnlineActive(false);
    setConnectionState('idle');
    setRoomRole(null);
    setRoomCode('');
    setErrorMessage('');
    setSelectedPos(null);
    setValidDestinations([]);
    setLastMove(null);
    setGameStatus('playing');
    setWinner(null);
    setGameOverReason('');
    setHistory([]);
    setChatMessages([]);
    setIsDrawOfferModalOpen(false);
    setIsInactivityAlertOpen(false);
    setSecondsInTurn(0);
    hasAlertedThisTurnRef.current = false;
  }, []);

  // 5 分钟计时器（每秒刷新）
  useEffect(() => {
    if (!isOnlineActive || connectionState !== 'connected' || gameStatus !== 'playing') {
      return;
    }

    const timer = setInterval(() => {
      setSecondsInTurn(prev => {
        const next = prev + 1;
        // 达到 300 秒（5 分钟）且本回合未曾提醒
        if (next >= 300 && !hasAlertedThisTurnRef.current) {
          hasAlertedThisTurnRef.current = true;
          soundManager.playReminder();

          const isMe = turn === myColor;
          const msg = isMe
            ? '您已思考超过 5 分钟，楚河汉界静候佳着，请留意走子～'
            : '对方思考已超过 5 分钟，系统已向对方播放清脆声音提醒。';

          setInactivityAlertMessage(msg);
          setIsInactivityAlertOpen(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnlineActive, connectionState, gameStatus, turn, myColor]);

  // 执行落子（本地或接收自远端）
  const applyMoveOnline = useCallback((move: Move, isLocal: boolean) => {
    setBoard(currentBoard => {
      const notation = moveToNotation(currentBoard, move);
      const nextBoard = applyMove(currentBoard, move);
      const currentTurn = currentBoard[move.from.row][move.from.col]?.color || 'red';
      const nextTurn: PieceColor = currentTurn === 'red' ? 'black' : 'red';

      // 声音与反馈
      const isEnemyInCheck = isInCheck(nextBoard, nextTurn);
      if (isEnemyInCheck) soundManager.playCheck();
      else if (move.captured) soundManager.playCapture();
      else soundManager.playMove();

      // 检查绝杀与困毙
      const enemyLegalMoves = getLegalMoves(nextBoard, nextTurn);
      let nextStatus: GameStatus = 'playing';
      let gameWinner: PieceColor | null = null;
      let endReason = '';

      if (enemyLegalMoves.length === 0) {
        if (isEnemyInCheck) {
          nextStatus = 'checkmate';
          gameWinner = currentTurn;
          endReason = `${currentTurn === 'red' ? '红方' : '黑方'}绝杀致胜`;
        } else {
          nextStatus = 'stalemate';
          gameWinner = currentTurn;
          endReason = `${nextTurn === 'red' ? '红方' : '黑方'}欠行困毙（判负）`;
        }
      } else if (isEnemyInCheck) {
        nextStatus = 'check';
      }

      setHistory(prevHist => {
        const newRecord: MoveRecord = {
          stepNumber: prevHist.length + 1,
          color: currentTurn,
          move: { ...move, notation, isCheck: isEnemyInCheck },
          notation,
          boardSnapshot: nextBoard,
        };
        const nextHist = [...prevHist, newRecord];

        // 裁决长将与三度重复局面、60 回合自然限着
        if (nextStatus !== 'checkmate' && nextStatus !== 'stalemate') {
          const rep = evaluateRepetitionAndRules(nextHist, nextBoard, nextTurn);
          if (rep.isGameOver) {
            nextStatus = rep.type === 'perpetual_check' ? 'checkmate' : 'draw';
            gameWinner = rep.winner;
            endReason = rep.reason;
          }
        }

        if (nextStatus === 'checkmate' || nextStatus === 'stalemate' || nextStatus === 'draw') {
          setWinner(gameWinner);
          setGameOverReason(endReason);
          optionsRef.current?.onGameOver?.(gameWinner, endReason);
          if (gameWinner === myColor) {
            soundManager.playVictory();
            confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          } else if (gameWinner === null) {
            // 和局
          } else {
            soundManager.playDefeat();
          }
        }

        return nextHist;
      });

      setLastMove(move);
      setSelectedPos(null);
      setValidDestinations([]);
      setTurn(nextTurn);
      setGameStatus(nextStatus);

      // 重置思考计时
      setSecondsInTurn(0);
      hasAlertedThisTurnRef.current = false;

      return nextBoard;
    });

    if (isLocal) {
      peerMgrRef.current.sendMessage({
        type: 'MOVE',
        payload: { move, notation: '' },
      });
    }
  }, [myColor]);

  // 处理接收到的 P2P 报文
  const handleP2PMessage = useCallback((msg: P2PMessage) => {
    switch (msg.type) {
      case 'HANDSHAKE_INIT': {
        // 客方收到房主握手包
        const assignedColor = msg.payload.assignedGuestColor;
        setMyColor(assignedColor);
        setConnectionState('connected');
        setIsOnlineActive(true);
        setBoard(createInitialBoard());
        setTurn('red');
        peerMgrRef.current.sendMessage({
          type: 'HANDSHAKE_ACK',
          payload: { guestName: '好友棋手' },
        });
        setChatMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}`,
            sender: 'system',
            text: `对局已接通！您执【${assignedColor === 'red' ? '红方（先手）' : '黑方（后手）'}】`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        break;
      }

      case 'HANDSHAKE_ACK': {
        // 房主收到客方就绪确认
        setConnectionState('connected');
        setIsOnlineActive(true);
        setChatMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}`,
            sender: 'system',
            text: '好友已入局，对弈正式开启！',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        break;
      }

      case 'MOVE': {
        applyMoveOnline(msg.payload.move, false);
        break;
      }

      case 'URGE_MOVE': {
        soundManager.playReminder();
        setInactivityAlertMessage('对方正在静候您走子，请留意棋局～');
        setIsInactivityAlertOpen(true);
        break;
      }

      case 'OFFER_DRAW_REQUEST': {
        setIsDrawOfferModalOpen(true);
        soundManager.playReminder();
        break;
      }

      case 'OFFER_DRAW_RESPONSE': {
        if (msg.payload.accepted) {
          const reason = '双方协商握手言和（和棋）';
          setGameStatus('draw');
          setWinner(null);
          setGameOverReason(reason);
          optionsRef.current?.onGameOver?.(null, reason);
        } else {
          setChatMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}`,
              sender: 'system',
              text: '对方婉拒了您的求和提议，继续对局。',
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
        break;
      }

      case 'RESIGN': {
        const reason = '对方主动投子认输，您获得了对局胜利！';
        setGameStatus('resigned');
        setWinner(myColor);
        setGameOverReason(reason);
        optionsRef.current?.onGameOver?.(myColor, reason);
        soundManager.playVictory();
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        break;
      }

      case 'CHAT': {
        setChatMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}`,
            sender: 'peer',
            text: msg.payload.text,
            isPreset: msg.payload.isPreset,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        break;
      }
    }
  }, [applyMoveOnline, myColor]);

  // 房主创建房间
  const createRoom = useCallback((colorChoice: OnlineColorChoice) => {
    setErrorMessage('');
    const code = generateRoomCode();
    setRoomCode(code);
    setRoomRole('host');
    setConnectionState('generating_room');

    let hostColor: PieceColor = 'red';
    if (colorChoice === 'random') {
      hostColor = Math.random() < 0.5 ? 'red' : 'black';
    } else {
      hostColor = colorChoice;
    }
    const guestColor: PieceColor = hostColor === 'red' ? 'black' : 'red';
    setMyColor(hostColor);

    peerMgrRef.current.initHost(code, {
      onReady: () => {
        setConnectionState('waiting_peer');
      },
      onGuestConnected: () => {
        setConnectionState('connecting');
        peerMgrRef.current.sendMessage({
          type: 'HANDSHAKE_INIT',
          payload: {
            hostColorChoice: colorChoice,
            assignedHostColor: hostColor,
            assignedGuestColor: guestColor,
            hostName: '房主',
          },
        });
      },
      onMessage: handleP2PMessage,
      onDisconnected: () => {
        setConnectionState('peer_disconnected');
        setChatMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}`,
            sender: 'system',
            text: '对方已断开网络连接或关闭了页面。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      },
      onError: (err) => {
        setErrorMessage(`网络连接异常: ${err.message || '房间码可能冲突或信令故障'}`);
        setConnectionState('error');
      },
    });
  }, [handleP2PMessage]);

  // 客方加入房间
  const joinRoom = useCallback((code: string) => {
    setErrorMessage('');
    const formatted = code.trim().toUpperCase();
    setRoomCode(formatted);
    setRoomRole('guest');
    setConnectionState('connecting');

    peerMgrRef.current.initGuest(formatted, {
      onConnected: () => {
        // 等待接收房主的 HANDSHAKE_INIT
      },
      onMessage: handleP2PMessage,
      onDisconnected: () => {
        setConnectionState('peer_disconnected');
      },
      onError: (err) => {
        setErrorMessage(`加入房间失败: 房间码不存在或对方已离线 (${err.message})`);
        setConnectionState('error');
      },
    });
  }, [handleP2PMessage]);

  // 点击落子与选择（仅在自己回合且属于自己执子时生效）
  const handleSquareClickOnline = useCallback((pos: Position) => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') return;
    if (turn !== myColor) return; // 轮到对方走子时禁点

    const clickedPiece = board[pos.row][pos.col];

    if (selectedPos) {
      const isTargetValid = validDestinations.some(d => d.row === pos.row && d.col === pos.col);
      if (isTargetValid) {
        const move: Move = {
          from: selectedPos,
          to: pos,
          captured: clickedPiece || undefined,
        };
        applyMoveOnline(move, true);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === myColor) {
      setSelectedPos(pos);
      const dests = getLegalDestinationsForPosition(board, pos);
      setValidDestinations(dests);
      return;
    }

    setSelectedPos(null);
    setValidDestinations([]);
  }, [applyMoveOnline, board, gameStatus, myColor, selectedPos, turn, validDestinations]);

  // 催促走棋
  const urgeMove = useCallback(() => {
    peerMgrRef.current.sendMessage({
      type: 'URGE_MOVE',
      payload: { senderName: '好友' },
    });
    setChatMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: 'system',
        text: '您已向对方发送响铃催促提示。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // 求和申请与回应
  const offerDraw = useCallback(() => {
    peerMgrRef.current.sendMessage({ type: 'OFFER_DRAW_REQUEST' });
    setChatMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: 'system',
        text: '已向对方提出和棋提议，等待对方答复...',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const respondDraw = useCallback((accepted: boolean) => {
    setIsDrawOfferModalOpen(false);
    peerMgrRef.current.sendMessage({
      type: 'OFFER_DRAW_RESPONSE',
      payload: { accepted },
    });
    if (accepted) {
      const reason = '双方协商一致，握手言和（和局）';
      setGameStatus('draw');
      setWinner(null);
      setGameOverReason(reason);
      optionsRef.current?.onGameOver?.(null, reason);
    }
  }, []);

  // 认输
  const resign = useCallback(() => {
    if (gameStatus !== 'playing' && gameStatus !== 'check') return;
    const oppColor: PieceColor = myColor === 'red' ? 'black' : 'red';
    const reason = '您主动认输，本局告负。';
    peerMgrRef.current.sendMessage({ type: 'RESIGN' });
    setGameStatus('resigned');
    setWinner(oppColor);
    setGameOverReason(reason);
    optionsRef.current?.onGameOver?.(oppColor, reason);
    soundManager.playDefeat();
  }, [gameStatus, myColor]);

  // 发送聊天/快捷短语
  const sendChatMessage = useCallback((text: string, isPreset: boolean = false) => {
    peerMgrRef.current.sendMessage({
      type: 'CHAT',
      payload: { text, isPreset },
    });
    setChatMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: 'me',
        text,
        isPreset,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  return {
    isOnlineActive,
    connectionState,
    roomRole,
    roomCode,
    errorMessage,
    myColor,
    board,
    turn,
    selectedPos,
    validDestinations,
    lastMove,
    gameStatus,
    winner,
    gameOverReason,
    history,
    chatMessages,
    secondsInTurn,
    isDrawOfferModalOpen,
    isInactivityAlertOpen,
    inactivityAlertMessage,
    createRoom,
    joinRoom,
    leaveRoom: cleanup,
    handleSquareClickOnline,
    urgeMove,
    offerDraw,
    respondDraw,
    resign,
    sendChatMessage,
    closeInactivityAlert: () => setIsInactivityAlertOpen(false),
  };
}
