import { Peer, DataConnection } from 'peerjs';
import { P2PMessage } from '../types/online';

const ROOM_ID_PREFIX = 'xq-room-v1-';

// 高可用 STUN 服务器列表（融合全球与国内高速节点）
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.qq.com:3478' },
  { urls: 'stun:stun.miwifi.com:3478' },
  { urls: 'stun:stun.chat.bilibili.com:3478' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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

/**
 * 解析自建 PeerJS 信令中继配置
 * 统一走 VPS 上的独立信令服务（xq.firelu.com/peerjs），摆脱公网 Cloudflare 阻断
 */
export function getPeerServerConfig() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : 'xq.firelu.com';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  const host = isLocal ? 'xq.firelu.com' : hostname;
  const port = isLocal
    ? 443
    : window.location.port
    ? Number(window.location.port)
    : window.location.protocol === 'https:'
    ? 443
    : 80;
  const secure = isLocal ? true : window.location.protocol === 'https:';

  return {
    host,
    port,
    path: '/peerjs',
    secure,
    debug: 1,
    config: {
      iceServers: DEFAULT_ICE_SERVERS,
    },
  };
}

export class PeerConnectionManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private heartbeatInterval: number | null = null;
  private connectTimer: number | null = null;
  private pendingQueue: P2PMessage[] = [];

  private startConnectTimeout(onTimeout: () => void, ms = 10000) {
    this.clearConnectTimeout();
    if (typeof window !== 'undefined') {
      this.connectTimer = window.setTimeout(onTimeout, ms);
    }
  }

  private clearConnectTimeout() {
    if (this.connectTimer !== null && typeof window !== 'undefined') {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

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
    const peerConfig = getPeerServerConfig();
    const peer = new Peer(peerId, peerConfig);
    this.peer = peer;

    let isConnected = false;
    this.startConnectTimeout(() => {
      if (!isConnected) {
        callbacks.onError(new Error('连接自建信令服务器超时，请刷新重试或检查网络状态。'));
        this.cleanup();
      }
    });

    peer.on('open', (id) => {
      isConnected = true;
      this.clearConnectTimeout();
      callbacks.onReady(id);
    });

    peer.on('connection', (connection) => {
      this.conn = connection;
      this.bindConnectionEvents(connection, callbacks.onMessage, callbacks.onDisconnected);

      const onChannelOpen = () => {
        callbacks.onGuestConnected(connection);
        this.startHeartbeat();
        this.flushPendingMessages();
      };

      if (connection.open) {
        onChannelOpen();
      } else {
        connection.on('open', onChannelOpen);
      }
    });

    peer.on('error', (err) => {
      this.clearConnectTimeout();
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
    const peerConfig = getPeerServerConfig();
    const peer = new Peer(peerConfig);
    this.peer = peer;

    let isConnected = false;
    this.startConnectTimeout(() => {
      if (!isConnected) {
        callbacks.onError(new Error('连接自建信令服务器超时，请刷新重试或检查网络状态。'));
        this.cleanup();
      }
    });

    peer.on('open', () => {
      isConnected = true;
      this.clearConnectTimeout();
      const targetHostId = formatRoomId(roomCode);
      const connection = peer.connect(targetHostId, {
        reliable: true,
      });
      this.conn = connection;
      this.bindConnectionEvents(connection, callbacks.onMessage, callbacks.onDisconnected);

      const onChannelOpen = () => {
        callbacks.onConnected();
        this.startHeartbeat();
        this.flushPendingMessages();
      };

      if (connection.open) {
        onChannelOpen();
      } else {
        connection.on('open', onChannelOpen);
      }

      connection.on('error', (err) => {
        callbacks.onError(formatPeerError(err));
      });
    });

    peer.on('error', (err) => {
      this.clearConnectTimeout();
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
      try {
        this.conn.send(msg);
        return true;
      } catch (err) {
        console.warn('Failed to send P2P message', err);
        return false;
      }
    }
    // 通道尚未完全打开时放入暂存队列，待 open 事件后立即自动补发
    if (this.conn && !this.conn.open) {
      this.pendingQueue.push(msg);
      return true;
    }
    return false;
  }

  private flushPendingMessages() {
    if (this.conn && this.conn.open && this.pendingQueue.length > 0) {
      const queue = [...this.pendingQueue];
      this.pendingQueue = [];
      for (const m of queue) {
        try {
          this.conn.send(m);
        } catch (e) {
          console.warn('Failed to flush queued P2P message', e);
        }
      }
    }
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
    this.clearConnectTimeout();
    this.stopHeartbeat();
    this.pendingQueue = [];
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
