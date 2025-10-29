// src/components/TipBoxCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TipBoxCard({
  title = 'TIP BOX',
  tips = [],
}: {
  title?: string;
  tips: string[];
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      <View style={s.tipsWrapper}>
        {tips.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.bullet}>{'\u2022'}</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#2563EB',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginTop: 12,
  },
  title: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  tipsWrapper: {
    flexDirection: 'column',
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    color: '#F3F4F6',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
});
