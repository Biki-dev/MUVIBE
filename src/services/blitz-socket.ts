/**
 * src/services/blitz-socket.ts
 * ─────────────────────────────────────────────────────────────────
 * Private Blitz rooms over a Socket.IO WebSocket.
 *
 * This is the client half of server/index.js. It keeps the same shape
 * as the Supabase Realtime version it replaces, so the Blitz sheet did
 * not have to change much: subscribe to a state snapshot, publish your
 * score, and let the host start the bout.
 *
 * The server holds the room in memory and is the single source of
 * truth for who is in it, who hosts, and when the bout began, which is
 * what keeps two phones counting from the same clock.
 * ─────────────────────────────────────────────────────────────────
 */
import { io, type Socket } from 'socket.io-client';
import { BlitzMode } from '@/types/blitz';

/**
 * Where the socket server lives.
 *
 * A phone cannot reach the laptop on "localhost", so this has to be
 * the machine's LAN address when testing on a device. Set
 * EXPO_PUBLIC_SOCKET_URL in .env to override.
 */
export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

/** Unambiguous alphabet, matching the server. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Accepts what the user typed and returns the canonical form, or null. */
export function normaliseRoomCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== 5) return null;
  for (const ch of cleaned) if (!CODE_ALPHABET.includes(ch)) return null;
  return cleaned;
}

export interface BlitzRoomMember {
  id: string;
  name: string;
  elo: number;
  /** Steps or metres so far this bout. */
  score: number;
  finished: boolean;
  joinedAt: number;
}

export interface BlitzRoomState {
  code: string;
  members: BlitzRoomMember[];
  /** This client's socket id, so the UI can tell which row is you. */
  selfId: string | null;
  /** True when this client is the room's host. */
  isHost: boolean;
  mode: BlitzMode | null;
  /** Epoch ms the bout began, so both phones share one clock. */
  startedAt: number | null;
  connected: boolean;
  error: string | null;
}

export type BlitzRoomListener = (state: BlitzRoomState) => void;

interface ServerState {
  code: string;
  hostId: string;
  mode: BlitzMode | null;
  startedAt: number | null;
  players: BlitzRoomMember[];
}

const EMPTY: BlitzRoomState = {
  code: '',
  members: [],
  selfId: null,
  isHost: false,
  mode: null,
  startedAt: null,
  connected: false,
  error: null,
};

export class BlitzSocketRoom {
  private socket: Socket | null = null;
  private listeners: BlitzRoomListener[] = [];
  private state: BlitzRoomState = { ...EMPTY };
  private me: { name: string; elo: number };
  /** Score is republished at most once a second, to stay light. */
  private lastPublishAt = 0;

  constructor(me: { name: string; elo: number }) {
    this.me = me;
  }

  subscribe(listener: BlitzRoomListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    for (const l of this.listeners) l(this.state);
  }

  private patch(next: Partial<BlitzRoomState>) {
    this.state = { ...this.state, ...next };
    this.emit();
  }

  private adopt(server: ServerState) {
    this.patch({
      code: server.code,
      members: server.players,
      selfId: this.socket?.id ?? null,
      isHost: server.hostId === this.socket?.id,
      mode: server.mode,
      startedAt: server.startedAt,
      error: null,
    });
  }

  /** Opens the WebSocket. Resolves once connected, or on failure. */
  private connect(): Promise<Socket> {
    if (this.socket?.connected) return Promise.resolve(this.socket);

    return new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        // React Native has no long-polling fallback worth using, and
        // forcing websocket skips the HTTP upgrade handshake.
        transports: ['websocket'],
        timeout: 8000,
        reconnectionAttempts: 3,
      });
      this.socket = socket;

      socket.on('connect', () => {
        this.patch({ connected: true, error: null, selfId: socket.id ?? null });
        resolve(socket);
      });

      socket.on('connect_error', (err: Error) => {
        this.patch({
          connected: false,
          error: `Cannot reach the match server at ${SOCKET_URL}. Is it running?`,
        });
        reject(err);
      });

      socket.on('disconnect', () => this.patch({ connected: false }));

      socket.on('room:state', (s: ServerState) => this.adopt(s));

      socket.on('room:started', (p: { mode: BlitzMode; startedAt: number }) => {
        this.patch({ mode: p.mode, startedAt: p.startedAt });
      });

      socket.on('score:state', (p: { players: BlitzRoomMember[] }) => {
        this.patch({ members: p.players });
      });
    });
  }

  /** Hosts a new room. The server picks the code. */
  async create(): Promise<void> {
    try {
      const socket = await this.connect();
      const res = await socket
        .timeout(8000)
        .emitWithAck('room:create', { player: this.me });
      if (res?.ok) this.adopt(res.state);
      else this.patch({ error: res?.error ?? 'Could not create the room.' });
    } catch {
      this.patch({
        connected: false,
        error: `Cannot reach the match server at ${SOCKET_URL}. Is it running?`,
      });
    }
  }

  /** Joins an existing room by code. */
  async join(code: string): Promise<void> {
    try {
      const socket = await this.connect();
      const res = await socket
        .timeout(8000)
        .emitWithAck('room:join', { code, player: this.me });
      if (res?.ok) this.adopt(res.state);
      else this.patch({ error: res?.error ?? 'Could not join that room.' });
    } catch {
      this.patch({
        connected: false,
        error: `Cannot reach the match server at ${SOCKET_URL}. Is it running?`,
      });
    }
  }

  /**
   * Pushes your live score to the room. Throttled to once a second,
   * which is as often as the scoreboard needs to move.
   */
  publishScore(score: number, finished: boolean) {
    const now = Date.now();
    if (!finished && now - this.lastPublishAt < 1000) return;
    this.lastPublishAt = now;
    this.socket?.emit('score:update', { score, finished });
  }

  /** Host only. The server ignores it from anyone else. */
  startBout(mode: BlitzMode) {
    this.socket?.emit('room:start', { mode });
  }

  /** This client's id, as the server knows it. Null before connecting. */
  myId(): string | null {
    return this.socket?.id ?? null;
  }

  /** The other people in the room, from this client's point of view. */
  peers(): BlitzRoomMember[] {
    return this.state.members.filter((m) => m.id !== this.socket?.id);
  }

  leave() {
    this.listeners = [];
    if (this.socket) {
      this.socket.emit('room:leave');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.state = { ...EMPTY };
  }
}
