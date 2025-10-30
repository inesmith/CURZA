import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function FeedbackCard({
  title = 'FEEDBACK',
  subtitle = 'Top 2 Weak Areas',
  areas = ['FRACTIONS', 'ALGEBRA'],
  onView,
}: {
  title?: string;
  subtitle?: string;
  areas?: string[];
  onView?: () => void;
}) {
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.sub}>{subtitle}</Text>

      {areas.slice(0, 2).map((a) => (
        <View key={a} style={s.pill}>
          <Text style={s.pillText}>{a}</Text>
        </View>
      ))}

      <Pressable style={s.cta} onPress={onView}>
        <Text style={s.ctaText}>Practice</Text>
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
    minWidth: 200,
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
  pill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308',
    backgroundColor: 'none',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
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
    letterSpacing: 0.5,
  },
  cta: {
    marginTop: 6,
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
