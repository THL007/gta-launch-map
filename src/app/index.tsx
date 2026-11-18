import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LaunchGlobe } from '@/components/launch-globe';
import { color, font, maxWidth, radius, space } from '@/constants/tokens';
import { POSTERS, type Poster } from '@/data/key-art';
import {
  FIRST_DAY_PLAYERS_TOTAL,
  countryStatuses,
  deviceUnlockInstant,
  formatCountdown,
  formatOffset,
  formatPlayers,
  formatUtc,
  playersAt,
  totalPlayersAt,
  zoneClocks,
  type ZoneClock,
} from '@/lib/launch';
import { appNow, useFastNow, useReduceMotion } from '@/lib/clock';

function useNow() {
  const [now, setNow] = useState(appNow);
  useEffect(() => {
    const id = setInterval(() => setNow(appNow()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function deviceZoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'this device';
  } catch {
    return 'this device';
  }
}

export default function LaunchMap() {
  const now = useNow();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 960;
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

  const clocks = useMemo(() => zoneClocks(now), [now]);
  const statuses = useMemo(() => countryStatuses(clocks), [clocks]);
  const liveCount = clocks.filter((c) => c.status === 'live').length;
  const next = clocks.find((c) => c.status === 'waiting') ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = clocks.find((c) => c.id === selectedId) ?? null;
  const [followKey, setFollowKey] = useState(0);
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState('');

  const contentWidth = Math.min(width, maxWidth) - space.md * 2;
  const globeSize = Math.round(
    wide ? Math.max(560, Math.min(contentWidth, height - 120, 900)) : Math.min(contentWidth, 560),
  );

  const mine = deviceUnlockInstant() - now;
  const reduceMotion = useReduceMotion();
  const filtered = clocks.filter((c) =>
    `${c.country} ${c.place}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const select = useCallback((id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
    scroller.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const follow = () => {
    setSelectedId(null);
    setFollowKey((k) => k + 1);
  };

  return (
    <ScrollView
      ref={scroller}
      style={styles.page}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.stage, { height: globeSize }]}>
            <LaunchGlobe
              size={globeSize}
              now={now}
              clocks={clocks}
              statuses={statuses}
              selected={selected}
              onSelect={select}
              followKey={followKey}
              onManualChange={setManual}
            />
          </View>

          <View style={styles.legend}>
            <Legend swatch={color.live} label="Live" />
            <Legend swatch={color.rolling} label="Partly live" />
            <Legend swatch={color.land} label="Waiting" />
          </View>
          <View style={styles.globeActions}>
            <Text style={styles.small}>Drag to turn the globe. Tap a city to follow it.</Text>
            {manual || selected ? (
              <Pressable accessibilityRole="button" onPress={follow} style={styles.ghost}>
                <Text style={styles.ghostText}>Follow midnight</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.next} accessibilityLiveRegion="polite">
            {next ? (
              <>
                <Text style={styles.small}>Next to go live</Text>
                <Text style={styles.nextCountry}>
                  {next.country}, {next.place}
                </Text>
                <Text style={[styles.bigClock, { fontSize: wide ? 96 : 56, lineHeight: wide ? 100 : 62 }]}>
                  {formatCountdown(next.remainingMs)}
                </Text>
              </>
            ) : (
              <Text style={styles.nextCountry}>Out everywhere.</Text>
            )}
            <Text style={styles.muted}>
              {liveCount} of {clocks.length} regions on this map are live.
            </Text>
          </View>

          <View style={styles.players}>
            <TotalPlayers clocks={clocks} now={now} reduceMotion={reduceMotion} wide={wide} />
            <Text style={styles.small}>
              Estimated players so far, of {formatPlayers(FIRST_DAY_PLAYERS_TOTAL)} by the end of day one.
            </Text>
          </View>
        </View>

        {/* Your clock */}
        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Midnight where you are
          </Text>
          <Text style={[styles.yourClock, { fontSize: wide ? 160 : 72, lineHeight: wide ? 160 : 76 }]}>
            {mine > 0 ? formatCountdown(mine) : 'It’s out.'}
          </Text>
          <Text style={styles.muted}>
            Counted from this device’s clock and time zone, {deviceZoneName()}.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Posters
          </Text>
          <Text style={styles.muted}>Launch art, each file at its own shape.</Text>
          <PosterWall width={contentWidth} wide={wide} />
        </View>

        <View style={styles.section}>
          <Text style={styles.h2} accessibilityRole="header">
            Every region, in launch order
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a country or city"
            placeholderTextColor={color.inkMuted}
            style={styles.search}
            accessibilityLabel="Search a country or city"
            autoCorrect={false}
          />
          {filtered.length === 0 ? (
            <Text style={styles.muted}>No region on this map matches “{query}”.</Text>
          ) : null}
          <View style={[styles.board, wide && styles.boardWide]}>
            {filtered.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`${c.country}, ${c.place}. ${
                  c.status === 'live' ? 'Live' : `Goes live in ${formatCountdown(c.remainingMs)}`
                }. ${formatPlayers(c.players)} players expected on day one. Show on globe.`}
                onPress={() => select(c.id)}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  styles.row,
                  wide && styles.rowWide,
                  hovered && styles.rowHover,
                  pressed && styles.rowPressed,
                  c.id === selectedId && styles.rowSelected,
                ]}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowCountry}>{c.country}</Text>
                  <Text style={styles.small}>
                    {c.place}, {formatOffset(c.offsetMinutes)}
                  </Text>
                  {c.status === 'live' ? (
                    <RegionPlayers clock={c} now={now} reduceMotion={reduceMotion} />
                  ) : (
                    <Text style={styles.small}>{formatPlayers(c.players)} expected</Text>
                  )}
                </View>
                <View style={styles.rowSide}>
                  <Text style={[styles.rowClock, c.status === 'live' && { color: color.live }]}>
                    {c.status === 'live' ? 'Live' : formatCountdown(c.remainingMs)}
                  </Text>
                  <Text style={styles.small}>{formatUtc(c.unlockAt)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

/** The map-wide counter. Re-renders on the fast tick on its own, not the whole page. */
function TotalPlayers({
  clocks,
  now,
  reduceMotion,
  wide,
}: {
  clocks: ZoneClock[];
  now: number;
  reduceMotion: boolean;
  wide: boolean;
}) {
  const fast = useFastNow();
  const total = totalPlayersAt(clocks, reduceMotion ? now : fast);
  return (
    <Text style={[styles.playersTotal, { fontSize: wide ? 64 : 40, lineHeight: wide ? 68 : 44 }]}>
      {formatPlayers(total)}
    </Text>
  );
}

function RegionPlayers({ clock, now, reduceMotion }: { clock: ZoneClock; now: number; reduceMotion: boolean }) {
  const fast = useFastNow();
  return (
    <Text style={[styles.small, styles.regionPlayers]}>
      {formatPlayers(playersAt(clock, reduceMotion ? now : fast))} playing
    </Text>
  );
}

function PosterFrame({ art, width }: { art: Poster; width: number }) {
  const frameWidth = Math.min(width, art.maxWidth);
  const frameHeight = Math.round(frameWidth * (art.height / art.width));
  return (
    <Image
      source={art.source}
      accessibilityLabel={art.alt}
      contentFit="cover"
      transition={0}
      style={{
        width: frameWidth,
        height: frameHeight,
        borderRadius: radius.md,
        backgroundColor: color.groundRaised,
      }}
    />
  );
}

function PosterWall({ width, wide }: { width: number; wide: boolean }) {
  const [duo, collage, lockup, map] = POSTERS;
  const mapWidth = Math.min(width, map.maxWidth);
  const lockupWidth = wide ? width - mapWidth - space.lg : width;

  return (
    <View style={styles.posterWall}>
      <PosterFrame art={duo} width={width} />
      <PosterFrame art={collage} width={width} />
      <View style={wide ? styles.posterRow : styles.posterWall}>
        <PosterFrame art={lockup} width={Math.max(lockupWidth, 0)} />
        <PosterFrame art={map} width={mapWidth} />
      </View>
    </View>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: swatch }]} />
      <Text style={styles.small}>{label}</Text>
    </View>
  );
}

const body: TextStyle = { fontFamily: font.body, color: color.ink, fontSize: 16, lineHeight: 24 };
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
const rowBase: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: space.md,
  paddingVertical: space.md,
  paddingHorizontal: space.md,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: 'transparent',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.ground },
  container: { width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: space.md },
  small: { ...body, fontSize: 14, lineHeight: 20, color: color.inkMuted },
  muted: { ...body, color: color.inkMuted },

  hero: { paddingTop: space.xl, gap: space.lg, alignItems: 'center' },
  stage: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  posterWall: { gap: space.lg },
  posterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },

  next: { gap: space.xs, alignItems: 'center', paddingTop: space.lg },
  nextCountry: { fontFamily: font.display, color: color.rolling, fontSize: 32, lineHeight: 36, textAlign: 'center' },
  bigClock: { fontFamily: font.display, color: color.ink, ...tabular },
  players: { gap: space.xs, alignItems: 'center' },
  playersTotal: { fontFamily: font.display, color: color.live, letterSpacing: -1, textAlign: 'center', ...tabular },
  regionPlayers: { color: color.live, ...tabular },

  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendSwatch: { width: 14, height: 14, borderRadius: 3 },
  globeActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.md },
  ghost: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.midnight,
  },
  ghostText: { fontFamily: font.bodyStrong, color: color.midnight, fontSize: 14 },

  section: { paddingTop: space.xxl, gap: space.md },
  h2: { fontFamily: font.display, color: color.ink, fontSize: 32, lineHeight: 36 },
  yourClock: { fontFamily: font.display, color: color.live, letterSpacing: -2, ...tabular },

  search: {
    ...body,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.groundRaised,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    maxWidth: 420,
  },
  board: { gap: space.xs },
  boardWide: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg },
  row: { ...rowBase, borderBottomColor: color.line },
  rowWide: { width: '48%' },
  rowHover: { backgroundColor: color.groundRaised },
  rowPressed: { opacity: 0.8 },
  rowSelected: { borderColor: color.midnight },
  rowMain: { flexShrink: 1, minWidth: 0 },
  rowSide: { alignItems: 'flex-end' },
  rowCountry: { ...body, fontFamily: font.bodyStrong },
  rowClock: { fontFamily: font.display, color: color.ink, fontSize: 22, ...tabular },
});
