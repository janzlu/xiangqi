import { Peer, DataConnection } from 'peerjs';
import { P2PMessage } from '../types/online';

const ROOM_ID_PREFIX = 'xq-room-v1-';

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

    const peerId = formatRoomId(roomCode);
    const peer = new Peer(peerId, {
      debug: 1,
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
      callbacks.onError(err);
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

    // 客方生成一个随机 Peer ID，然后主动连入房主 Peer ID
    const peer = new Peer({
      debug: 1,
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
        callbacks.onError(err);
      });
    });

    peer.on('error', (err) => {
      callbacks.onError(err);
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
