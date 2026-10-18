import { describe, it, expect } from 'vitest';
import { generateRoomCode, formatRoomId } from '../services/peerService';
import { P2PMessage, PRESET_CHAT_PHRASES } from '../types/online';

describe('Online Multiplayer P2P Protocol & Helpers', () => {
  it('generates valid 6-character uppercase room codes without ambiguous characters', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(code).not.toMatch(/[0O1I]/); // 确认过滤易混淆字符
    }
  });

  it('formats room id with canonical prefix', () => {
    expect(formatRoomId('AB792C')).toBe('xq-room-v1-AB792C');
    expect(formatRoomId('ab792c')).toBe('xq-room-v1-AB792C');
    expect(formatRoomId('  xq8888 ')).toBe('xq-room-v1-XQ8888');
  });

  it('validates P2P protocol message payloads', () => {
    const handshakeMsg: P2PMessage = {
      type: 'HANDSHAKE_INIT',
      payload: {
        hostColorChoice: 'random',
        assignedHostColor: 'red',
        assignedGuestColor: 'black',
        hostName: '房主',
      },
    };
    expect(handshakeMsg.type).toBe('HANDSHAKE_INIT');
    expect(handshakeMsg.payload.assignedHostColor).toBe('red');
    expect(handshakeMsg.payload.assignedGuestColor).toBe('black');

    const moveMsg: P2PMessage = {
      type: 'MOVE',
      payload: {
        move: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
        notation: '兵五进一',
      },
    };
    expect(moveMsg.type).toBe('MOVE');
    expect(moveMsg.payload.move.to.row).toBe(5);

    const urgeMsg: P2PMessage = {
      type: 'URGE_MOVE',
      payload: { senderName: '好友' },
    };
    expect(urgeMsg.type).toBe('URGE_MOVE');
  });

  it('contains classic Chinese Xiangqi preset phrases', () => {
    expect(PRESET_CHAT_PHRASES.length).toBeGreaterThan(5);
    expect(PRESET_CHAT_PHRASES).toContain('妙招！这步棋颇有深意。');
    expect(PRESET_CHAT_PHRASES).toContain('承让承让，棋逢对手！');
  });
});
