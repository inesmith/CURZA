import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function KeyConceptsCard({
  title = 'KEY CONCEPTS',
  concepts = [],
}: {
  title?: string;
  concepts: string[];
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>

      {concepts.map((c, i) => (
        <View key={`${i}-${c.slice(0,12)}`} style={s.pill}>
          <Text style={s.pillText}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#6B7280', 
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    minWidth: 460,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  pill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308', // soft gold
    backgroundColor: 'none',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#EAB308',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    lineHeight: 26,
  },
});
