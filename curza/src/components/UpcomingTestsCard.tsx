import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function UpcomingTestsCard({
  title = 'UPCOMING TESTS',
  suggestions = ['AI-SUGGESTED PRACTISE TEST ON WEAK AREAS'],
  onStart,
}: {
  title?: string;
  suggestions?: string[];
  onStart?: () => void;
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>

      <View style={s.content}>
        {suggestions.map((suggestion, i) => (
          <View key={i} style={s.pill}>
            <Text style={s.pillText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      <Pressable style={s.cta} onPress={onStart}>
        <Text style={s.ctaText}>Start</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#6B7280',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexGrow: 1,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,

    // 👇 key for spacing
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  title: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    marginBottom: 14,
  },

  pill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308',
    backgroundColor: 'none',
    paddingVertical: 18,
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
    fontSize: 18,
    lineHeight: 26,
  },

  cta: {
    backgroundColor: '#FACC15',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#111827',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  ctaText: {
    color: '#111827',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
  },
});
