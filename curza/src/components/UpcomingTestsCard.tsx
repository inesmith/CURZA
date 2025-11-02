// src/components/UpcomingTestsCard.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function UpcomingTestsCard({
  title = 'UPCOMING TESTS',
  subtitle = 'Suggested by AI',
  subtitleWhenEmpty = 'Suggested by AI',
  suggestions = ['AI-SUGGESTED PRACTISE TEST ON WEAK AREAS'],
  onStart,
}: {
  title?: string;
  subtitle?: string;
  subtitleWhenEmpty?: string;
  suggestions?: string[];
  onStart?: () => void;
}) {
  const hasItems = Array.isArray(suggestions) && suggestions.length > 0;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const canStart = hasItems && selectedIdx !== null;

  // stable keys even with duplicate labels
  const keys = useMemo(
    () => suggestions.map((s, i) => `${i}-${s}`),
    [suggestions]
  );

  return (
    <View style={s.card}>
      {/* Title remains constant */}
      <Text style={s.title}>{title}</Text>
      <Text style={s.sub}>{hasItems ? subtitle : subtitleWhenEmpty}</Text>

      <View style={s.content}>
        {hasItems ? (
          suggestions.map((suggestion, i) => {
            const isSelected = selectedIdx === i;
            return (
              <Pressable
                key={keys[i]}
                style={[s.pill, isSelected && s.pillSelected]}
                onPress={() => setSelectedIdx(i)}
              >
                <Text style={s.pillText}>{suggestion}</Text>
              </Pressable>
            );
          })
        ) : (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>NO UPCOMING TESTS</Text>
          </View>
        )}
      </View>

      <Pressable
        style={[s.cta, !canStart && s.ctaDisabled]}
        onPress={onStart}
        disabled={!canStart}
      >
        <Text style={[s.ctaText, !canStart && s.ctaTextDisabled]}>Start</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexGrow: 1,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  title: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  sub: {
    marginTop: 6,
    marginBottom: 10,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#EAB308',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  pillSelected: {
    borderColor: '#FACC15',
    shadowColor: '#FACC15',
  },

  pillText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    lineHeight: 26,
  },

  emptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 14,
    letterSpacing: 0.4,
    opacity: 0.9,
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

  ctaDisabled: {
    backgroundColor: '#9CA3AF',
  },

  ctaText: {
    color: '#111827',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
  },

  ctaTextDisabled: {
    color: '#1F2937',
    opacity: 0.85,
  },
});
