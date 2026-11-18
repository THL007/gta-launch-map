import { LAUNCH_DATE, LAUNCH_ZONES, PREMIUM_OPENS_AT, type LaunchZone } from '@/data/launch-zones';
import { FIRST_DAY_PLAYERS_TOTAL, PLAYERS_BY_ZONE } from '@/data/player-estimates';
import { TICK_MS } from '@/lib/clock';

export type ZoneStatus = 'live' | 'waiting';

export type ZoneClock = LaunchZone & {
  unlockAt: number;
  remainingMs: number;
  status: ZoneStatus;
  /** Inside the early window: only its few premium players are in. */
  premium: boolean;
  /** Invented first-day estimate for this region (the total it reaches 24 hours after midnight). */
  players: number;
};

export { FIRST_DAY_PLAYERS_TOTAL };

/** UTC instant of local midnight on launch day for a fixed offset. */
export function unlockInstant(offsetMinutes: number): number {
  const { year, month, day } = LAUNCH_DATE;
  return Date.UTC(year, month - 1, day) - offsetMinutes * 60_000;
}

/** Midnight on launch day in the device's own time zone. */
export function deviceUnlockInstant(): number {
  const { year, month, day } = LAUNCH_DATE;
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

export function zoneClocks(now: number): ZoneClock[] {
  return LAUNCH_ZONES.map((zone) => {
    const unlockAt = unlockInstant(zone.offsetMinutes);
    const remainingMs = unlockAt - now;
    const premium = !!zone.premiumPlayers && remainingMs > 0 && now >= PREMIUM_OPENS_AT;
    return {
      ...zone,
      unlockAt,
      remainingMs,
      status: remainingMs <= 0 ? 'live' : 'waiting',
      premium,
      players: PLAYERS_BY_ZONE[zone.id] ?? 0,
    } as ZoneClock;
  }).sort((a, b) => a.unlockAt - b.unlockAt || a.country.localeCompare(b.country));
}

const DAY_MS = 86_400_000;

/** Stable pseudo-random number in [0, 1) for a region and a step. */
function hash01(seed: string, n: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = Math.imul(h ^ n, 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Share of a region's first-day players reached after `x` days (0..1). Fast rush, then a long tail. */
function rush(x: number, k: number) {
  return (1 - Math.exp(-k * x)) / (1 - Math.exp(-k));
}

/** Premium players join one by one, each at a random moment in the first two hours after premium access opens. */
function premiumAt(c: Pick<ZoneClock, 'id' | 'unlockAt' | 'premiumPlayers'>, now: number): number {
  const n = c.premiumPlayers ?? 0;
  const opens = PREMIUM_OPENS_AT;
  let inside = 0;
  for (let i = 0; i < n; i++) if (now >= opens + hash01(c.id, -1 - i) * 7_200_000) inside++;
  return inside;
}

/**
 * Estimated players in a region at `now`. Before its midnight: only its premium few, if any.
 * From midnight it climbs to its first-day estimate 24 hours later. Each region rushes at
 * its own rate, and every tick adds a random-sized step that never runs backwards.
 */
export function playersAt(
  c: Pick<ZoneClock, 'id' | 'unlockAt' | 'players' | 'premiumPlayers'>,
  now: number,
): number {
  const early = premiumAt(c, now);
  const elapsed = now - c.unlockAt;
  if (elapsed <= 0) return early;
  return early + publicPlayersAt(c, now, elapsed);
}

function publicPlayersAt(c: Pick<ZoneClock, 'id' | 'unlockAt' | 'players'>, now: number, elapsed: number): number {
  if (elapsed >= DAY_MS) return c.players;
  const k = 3 + hash01(c.id, 0) * 3;
  const step = Math.floor(now / TICK_MS);
  const x0 = (step * TICK_MS - c.unlockAt) / DAY_MS;
  const x1 = Math.min(1, x0 + TICK_MS / DAY_MS);
  const base = c.players * rush(Math.max(0, x0), k);
  // Never more than the growth to the next step, so the count only goes up.
  const room = c.players * rush(x1, k) - base;
  return Math.min(c.players, Math.floor(base + hash01(c.id, step) * room));
}

export function totalPlayersAt(clocks: ZoneClock[], now: number): number {
  return clocks.reduce((sum, c) => sum + playersAt(c, now), 0);
}

/** Full player count with thousands separators: 59,660,412. Hand-rolled so Hermes needs no Intl. */
export function formatPlayers(n: number): string {
  return String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Country fill on the globe: every zone live, some live, or none. */
export type CountryStatus = 'live' | 'rolling' | 'waiting';

export function countryStatuses(clocks: ZoneClock[]): Map<string, CountryStatus> {
  const byIso = new Map<string, ZoneClock[]>();
  for (const c of clocks) byIso.set(c.iso, [...(byIso.get(c.iso) ?? []), c]);
  const out = new Map<string, CountryStatus>();
  for (const [iso, list] of byIso) {
    const live = list.filter((c) => c.status === 'live').length;
    out.set(iso, live === list.length ? 'live' : live > 0 ? 'rolling' : 'waiting');
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "27:04:09" style: hours keep counting past 24 so the shape never changes. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '−';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${pad(m)}` : ''}`;
}

/** Unlock moment shown in UTC, e.g. "18 Nov, 11:00 UTC". */
export function formatUtc(instant: number): string {
  const d = new Date(instant);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * Where it is midnight (local solar time) right now, and where the sun sits.
 * Approximate: ignores the equation of time, good to a degree or two, enough to draw.
 */
export function solarState(now: number) {
  const d = new Date(now);
  const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = (now - start) / 86_400_000;
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const sunLon = normaliseLon(-(utcHours - 12) * 15);
  const midnightLon = normaliseLon(sunLon + 180);
  return { sunLon, sunLat: declination, midnightLon };
}

export function normaliseLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}
