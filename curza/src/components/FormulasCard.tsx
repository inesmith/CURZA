import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FormulasCard({
  title = 'FORMULAS',
  formulas = [],
}: {
  title?: string;
  formulas: string[];
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>

      {formulas.map((f, i) => (
        <View key={`${i}-${f.slice(0,12)}`} style={s.pill}>
          <Text style={s.pillText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    minWidth: 380,
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
    borderColor: '#EAB308',
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
    textAlign: 'center',
  },
});
