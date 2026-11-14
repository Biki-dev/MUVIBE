/**
 * src/services/blitz-room.ts
 * ─────────────────────────────────────────────────────────────────
 * Private Blitz rooms over Supabase Realtime.
 *
 * A room is one Realtime channel named after its code. Nothing is
 * written to Postgres, so this needs no migration and no new table:
 *
 *   presence   who is in the room, plus their live score. Presence
 *              gives join and leave for free, so a player closing the
 *              app simply disappears from the lobby.
 *   broadcast  the single "start" event the host sends, carrying the
 *              bout format and the start time everyone counts from.
 *
 * Both phones must be signed in to the same Supabase project, which
 * they are: the anon key is baked into the build.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BlitzMode } from '@/types/blitz';

/** Unambiguous alphabet: no O/0, no I/1. Codes get read aloud. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomCode(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Accepts what the user typed and returns the canonical form, or null. */
export function normaliseRoomCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length < 4 || cleaned.length > 8) return null;
  for (const ch of cleaned) {
    if (!CODE_ALPHABET.includes(ch)) return null;
  }
  return cleaned;
}

export interface BlitzRoomMember {
  id: string;
  name: string;
  elo: number;
  /** Steps or metres so far this bout. */
  score: number;
  finished: boolean;
  /** Epoch ms, used to settle who hosts without a server. */
  joinedAt: number;
}

export interface BlitzRoomState {
  code: string;
  members: BlitzRoomMember[];
  /** True when nobody in the room joined earlier than you. */
  isHost: boolean;
  /** Set once the host starts. Null while still in the lobby. */
  mode: BlitzMode | null;
  /** Epoch ms the bout began, so both phones share one clock. */
  startedAt: number | null;
  connected: boolean;
  error: string | null;
}

export type BlitzRoomListener = (state: BlitzRoomState) => void;

export class BlitzRoom {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private listeners: BlitzRoomListener[] = [];
  private me: BlitzRoomMember;
  private state: BlitzRoomState;
  /** Score is republished at most this often, to stay under rate limits. */
  private lastPublishAt = 0;

  constructor(code: string, me: { id: string; name: string; elo: number }) {
    this.me = { ...me, score: 0, finished: false, joinedAt: Date.now() };
    this.state = {
      code,
      members: [this.me],
      isHost: true,
      mode: null,
      startedAt: null,
      connected: false,
      error: null,
    };
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

  /** Flattens the presence map into a member list, earliest first. */
  private readPresence() {
    if (!this.channel) return;
    const raw = this.channel.presenceState() as Record<string, unknown[]>;
    const members: BlitzRoomMember[] = [];
    for (const entries of Object.values(raw)) {
      for (const entry of entries) {
        const m = entry as Partial<BlitzRoomMember>;
        if (!m || typeof m.id !== 'string') continue;
        members.push({
          id: m.id,
          name: m.name ?? 'Athlete',
          elo: m.elo ?? 1500,
          score: m.score ?? 0,
          finished: m.finished ?? false,
          joinedAt: m.joinedAt ?? Date.now(),
        });
      }
    }
    members.sort((a, b) => a.joinedAt - b.joinedAt);

    // Host is whoever has been in the room longest. No server needed,
    // and if the host leaves the next player inherits it.
    const isHost = members.length === 0 || members[0].id === this.me.id;
    this.patch({ members, isHost });
  }

  async join(): Promise<void> {
    if (!isSupabaseConfigured) {
      this.patch({
        error: 'Private rooms need the Supabase keys. Check your .env file.',
      });
      return;
    }

    const channel = supabase.channel(`blitz_room_${this.state.code}`, {
      config: { presence: { key: this.me.id }, broadcast: { self: false } },
    });
    this.channel = channel;

    channel
      .on('presence', { event: 'sync' }, () => this.readPresence())
      .on('presence', { event: 'join' }, () => this.readPresence())
      .on('presence', { event: 'leave' }, () => this.readPresence())
      .on('broadcast', { event: 'start' }, ({ payload }) => {
        const p = payload as { mode?: BlitzMode; startedAt?: number };
        if (!p?.mode || !p?.startedAt) return;
        this.patch({ mode: p.mode, startedAt: p.startedAt });
      });

    await new Promise<void>((resolve) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track(this.me).then(() => {
            this.patch({ connected: true });
            this.readPresence();
            resolve();
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.patch({
            connected: false,
            error: 'Could not reach the room. Check the connection and try again.',
          });
          resolve();
        }
      });
    });
  }

  /**
   * Pushes your live score to the other player. Throttled to once a
   * second, which is as often as the scoreboard needs to move.
   */
  publishScore(score: number, finished: boolean) {
    this.me = { ...this.me, score, finished };
    const now = Date.now();
    if (!finished && now - this.lastPublishAt < 1000) return;
    this.lastPublishAt = now;
    this.channel?.track(this.me);
  }

  /** Host only. Tells everyone which bout to run and when it began. */
  async startBout(mode: BlitzMode): Promise<number> {
    // A second of lead-in so the slower phone still starts on time.
    const startedAt = Date.now() + 1000;
    await this.channel?.send({
      type: 'broadcast',
      event: 'start',
      payload: { mode, startedAt },
    });
    this.patch({ mode, startedAt });
    return startedAt;
  }

  leave() {
    const channel = this.channel;
    this.channel = null;
    this.listeners = [];
    if (channel) {
      channel.untrack().finally(() => supabase.removeChannel(channel));
    }
  }
}
