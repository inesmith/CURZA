// src/components/PartialCreditCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PartialCreditCard({
  title = 'PARTIAL CREDIT AWARDED',
  marks = 18,
  summary = 'You received marks for correct steps even when final answers were incorrect.',
  items = [
    'Q2.2 Factorisation — final wrong, 3/5 steps correct → 3/5 marks',
    'Q4.1 Inequality — sign flipped at last step → 2/4 marks',
  ],
}: {
  title?: string;
  marks?: number | string;
  summary?: string;
  items?: string[];
}) {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>

      <View style={s.marksPill}>
        <Text style={s.marksText}>{String(marks)} MARKS</Text>
      </View>

      <View style={s.noteBox}>
        <Text style={s.noteText}>{summary}</Text>
      </View>

      <View style={s.detailBox}>
        {items.map((line, i) => (
          <Text key={`${i}-${line.slice(0,10)}`} style={s.detailText}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 210,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  title: {
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },

  marksPill: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FACC15',
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  marksText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.4,
  },

  noteBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FACC15',
    paddingVertical: 2,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  noteText: {
    color: '#F3F4F6',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
  },

  detailBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FACC15',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  detailText: {
    color: '#E5E7EB',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
});
