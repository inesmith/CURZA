import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressSummaryBar({
  text = 'YOU HAVE COMPLETED 4/12 MATH TOPICS',
}: { text?: string }) {
  return (
    <View style={s.wrap}>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#2563EB', // bright blue (matches your mock)
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
