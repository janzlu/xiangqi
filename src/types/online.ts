import { Move, PieceColor } from './chess';

export type RoomRole = 'host' | 'guest';

export type OnlineConnectionState =
  | 'idle'
  | 'generating_room'
  | 'waiting_peer'
  | 'connecting'
  | 'connected'
  | 'peer_disconnected'
  | 'error';

export type OnlineColorChoice = 'red' | 'black' | 'random';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'peer' | 'system';
  text: string;
  time: string;
  isPreset?: boolean;
}

export type P2PMessage =
  | {
      type: 'HANDSHAKE_INIT';
      payload: {
        hostColorChoice: OnlineColorChoice;
        assignedHostColor: PieceColor;
        assignedGuestColor: PieceColor;
        hostName: string;
      };
    }
  | {
      type: 'HANDSHAKE_ACK';
      payload: {
        guestName: string;
      };
    }
  | {
      type: 'GUEST_READY';
      payload?: {
        guestName?: string;
      };
    }
  | {
      type: 'MOVE';
      payload: {
        move: Move;
        notation: string;
      };
    }
  | {
      type: 'OFFER_DRAW_REQUEST';
    }
  | {
      type: 'OFFER_DRAW_RESPONSE';
      payload: {
        accepted: boolean;
      };
    }
  | {
      type: 'RESIGN';
    }
  | {
      type: 'RESTART_REQUEST';
    }
  | {
      type: 'RESTART_RESPONSE';
      payload: {
        accepted: boolean;
      };
    }
  | {
      type: 'URGE_MOVE';
      payload: {
        senderName: string;
      };
    }
  | {
      type: 'CHAT';
      payload: {
        text: string;
        isPreset?: boolean;
      };
    }
  | {
      type: 'HEARTBEAT';
    };

export const PRESET_CHAT_PHRASES = [
  '妙招！这步棋颇有深意。',
  '容我深思熟虑一番。',
  '承让承让，棋逢对手！',
  '大意失荆州，好棋！',
  '楚河汉界，残局见真章。',
  '快快落子，等得望穿秋水啦～',
  '势均力敌，阁下棋艺不凡！',
  '再弈一局，痛快切磋！',
] as const;
