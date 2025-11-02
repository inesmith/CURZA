// src/components/ProgressSummaryBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressSummaryBar({
  text = 'YOU HAVE COMPLETED 4/12 MATH TOPICS',
  width = 420, 
}: { text?: string; width?: number }) {
  return (
    <View style={[s.wrap, { width }]}>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start', 
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  text: {
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
