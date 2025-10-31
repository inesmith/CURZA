// src/components/TopicBreakdownBlock.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type TopicItem = {
  label: string;
  score: number;
  color: string;
};

export default function TopicBreakdownBlock({
  topics,
  title = 'TOPIC BREAKDOWN',
}: {
  topics?: TopicItem[];
  title?: string;
}) {
  const data: TopicItem[] =
    topics && topics.length
      ? topics
      : [
          { label: 'Algebra', score: 58, color: '#3B82F6' },
          { label: 'Functions', score: 76, color: '#FACC15' },
          { label: 'Financial Maths', score: 74, color: '#D1D5DB' },
          { label: 'Probability & Statistics', score: 69, color: '#0F172A' },
          { label: 'Trigonometry', score: 81, color: '#F59E0B' },
        ];

  const segments = useMemo(() => {
    const total = Math.max(1, data.reduce((acc, t) => acc + Math.max(0, t.score), 0));
    return data.map((t) => ({
      key: t.label,
      value: Math.max(0, t.score),
      color: t.color,
      pct: Math.max(0, t.score) / total,
    }));
  }, [data]);

  const avg =
    Math.round(
      (data.reduce((a, t) => a + t.score, 0) / Math.max(1, data.length)) * 1
    ) || 0;

  const size = 160;
  const center = size / 2;
  const r = 50;
  const stroke = 20;
  const C = 2 * Math.PI * r;

  let offset = 0;
  const rings = segments.map((seg) => {
    const len = seg.pct * C;
    const el = (
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
    return el;
  });

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
            <Text style={s.centerTop}>Average</Text>
            <Text style={s.centerMain}>{avg}%</Text>
          </View>
        </View>

        <View style={s.legendCol}>
          {data.map((t) => (
            <LegendRow key={t.label} color={t.color} label={t.label} value={t.score} />
          ))}
        </View>
      </View>
    </View>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
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
    width: 405,
    alignSelf: 'flex-start',
  },
  title: {
    textAlign: 'center',
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    marginBottom: 10,
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
    gap: 10,
    padding: 10,
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
