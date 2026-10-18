import { Peer, DataConnection } from 'peerjs';
import { P2PMessage } from '../types/online';

const ROOM_ID_PREFIX = 'xq-room-v1-';

// 高可用 STUN 服务器列表（融合全球与国内高速节点）
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.chat.bilibili.com:3478' },
];

/**
 * 前置校验浏览器 WebRTC API 支持度
 */
export function checkWebRTCSupport(): { supported: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, error: '非浏览器环境' };
  }

  const hasRTC =
    typeof window.RTCPeerConnection !== 'undefined' ||
    typeof (window as any).webkitRTCPeerConnection !== 'undefined' ||
    typeof (window as any).mozRTCPeerConnection !== 'undefined';

  if (!hasRTC) {
    return {
      supported: false,
      error:
        '当前浏览器 WebRTC 被扩展插件（如 VPN、代理插件、WebRTC 防泄漏扩展）拦截。请在扩展中允许 WebRTC，或在 Chrome 无痕模式中打开本站重试。',
    };
  }

  return { supported: true };
}

/**
 * 将 PeerJS 底层英文错误转译为友好详尽的中文提示
 */
export function formatPeerError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes('The current browser does not support WebRTC') ||
    msg.includes('browser does not support')
  ) {
    return new Error(
      'WebRTC 连接被浏览器扩展拦截（常见于 VPN、代理插件、WebRTC 防泄漏扩展）。请在扩展中关闭 WebRTC 拦截，或使用无痕模式打开本站。'
    );
  }
  if (
    msg.includes('Could not connect to peerjs server') ||
    msg.includes('Lost connection to server')
  ) {
    return new Error('无法连接至 P2P 信令服务器，请检查本地网络或代理设置。');
  }
  if (msg.includes('is taken')) {
    return new Error('该房间码已被占用，请点击“立即创建房间”生成新房间。');
  }

  return err instanceof Error ? err : new Error(msg);
}

/**
 * 生成 6 位大写字母/数字房间码（如 XQ792B）
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆的 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatRoomId(roomCode: string): string {
  return `${ROOM_ID_PREFIX}${roomCode.trim().toUpperCase()}`;
}

export class PeerConnectionManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private heartbeatInterval: number | null = null;

  public initHost(
    roomCode: string,
    callbacks: {
      onReady: (peerId: string) => void;
      onGuestConnected: (conn: DataConnection) => void;
      onMessage: (msg: P2PMessage) => void;
      onDisconnected: () => void;
      onError: (err: Error) => void;
    }
  ) {
    this.cleanup();

    const check = checkWebRTCSupport();
    if (!check.supported) {
      callbacks.onError(new Error(check.error));
      return;
    }

    const peerId = formatRoomId(roomCode);
    const peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    });
    this.peer = peer;

    peer.on('open', (id) => {
      callbacks.onReady(id);
    });

    peer.on('connection', (connection) => {
      this.conn = connection;
      this.bindConnectionEvents(connection, callbacks.onMessage, callbacks.onDisconnected);
      callbacks.onGuestConnected(connection);
      this.startHeartbeat();
    });

    peer.on('error', (err) => {
      callbacks.onError(formatPeerError(err));
    });

    peer.on('disconnected', () => {
      callbacks.onDisconnected();
    });
  }

  public initGuest(
    roomCode: string,
    callbacks: {
      onConnected: () => void;
      onMessage: (msg: P2PMessage) => void;
      onDisconnected: () => void;
      onError: (err: Error) => void;
    }
  ) {
    this.cleanup();

    const check = checkWebRTCSupport();
    if (!check.supported) {
      callbacks.onError(new Error(check.error));
      return;
    }

    // 客方生成一个随机 Peer ID，然后主动连入房主 Peer ID
    const peer = new Peer({
      debug: 1,
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    });
    this.peer = peer;

    peer.on('open', () => {
      const targetHostId = formatRoomId(roomCode);
      const connection = peer.connect(targetHostId, {
        reliable: true,
      });
      this.conn = connection;

      connection.on('open', () => {
        callbacks.onConnected();
        this.bindConnectionEvents(connection, callbacks.onMessage, callbacks.onDisconnected);
        this.startHeartbeat();
      });

      connection.on('error', (err) => {
        callbacks.onError(formatPeerError(err));
      });
    });

    peer.on('error', (err) => {
      callbacks.onError(formatPeerError(err));
    });

    peer.on('disconnected', () => {
      callbacks.onDisconnected();
    });
  }

  private bindConnectionEvents(
    conn: DataConnection,
    onMessage: (msg: P2PMessage) => void,
    onDisconnected: () => void
  ) {
    conn.on('data', (data) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        if (msg && msg.type) {
          if (msg.type !== 'HEARTBEAT') {
            onMessage(msg as P2PMessage);
          }
        }
      } catch (err) {
        console.warn('Failed to parse P2P message', err, data);
      }
    });

    conn.on('close', () => {
      this.stopHeartbeat();
      onDisconnected();
    });

    conn.on('error', () => {
      this.stopHeartbeat();
      onDisconnected();
    });
  }

  public sendMessage(msg: P2PMessage): boolean {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
      return true;
    }
    return false;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.conn && this.conn.open) {
        this.conn.send({ type: 'HEARTBEAT' });
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public cleanup() {
    this.stopHeartbeat();
    if (this.conn) {
      try {
        this.conn.close();
      } catch {
        // ignore
      }
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
  }
}
