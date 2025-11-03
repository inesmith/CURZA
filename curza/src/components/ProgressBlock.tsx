// src/components/ProgressBlock.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Stats = {
  summariesStudied: number;
  chaptersCovered: number;
  quizzesDone?: number;
  testsCompleted: number;
};

export default function ProgressBlock({
  stats,
  title = 'MY PROGRESS',
}: {
  stats: Stats;
  title?: string;
}) {
  const segments = useMemo(() => {
    const s = stats || { summariesStudied: 0, chaptersCovered: 0, testsCompleted: 0 };
    const rawTotal = s.summariesStudied + s.chaptersCovered + s.testsCompleted;
    const total = Math.max(1, rawTotal);

    return [
      { key: 'Summaries Studied', value: s.summariesStudied, color: '#F59E0B' },
      { key: 'Chapters Covered',  value: s.chaptersCovered,  color: '#3B82F6' },
      { key: 'Tests Completed',   value: s.testsCompleted,   color: '#0F172A' },
    ].map((seg) => ({ ...seg, pct: seg.value / total }));
  }, [stats]);

  const size = 160;
  const center = size / 2;
  const r = 50;
  const stroke = 20;
  const C = 2 * Math.PI * r;

  let offset = 0;
  const rings = segments.map((seg) => {
    const len = seg.pct * C;
    const circle = (
      <Circle
        key={seg.key}
        cx={center}
        cy={center}
        r={r}
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        transform={`rotate(-90 ${center} ${center})`}
      />
    );
    offset -= len;
    return circle;
  });

  const totalDone =
    (stats?.summariesStudied ?? 0) +
    (stats?.chaptersCovered ?? 0) +
    (stats?.testsCompleted ?? 0);

  const overallPct = totalDone === 0
    ? 0
    : Math.round(segments.reduce((acc, seg) => acc + seg.pct, 0) * 25);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>

      <View style={s.card}>
        <View style={s.chartCol}>
          <Svg width={size} height={size}>
            <Circle
              cx={center}
              cy={center}
              r={r}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={stroke}
              fill="transparent"
            />
            {rings}
          </Svg>

          <View style={s.centerLabel}>
            <Text style={s.centerTop}>Overall</Text>
            <Text style={s.centerMain}>{overallPct}%</Text>
          </View>
        </View>

        <View style={s.legendCol}>
          <LegendRow color="#F59E0B" label="Summaries Studied" value={stats.summariesStudied} />
          <LegendRow color="#3B82F6" label="Chapters Covered"  value={stats.chaptersCovered} />
          <LegendRow color="#0F172A" label="Tests Completed"   value={stats.testsCompleted} />
        </View>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={s.legendRow}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
      <Text style={s.legendVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    width: 420,
    alignSelf: 'flex-start',
  },
  title: {
    textAlign: 'center',
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    marginBottom: 6,
    marginLeft: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartCol: {
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerTop: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  centerMain: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    marginTop: 2,
  },
  legendCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dot: { width: 9, height: 9, borderRadius: 12, marginRight: 6 },
  legendText: {
    color: '#E5E7EB',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 14,
    flex: 1,
  },
  legendVal: {
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 15,
    marginLeft: 6,
  },
});
