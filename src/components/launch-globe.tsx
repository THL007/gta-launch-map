import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

import { color, font } from '@/constants/tokens';
import { LAUNCH_ZONES } from '@/data/launch-zones';
import { useFastNow, useReduceMotion } from '@/lib/clock';
import {
  formatCountdown,
  formatPlayers,
  playersAt,
  solarState,
  type CountryStatus,
  type ZoneClock,
} from '@/lib/launch';

type CountryFeature = Feature<Geometry, { name: string }> & { id?: string | number };

const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const COUNTRIES = (feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>)
  .features as CountryFeature[];
const GRATICULE = geoGraticule10();
const TILT = -18;
/** Idle spin: one full turn in four minutes. */
const SPIN_DEG_PER_MS = 360 / 240_000;
/** The spin eases up to speed over this long instead of starting at full pace. */
const SPIN_RAMP_MS = 5000;
/** Slow nod of the tilt while idling: degrees either side, and one full sway. */
const SWAY_DEG = 5;
const SWAY_MS = 70_000;
/** City / midnight camera turns take this long. */
const TWEEN_MS = 3600;

/** Countries split across zones are labelled by city ("Sydney"), the rest by country. */
const SPLIT = new Set(
  LAUNCH_ZONES.map((z) => z.country).filter((c, i, all) => all.indexOf(c) !== i),
);
function shortName(c: ZoneClock) {
  if (!SPLIT.has(c.country)) return c.country === 'United Arab Emirates' ? 'UAE' : c.country;
  return c.place.split(/ \(| and /)[0];
}

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

type Rotation = [number, number];

type Props = {
  size: number;
  now: number;
  clocks: ZoneClock[];
  statuses: Map<string, CountryStatus>;
  selected: ZoneClock | null;
  onSelect: (id: string) => void;
  /** Bumped by the parent to drop a manual drag and follow midnight again. */
  followKey: number;
  onManualChange: (manual: boolean) => void;
};

function fillFor(status: CountryStatus | undefined) {
  if (status === 'live') return color.live;
  if (status === 'rolling') return color.rolling;
  if (status === 'waiting') return color.land;
  return color.groundRaised;
}

/** Shortest-path interpolation between two longitudes. */
function lerpLon(a: number, b: number, t: number) {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function LaunchGlobe({ size, now, clocks, statuses, selected, onSelect, followKey, onManualChange }: Props) {
  const solar = solarState(now);
  const faceMidnight: Rotation = [-solar.midnightLon, TILT];
  const faceSelected: Rotation | null = selected
    ? [-selected.lon, Math.max(-55, Math.min(55, -selected.lat * 0.55))]
    : null;

  const [manual, setManual] = useState<Rotation | null>(null);
  const [view, setView] = useState<Rotation>(faceMidnight);
  const viewRef = useRef(faceMidnight);

  const commit = (next: Rotation) => {
    viewRef.current = next;
    setView(next);
  };

  const reduceMotion = useReduceMotion();
  const fastNow = useFastNow();
  /** Counters move every tick; with reduced motion they keep the once-a-second clock. */
  const countNow = reduceMotion ? now : fastNow;

  useEffect(() => {
    onManualChange(manual != null);
  }, [manual, onManualChange]);

  // "Follow midnight" clears a drag (state adjust during render, same pattern as before).
  const [lastFollowKey, setLastFollowKey] = useState(followKey);
  if (followKey !== lastFollowKey) {
    setLastFollowKey(followKey);
    setManual(null);
  }

  // Slow camera tween when a city is picked or follow-midnight is asked.
  const tweenGoal = manual ? null : faceSelected;
  const tweenKey = manual
    ? `manual`
    : selected
      ? `sel:${selected.id}`
      : `follow:${followKey}`;

  useEffect(() => {
    if (manual || reduceMotion) return;
    const goal = tweenGoal ?? faceMidnight;
    const from = viewRef.current;
    const far = Math.abs(lerpLon(from[0], goal[0], 1) - from[0]) + Math.abs(goal[1] - from[1]) > 1.5;
    if (!far) {
      commit(goal);
      return;
    }
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / TWEEN_MS);
      const e = easeInOutCubic(t);
      commit([lerpLon(from[0], goal[0], e), from[1] + (goal[1] - from[1]) * e]);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // faceMidnight is only the start target when leaving a selection; spin takes over after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tweenKey, reduceMotion]);

  // Slow continuous turn while no city is selected and the user is not dragging.
  const spinning = !manual && !selected && !reduceMotion;
  useEffect(() => {
    if (!spinning) return;
    let frame = 0;
    let last = Date.now();
    // Wait out an in-flight camera tween before drifting.
    const spinStart = Date.now() + TWEEN_MS;
    const tick = () => {
      const nowTs = Date.now();
      if (nowTs >= spinStart) {
        const dt = Math.min(48, nowTs - last);
        const ramp = easeInOutCubic(Math.min(1, (nowTs - spinStart) / SPIN_RAMP_MS));
        const sway = TILT + SWAY_DEG * Math.sin(((nowTs - spinStart) / SWAY_MS) * Math.PI * 2);
        const cur = viewRef.current;
        // Drift toward the swaying tilt rather than snapping to it.
        commit([cur[0] + SPIN_DEG_PER_MS * dt * ramp, cur[1] + (sway - cur[1]) * Math.min(1, dt / 900)]);
      }
      last = nowTs;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spinning, followKey]);

  /* eslint-disable react-hooks/refs -- the handlers read refs only when a gesture fires, never during render */
  const dragStart = useRef<Rotation>(faceMidnight);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          dragStart.current = viewRef.current;
        },
        onPanResponderMove: (_, g) => {
          const k = 180 / size;
          const next: Rotation = [
            dragStart.current[0] + g.dx * k,
            Math.max(-70, Math.min(70, dragStart.current[1] - g.dy * k)),
          ];
          setManual(next);
          commit(next);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [size],
  );
  /* eslint-enable react-hooks/refs */

  const shown: Rotation = manual ?? view;
  const r = size / 2 - 14;
  const projection = useMemo(
    () => geoOrthographic().scale(r).translate([size / 2, size / 2]).clipAngle(90).rotate([shown[0], shown[1], 0]),
    [r, size, shown],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const center: [number, number] = [-shown[0], -shown[1]];

  const countryPaths = useMemo(
    () =>
      COUNTRIES.map((f) => {
        const iso = String(f.id ?? '').padStart(3, '0');
        return { key: `${iso}-${f.properties.name}`, d: path(f) ?? '', fill: fillFor(statuses.get(iso)) };
      }),
    [path, statuses],
  );

  const nightD = path(geoCircle().center([normalise(solar.sunLon + 180), -solar.sunLat]).radius(90)()) ?? '';

  const markers = clocks
    .filter((c) => geoDistance([c.lon, c.lat], center) < Math.PI / 2 - 0.05)
    .map((c) => ({ c, xy: projection([c.lon, c.lat]) }))
    .filter((m): m is { c: ZoneClock; xy: [number, number] } => m.xy != null);

  const sel = selected ? markers.find((m) => m.c.id === selected.id) : undefined;

  const fs = Math.max(11, Math.round(size * 0.017));
  const chipH = fs * 2 + 14;
  const taken: Box[] = sel ? [{ x: sel.xy[0] - 14, y: sel.xy[1] - 30, w: size * 0.36, h: 72 }] : [];
  const chips: { c: ZoneClock; box: Box; name: string; line: string }[] = [];
  const order = [...markers]
    .filter((m) => m.c.id !== selected?.id)
    .sort((a, b) => {
      if (a.c.status !== b.c.status) return a.c.status === 'waiting' ? -1 : 1;
      return a.c.status === 'waiting' ? a.c.remainingMs - b.c.remainingMs : b.c.unlockAt - a.c.unlockAt;
    });
  for (const m of order) {
    const name = shortName(m.c);
    const line = m.c.status === 'live' ? formatPlayers(playersAt(m.c, countNow)) : formatCountdown(m.c.remainingMs);
    // Sized for the region's full first-day figure, so chips do not jump as the count grows.
    const widest = m.c.status === 'live' ? formatPlayers(m.c.players) : line;
    const w = Math.max(name.length, widest.length) * fs * 0.6 + 16;
    const right: Box = { x: m.xy[0] + 8, y: m.xy[1] - chipH / 2, w, h: chipH };
    const left: Box = { x: m.xy[0] - 8 - w, y: right.y, w, h: chipH };
    const fits = (b: Box) => b.x >= 2 && b.x + b.w <= size - 2 && b.y >= 2 && b.y + b.h <= size - 2;
    const box = [right, left].find((b) => fits(b) && !taken.some((t) => overlaps(t, b)));
    if (!box) continue;
    taken.push(box);
    chips.push({ c: m.c, box, name, line });
  }

  return (
    <View
      {...pan.panHandlers}
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Globe showing where GTA VI has unlocked, with estimated first-day players per region.">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="sea" cx="38%" cy="32%" r="70%">
            <Stop offset="0" stopColor={color.ocean} stopOpacity={1} />
            <Stop offset="1" stopColor={color.oceanDeep} stopOpacity={1} />
          </RadialGradient>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0.86" stopColor={color.midnight} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color.midnight} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="shade" cx="36%" cy="30%" r="75%">
            <Stop offset="0.55" stopColor={color.night} stopOpacity={0} />
            <Stop offset="1" stopColor={color.night} stopOpacity={0.55} />
          </RadialGradient>
        </Defs>

        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#halo)" />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="url(#sea)" />
        <Path d={path(GRATICULE) ?? ''} stroke={color.midnight} strokeOpacity={0.12} strokeWidth={0.6} fill="none" />

        <G>
          {countryPaths.map((p) => (
            <Path key={p.key} d={p.d} fill={p.fill} stroke={color.ground} strokeWidth={0.5} />
          ))}
        </G>

        <Path d={nightD} fill={color.night} fillOpacity={0.42} />

        {markers.map(({ c, xy }) => (
          <Circle
            key={c.id}
            cx={xy[0]}
            cy={xy[1]}
            r={c.id === selected?.id ? 6 : 3.5}
            fill={c.status === 'live' ? color.live : color.ink}
            stroke={color.ground}
            strokeWidth={1.2}
            onPress={() => onSelect(c.id)}
          />
        ))}

        <Circle cx={size / 2} cy={size / 2} r={r} fill="url(#shade)" pointerEvents="none" />

        <G pointerEvents="none">
          {chips.map(({ c, box, name, line }) => (
            <G key={`chip-${c.id}`}>
              <Rect x={box.x} y={box.y} width={box.w} height={box.h} rx={4} fill={color.ground} fillOpacity={0.82} />
              <SvgText x={box.x + 7} y={box.y + fs + 2} fontSize={fs} fontFamily={font.bodyStrong} fill={color.ink}>
                {name}
              </SvgText>
              <SvgText
                x={box.x + 7}
                y={box.y + fs * 2 + 4}
                fontSize={fs}
                fontFamily={font.bodyStrong}
                fill={c.status === 'live' ? color.live : color.rolling}>
                {line}
              </SvgText>
            </G>
          ))}
        </G>

        {sel ? (
          <G pointerEvents="none">
            <Circle cx={sel.xy[0]} cy={sel.xy[1]} r={12} stroke={color.ink} strokeWidth={1.5} fill="none" />
            <SvgText
              x={sel.xy[0] + 18}
              y={sel.xy[1] - 8}
              fill={color.ink}
              fontFamily={font.display}
              fontSize={Math.max(14, size * 0.03)}>
              {sel.c.place}
            </SvgText>
            <SvgText
              x={sel.xy[0] + 18}
              y={sel.xy[1] + Math.max(12, size * 0.026)}
              fill={sel.c.status === 'live' ? color.live : color.rolling}
              fontFamily={font.bodyStrong}
              fontSize={Math.max(12, size * 0.024)}>
              {sel.c.status === 'live' ? 'Live now' : formatCountdown(sel.c.remainingMs)}
            </SvgText>
            <SvgText
              x={sel.xy[0] + 18}
              y={sel.xy[1] + Math.max(28, size * 0.052)}
              fill={color.inkMuted}
              fontFamily={font.body}
              fontSize={Math.max(11, size * 0.02)}>
              {sel.c.status === 'live'
                ? `${formatPlayers(playersAt(sel.c, countNow))} playing`
                : `${formatPlayers(sel.c.players)} expected on day one`}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

function normalise(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}
